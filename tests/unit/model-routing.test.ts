import { describe, expect, it } from "vitest";
import { DEFAULT_INITIAL_DRAFTER_OUTPUT_TOKENS, DEFAULT_RUN_BUDGET_USD, MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS, MAXIMUM_RUN_BUDGET_USD, defaultRunBudgetUsd, estimateRouteCost, initialDrafterOutputTokens, routeFor } from "@/ai/model-routing";

describe("model routing", () => {
  it("uses the finance-first role tiers", () => {
    expect(routeFor("strategist").tier).toBe("medium");
    expect(routeFor("skeptic").tier).toBe("medium");
    expect(routeFor("editor").tier).toBe("medium");
    expect(routeFor("synthesizer").tier).toBe("medium");
    expect(routeFor("initial_drafter").tier).toBe("medium");
    expect(routeFor("strategist").provider).toBe("openai");
    expect(routeFor("initial_drafter").provider).toBe("openai");
    expect(routeFor("strategist", "high").provider).toBe("openai");
  });

  it("does not double-charge reasoning tokens already included in output usage", () => {
    const route = routeFor("strategist");
    const withoutReasoningDetail = estimateRouteCost(route, { inputTokens: 100, outputTokens: 200 });
    const withReasoningDetail = estimateRouteCost(route, {
      inputTokens: 100,
      outputTokens: 200,
      reasoningTokens: 150,
    });
    expect(withReasoningDetail.totalCost).toBe(withoutReasoningDetail.totalCost);
  });

  it("estimates token costs and uses a positive local budget default", () => {
    const estimate = estimateRouteCost(routeFor("strategist"), {
      inputTokens: 1_000_000,
      cachedInputTokens: 100_000,
      outputTokens: 100_000,
      reasoningTokens: 10_000,
    });
    expect(estimate.totalCost).toBeGreaterThan(0);
    expect(estimate.currency).toBe("USD");
    expect(defaultRunBudgetUsd()).toBeGreaterThan(0);
  });

  it("commits the documented safe budget fallbacks", () => {
    expect(DEFAULT_RUN_BUDGET_USD).toBe(0.05);
    expect(MAXIMUM_RUN_BUDGET_USD).toBe(0.25);
  });

  it("uses a bounded, operator-configurable Initial Drafter output allowance", () => {
    const previous = process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS;
    try {
      delete process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS;
      expect(initialDrafterOutputTokens()).toBe(DEFAULT_INITIAL_DRAFTER_OUTPUT_TOKENS);

      process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS = "4500";
      expect(initialDrafterOutputTokens()).toBe(4_500);

      process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS = String(MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS + 1);
      expect(() => initialDrafterOutputTokens()).toThrow(/Initial Drafter output allowance/i);
    } finally {
      if (previous === undefined) delete process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS;
      else process.env.EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS = previous;
    }
  });

  it("rejects invalid pricing instead of allowing a NaN budget comparison", () => {
    expect(() => estimateRouteCost(
      { ...routeFor("strategist"), outputUsdPerMillion: Number.NaN },
      { inputTokens: 100, outputTokens: 100 },
    )).toThrow("Pricing for");
  });
});
