import type { CostEstimate, ModelProvider, ModelRequest, ModelResponse, TokenUsage } from "@/ai/provider";

export class MockModelProvider implements ModelProvider {
  readonly name = "mock";

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const role = request.metadata?.agentRole ?? "unassigned role";
    const text = `Mock response for ${role}.`;
    const inputTokens = request.messages.reduce((total, message) => total + message.content.split(/\s+/).filter(Boolean).length, 0);
    const outputTokens = text.split(/\s+/).length;

    return {
      text,
      structuredOutput: request.responseFormat ? {
        role,
        summary: `${role} reviewed the submitted material using the local deterministic test provider.`,
        confidence: { score: 0.72, reason: "This is a mock review; validate substantive claims before publication." },
        findings: [{ category: "evidence", severity: "medium", location: "overall", observation: "The central claim needs explicit supporting evidence.", recommendation: "Add one concrete example or cited source.", requires_user_judgment: true }],
        strengths: ["The idea has a clear starting point."],
        risks: ["The mock provider cannot verify factual claims."],
        top_recommendations: ["Clarify the intended reader and support the key claim."],
        recommended_action: "Revise the brief or draft before final drafting.",
      } : undefined,
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
