import { describe, expect, it } from "vitest";
import { MockModelProvider } from "@/ai/mock-provider";

describe("MockModelProvider", () => {
  it("returns normalized model response and zero-cost estimate", async () => {
    const provider = new MockModelProvider();
    const response = await provider.generate({
      provider: "mock",
      model: "mock-editorial-v1",
      messages: [{ role: "user", content: "Review this idea." }],
      metadata: { agentRole: "strategist" },
      responseFormat: { type: "object" },
    });

    expect(response.provider).toBe("mock");
    expect(response.model).toBe("mock-editorial-v1");
    expect(response.totalTokens).toBeGreaterThan(0);
    expect(provider.estimateCost(response, response.model).totalCost).toBe(0);
  });
});
