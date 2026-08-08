import { describe, expect, it } from "vitest";
import type { CostEstimate, ModelProvider, ModelRequest, ModelResponse } from "@/ai/provider";
import { CumulativeBudgetProvider } from "@/editorial/grounded-run";

class FixedCostProvider implements ModelProvider {
  readonly name = "fixed-cost";
  calls = 0;

  async generate(request: ModelRequest): Promise<ModelResponse> {
    this.calls += 1;
    return {
      provider: this.name,
      model: request.model,
      text: "{}",
      structuredOutput: {},
      inputTokens: 10,
      outputTokens: 10,
      totalTokens: 20,
    };
  }

  estimateCost(): CostEstimate {
    return { inputCost: 0.003, outputCost: 0.003, totalCost: 0.006, currency: "USD", estimated: true };
  }
}

describe("cumulative live budget", () => {
  it("checks the remaining cap before every provider request", async () => {
    const underlying = new FixedCostProvider();
    const provider = new CumulativeBudgetProvider(underlying, 0.01, true);
    const request: ModelRequest = {
      provider: "fixed-cost",
      model: "cheap-test-model",
      messages: [{ role: "user", content: "test" }],
      maxOutputTokens: 10,
      metadata: { agentRole: "strategist", task: "review" },
    };

    await provider.generate(request);
    await expect(provider.generate({ ...request, metadata: { ...request.metadata, task: "repair" } }))
      .rejects.toThrow("budget would be exceeded");
    expect(underlying.calls).toBe(1);
    expect(provider.attempts).toHaveLength(1);
  });

  it("prices the requested alias while retaining a provider-resolved snapshot model", async () => {
    const estimatedModels: string[] = [];
    const underlying: ModelProvider = {
      name: "resolved-model-test",
      async generate(request) {
        return {
          provider: "resolved-model-test",
          model: `${request.model}-2025-08-07`,
          text: "{}",
          structuredOutput: {},
          inputTokens: 10,
          outputTokens: 10,
        };
      },
      estimateCost(_usage, model) {
        estimatedModels.push(model);
        if (model !== "configured-alias") throw new Error("unexpected resolved model used for pricing");
        return { inputCost: 0.001, outputCost: 0.001, totalCost: 0.002, currency: "USD", estimated: true };
      },
    };
    const provider = new CumulativeBudgetProvider(underlying, 0.01, true);
    const response = await provider.generate({
      provider: "resolved-model-test",
      model: "configured-alias",
      messages: [{ role: "user", content: "test" }],
      maxOutputTokens: 10,
      metadata: { agentRole: "strategist", task: "review", modelTier: "low" },
    });

    expect(response.model).toBe("configured-alias-2025-08-07");
    expect(estimatedModels).toEqual(["configured-alias", "configured-alias"]);
    expect(provider.attempts[0]?.response?.model).toBe("configured-alias-2025-08-07");
  });
});
