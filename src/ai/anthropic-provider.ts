import type { CostContext, CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "@/ai/provider";
import { estimateRouteCost, routeForProviderTier } from "@/ai/model-routing";
import { structuredJsonSchemaFor } from "@/ai/openai-provider";
import { parseStructuredJson } from "@/ai/structured-output";

type FetchLike = typeof fetch;

function safeProviderError(status: number, payload: unknown): Error {
  const error =
    typeof payload === "object" && payload && "error" in payload
      ? (payload as { error?: { type?: string; error_type?: string } }).error
      : undefined;
  const category = error?.type ?? error?.error_type ?? "provider_error";
  return new Error(`Anthropic request failed (${status}; ${category}).`);
}

export class AnthropicMessagesProvider implements ModelProvider {
  readonly name = "anthropic";
  private readonly key: string;
  private readonly requestFetch: FetchLike;

  constructor(options: { apiKey?: string; fetch?: FetchLike } = {}) {
    this.key = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    this.requestFetch = options.fetch ?? fetch;
    if (!this.key) throw new Error("Anthropic is not configured. Set ANTHROPIC_API_KEY in the local server environment.");
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const response = await this.requestFetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: request.maxOutputTokens ?? 1200,
        system: request.systemPrompt,
        messages: request.messages
          .filter((message) => message.role !== "system")
          .map((message) => ({ role: message.role, content: message.content })),
        output_config: request.responseFormat
          ? { format: { type: "json_schema", schema: structuredJsonSchemaFor(request) } }
          : undefined,
        // No client or server tools are supplied. Structured text is validated
        // again locally and receives at most one bounded repair attempt.
      }),
    });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw safeProviderError(response.status, payload);
    const stopReason = String(payload.stop_reason ?? "unknown");
    const content = Array.isArray(payload.content) ? payload.content : [];
    const text = content
      .filter((block): block is { type: string; text?: string } => typeof block === "object" && block !== null)
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("\n")
      .trim();
    if (!text && stopReason !== "refusal") throw new Error("Anthropic response contained no text output.");
    let structuredOutput: unknown;
    if (request.responseFormat) {
      structuredOutput = parseStructuredJson(text);
    }
    const usage = (payload.usage ?? {}) as {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
    };
    const inputTokens = usage.input_tokens ?? 0;
    const cachedInputTokens = usage.cache_read_input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    return {
      text,
      structuredOutput,
      provider: this.name,
      model: String(payload.model ?? request.model),
      providerRequestId: response.headers.get("request-id") ?? undefined,
      inputTokens,
      cachedInputTokens,
      outputTokens,
      totalTokens: inputTokens + cachedInputTokens + outputTokens,
      finishReason: stopReason,
      latencyMs: Date.now() - started,
      rawUsage: { usage, stopReason: payload.stop_reason },
    };
  }

  estimateCost(usage: TokenUsage, model: string, context: CostContext = {}): CostEstimate {
    const tiers = context.tier ? [context.tier] : (["low", "medium", "high"] as const);
    const route = tiers
      .map((tier) => routeForProviderTier("anthropic", tier))
      .find((candidate) => candidate.model === model) ?? routeForProviderTier("anthropic", context.tier ?? "low");
    return estimateRouteCost(route, usage);
  }
}
