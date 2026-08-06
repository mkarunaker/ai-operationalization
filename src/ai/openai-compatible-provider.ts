import type { CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "./provider";

type Options = { name: "openai" | "zenmux"; baseUrl: string; apiKey: string };

export class OpenAiCompatibleProvider implements ModelProvider {
  readonly name: Options["name"];
  private readonly baseUrl: string; private readonly apiKey: string;
  constructor(options: Options) { this.name = options.name; this.baseUrl = options.baseUrl; this.apiKey = options.apiKey; }
  async generate(request: ModelRequest): Promise<ModelResponse> {
    const started = Date.now();
    const response = await fetch(`${this.baseUrl}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: request.model, messages: [{ role: "system", content: request.systemPrompt ?? "" }, ...request.messages], temperature: request.temperature, max_completion_tokens: request.maxOutputTokens, response_format: request.responseFormat ? { type: "json_object" } : undefined }) });
    const payload = await response.json() as { error?: { message?: string }; id?: string; model?: string; choices?: Array<{ message?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; prompt_tokens_details?: { cached_tokens?: number } } };
    if (!response.ok) throw new Error(`${this.name} request failed: ${payload.error?.message ?? response.statusText}`);
    const text = payload.choices?.[0]?.message?.content ?? "";
    let structuredOutput: unknown;
    if (request.responseFormat) { try { structuredOutput = JSON.parse(text); } catch { structuredOutput = undefined; } }
    return { text, structuredOutput, inputTokens: payload.usage?.prompt_tokens, outputTokens: payload.usage?.completion_tokens, totalTokens: payload.usage?.total_tokens, cachedInputTokens: payload.usage?.prompt_tokens_details?.cached_tokens, latencyMs: Date.now() - started, providerRequestId: payload.id, model: payload.model ?? request.model, provider: this.name, finishReason: "stop", rawUsage: payload.usage ?? {} };
  }
  estimateCost(usage: TokenUsage, model: string): CostEstimate { void usage; void model; return { inputCost: 0, outputCost: 0, totalCost: 0, currency: "USD", estimated: true }; }
}
