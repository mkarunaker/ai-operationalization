import type { CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "@/ai/provider";

export class MockModelProvider implements ModelProvider {
  readonly name = "mock";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const text = `Mock response for ${request.metadata?.agentRole ?? "unassigned role"}.`;
    const inputTokens = request.messages.reduce((total, message) => total + message.content.split(/\s+/).filter(Boolean).length, 0);
    const outputTokens = text.split(/\s+/).length;

    return {
      text,
      structuredOutput: request.responseFormat ? { role: request.metadata?.agentRole ?? "mock", summary: text } : undefined,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      latencyMs: 1,
      providerRequestId: "mock-request",
      model: request.model,
      provider: this.name,
      finishReason: "stop",
      rawUsage: { source: "deterministic-mock" },
    };
  }

  estimateCost(usage: TokenUsage, model: string): CostEstimate {
    void model;
    const totalTokens = usage.totalTokens ?? (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0);
    return { inputCost: 0, outputCost: 0, totalCost: totalTokens * 0, currency: "USD", estimated: true };
  }

  async listModels() {
    return [{ id: "mock-editorial-v1", displayName: "Mock Editorial v1" }];
  }
}
