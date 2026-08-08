import type { CostContext, CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "@/ai/provider";
import { estimateRouteCost, routeForProviderTier } from "@/ai/model-routing";
import { parseStructuredJson } from "@/ai/structured-output";

type FetchLike = typeof fetch;

function safeProviderError(status: number, payload: unknown): Error {
  const error =
    typeof payload === "object" && payload && "error" in payload
      ? (payload as { error?: { type?: string; code?: string } }).error
      : undefined;
  const category = error?.code ?? error?.type ?? "provider_error";
  return new Error(`ZenMux request failed (${status}; ${category}).`);
}

/**
 * ZenMux's OpenAI-compatible Chat Completions endpoint. This adapter supplies
 * no tools and uses text JSON plus local schema validation; the model can never
 * execute retrieved or user-provided text.
 */
export class ZenMuxChatCompletionsProvider implements ModelProvider {
  readonly name = "zenmux";
  private readonly key: string;
  private readonly requestFetch: FetchLike;
  private readonly baseUrl: string;

  constructor(options: { apiKey?: string; fetch?: FetchLike; baseUrl?: string } = {}) {
    this.key = options.apiKey ?? process.env.ZENMUX_API_KEY ?? "";
    this.requestFetch = options.fetch ?? fetch;
    this.baseUrl = (options.baseUrl ?? process.env.ZENMUX_BASE_URL ?? "https://zenmux.ai/api/v1").replace(/\/$/, "");
    if (!this.key) throw new Error("ZenMux is not configured. Set ZENMUX_API_KEY in the local server environment.");
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const messages = [
      { role: "system", content: request.systemPrompt },
      ...request.messages.filter((message) => message.role !== "system").map((message) => ({ role: message.role, content: message.content })),
    ];
    const response = await this.requestFetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model,
        messages,
        max_tokens: request.maxOutputTokens ?? 1200,
        temperature: 0.2,
        stream: false,
        // json_object is broadly supported by OpenAI-compatible endpoints.
        // Local Zod validation and one bounded repair enforce the exact shape.
        response_format: request.responseFormat ? { type: "json_object" } : undefined,
        tools: [],
      }),
    });
    const payload = (await response.json()) as Record<string, unknown>;
    if (!response.ok) throw safeProviderError(response.status, payload);
    const choices = Array.isArray(payload.choices) ? payload.choices : [];
    const message = choices[0] as { message?: { content?: unknown }; finish_reason?: unknown } | undefined;
    const finishReason = String(message?.finish_reason ?? "unknown");
    const text = typeof message?.message?.content === "string" ? message.message.content.trim() : "";
    if (!text && finishReason !== "length" && finishReason !== "refusal")
      throw new Error("ZenMux response contained no text output.");
    const usage = (payload.usage ?? {}) as {
      prompt_tokens?: number; completion_tokens?: number; total_tokens?: number;
      prompt_tokens_details?: { cached_tokens?: number }; completion_tokens_details?: { reasoning_tokens?: number };
    };
    return {
      text,
      structuredOutput: request.responseFormat ? parseStructuredJson(text) : undefined,
      provider: this.name,
      model: String(payload.model ?? request.model),
      providerRequestId: typeof payload.id === "string" ? payload.id : undefined,
      inputTokens: usage.prompt_tokens,
      cachedInputTokens: usage.prompt_tokens_details?.cached_tokens,
      outputTokens: usage.completion_tokens,
      reasoningTokens: usage.completion_tokens_details?.reasoning_tokens,
      totalTokens: usage.total_tokens,
      finishReason,
      latencyMs: Date.now() - started,
      rawUsage: { usage, finishReason: message?.finish_reason },
    };
  }

  estimateCost(usage: TokenUsage, model: string, context: CostContext = {}): CostEstimate {
    const tiers = context.tier ? [context.tier] : (["low", "medium", "high"] as const);
    const route = tiers
      .map((tier) => routeForProviderTier("zenmux", tier))
      .find((candidate) => candidate.model === model) ?? routeForProviderTier("zenmux", context.tier ?? "low");
    return estimateRouteCost(route, usage);
  }
}
