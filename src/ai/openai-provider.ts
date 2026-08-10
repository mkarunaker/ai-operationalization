import type { CostContext, CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "@/ai/provider";
import { estimateRouteCost, routeForProviderTier } from "@/ai/model-routing";
import { parseStructuredJson } from "@/ai/structured-output";

type FetchLike = typeof fetch;

type JsonSchema = Record<string, unknown>;

const stringField = { type: "string" } as const;
const conciseStringList = {
  type: "array",
  description: "Return no more than three concise items.",
  items: stringField,
} as const;
const confidenceSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "reason"],
  // Anthropic's grammar-constrained schema format does not support numeric
  // minimum/maximum. The shared local Zod schema continues to enforce 0..1.
  properties: { score: { type: "number" }, reason: stringField },
} as const;

const reviewSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "summary", "confidence", "findings", "strengths", "risks", "top_recommendations", "recommended_action"],
  properties: {
    role: stringField,
    summary: stringField,
    confidence: confidenceSchema,
    findings: {
      type: "array",
      description: "Return no more than three material findings. Prefer fewer, stronger findings.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "severity", "location", "observation", "recommendation", "requires_user_judgment"],
        properties: {
          category: stringField,
          severity: { type: "string", enum: ["low", "medium", "high"] },
          location: stringField,
          observation: stringField,
          recommendation: stringField,
          requires_user_judgment: { type: "boolean" },
        },
      },
    },
    strengths: conciseStringList,
    risks: conciseStringList,
    top_recommendations: conciseStringList,
    recommended_action: stringField,
  },
};

const synthesisSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "summary", "central_thesis", "strongest", "unclear", "counterargument", "evidence_needed", "recommended_changes", "next_step", "confidence"],
  properties: {
    role: { type: "string", enum: ["synthesizer"] },
    summary: stringField,
    central_thesis: stringField,
    strongest: stringField,
    unclear: stringField,
    counterargument: stringField,
    evidence_needed: stringField,
    recommended_changes: conciseStringList,
    next_step: stringField,
    confidence: confidenceSchema,
  },
};

const draftSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "body", "factual_gaps", "voice_rules_applied"],
  properties: {
    role: { type: "string", enum: ["initial_drafter"] },
    body: stringField,
    factual_gaps: conciseStringList,
    voice_rules_applied: conciseStringList,
  },
};

const finalDraftSchema: JsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["role", "body"],
  properties: {
    role: { type: "string", enum: ["final_drafter"] },
    body: stringField,
  },
};

const proofreadSchema: JsonSchema = {
  type: "object", additionalProperties: false, required: ["role", "findings"],
  properties: { role: { type: "string", enum: ["proofreader"] }, findings: { type: "array", maxItems: 6, items: { type: "object", additionalProperties: false, required: ["category", "severity", "current", "suggestion", "rationale"], properties: { category: { type: "string", enum: ["spelling", "grammar", "punctuation", "clarity"] }, severity: { type: "string", enum: ["material", "optional"] }, current: stringField, suggestion: stringField, rationale: stringField } } } },
};

function structuredFormat(request: ModelRequest) {
  const role = request.metadata?.agentRole;
  if (role === "synthesizer") return { type: "json_schema", name: "editorial_synthesis", strict: true, schema: synthesisSchema };
  if (role === "initial_drafter") return { type: "json_schema", name: "initial_draft", strict: true, schema: draftSchema };
  if (role === "final_drafter") return { type: "json_schema", name: "final_draft", strict: true, schema: finalDraftSchema };
  if (role === "proofreader") return { type: "json_schema", name: "proofread", strict: true, schema: proofreadSchema };
  return { type: "json_schema", name: "editorial_review", strict: true, schema: reviewSchema };
}

/** Shared provider-neutral schema selected from the editorial agent role. */
export function structuredJsonSchemaFor(request: ModelRequest): JsonSchema {
  return structuredFormat(request).schema;
}

function safeProviderError(status: number, payload: unknown): Error {
  const error =
    typeof payload === "object" && payload && "error" in payload
      ? (payload as { error?: { type?: string; code?: string } }).error
      : undefined;
  // Code/type are safe categories. Do not expose the provider message, which can
  // contain credential fragments or request details.
  const category = error?.code ?? error?.type ?? "provider_error";
  return new Error(`OpenAI request failed (${status}; ${category}).`);
}

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return "";
  return payload.output
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const content = (item as { content?: unknown }).content;
      return Array.isArray(content) ? content : [];
    })
    .flatMap((part) => {
      if (!part || typeof part !== "object") return [];
      const outputPart = part as { type?: unknown; text?: unknown };
      return outputPart.type === "output_text" && typeof outputPart.text === "string"
        ? [outputPart.text]
        : [];
    })
    .join("");
}

function responseRefused(payload: Record<string, unknown>) {
  if (!Array.isArray(payload.output)) return false;
  return payload.output.some((item) => {
    if (!item || typeof item !== "object") return false;
    const content = (item as { content?: unknown }).content;
    return Array.isArray(content) && content.some(
      (part) => Boolean(part && typeof part === "object" && (part as { type?: unknown }).type === "refusal"),
    );
  });
}

export class OpenAIResponsesProvider implements ModelProvider {
  readonly name = "openai";
  private readonly key: string;
  private readonly requestFetch: FetchLike;

  constructor(options: { apiKey?: string; fetch?: FetchLike } = {}) {
    this.key = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.requestFetch = options.fetch ?? fetch;
    if (!this.key) throw new Error("OpenAI is not configured. Set OPENAI_API_KEY in the local server environment.");
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const response = await this.requestFetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        instructions: request.systemPrompt,
        input: request.messages.map((message) => ({ role: message.role, content: message.content })),
        max_output_tokens: request.maxOutputTokens ?? 1200,
        store: false,
        tools: [],
        parallel_tool_calls: false,
        reasoning: request.reasoningEffort ? { effort: request.reasoningEffort } : undefined,
        text: request.responseFormat ? { format: structuredFormat(request) } : undefined,
      }),
    });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw safeProviderError(response.status, payload);
    const status = String(payload.status ?? "unknown");
    const text = extractResponseText(payload);
    const refused = responseRefused(payload);
    if (!text && status === "completed" && !refused) throw new Error("OpenAI response contained no output text.");
    let structuredOutput: unknown;
    if (request.responseFormat) {
      structuredOutput = parseStructuredJson(text);
    }
    const usage = (payload.usage ?? {}) as {
      input_tokens?: number;
      output_tokens?: number;
      total_tokens?: number;
      input_tokens_details?: { cached_tokens?: number };
      output_tokens_details?: { reasoning_tokens?: number };
    };
    return {
      text,
      structuredOutput,
      provider: this.name,
      model: String(payload.model ?? request.model),
      providerRequestId: typeof payload.id === "string" ? payload.id : undefined,
      inputTokens: usage.input_tokens,
      cachedInputTokens: usage.input_tokens_details?.cached_tokens,
      outputTokens: usage.output_tokens,
      reasoningTokens: usage.output_tokens_details?.reasoning_tokens,
      totalTokens: usage.total_tokens,
      finishReason: refused ? "refusal" : status,
      latencyMs: Date.now() - started,
      rawUsage: { usage, status, incompleteDetails: payload.incomplete_details },
    };
  }

  estimateCost(usage: TokenUsage, model: string, context: CostContext = {}): CostEstimate {
    const tiers = context.tier ? [context.tier] : (["low", "medium", "high"] as const);
    const route = tiers
      .map((tier) => routeForProviderTier("openai", tier))
      .find((candidate) => candidate.model === model) ?? routeForProviderTier("openai", context.tier ?? "low");
    return estimateRouteCost(route, usage);
  }
}
