import { describe, expect, it } from "vitest";
import { DEFAULT_INITIAL_DRAFTER_OUTPUT_TOKENS, DEFAULT_REVIEWER_OUTPUT_TOKENS, DEFAULT_RUN_BUDGET_USD, DEFAULT_SYNTHESIZER_OUTPUT_TOKENS, MAXIMUM_INITIAL_DRAFTER_OUTPUT_TOKENS, MAXIMUM_REVIEWER_OUTPUT_TOKENS, MAXIMUM_RUN_BUDGET_USD, MAXIMUM_SYNTHESIZER_OUTPUT_TOKENS, defaultRunBudgetUsd, estimateRouteCost, initialDrafterOutputTokens, maximumRunBudgetUsd, reviewerOutputTokens, routeFor, synthesizerOutputTokens } from "@/ai/model-routing";
import { DEFAULT_LIVE_BOARD_QUALITY_PROFILE, resolveLiveBoardQualityProfile, tierForLiveBoardRole } from "@/config/model-routing";

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

  it("commits the approved $0.75 live-run ceiling", () => {
    expect(DEFAULT_RUN_BUDGET_USD).toBe(0.75);
    expect(MAXIMUM_RUN_BUDGET_USD).toBe(0.75);
  });

  it("does not let a local environment value raise the approved hard ceiling", () => {
    const previousDefault = process.env.EDITORIAL_RUN_BUDGET_USD;
    const previousMaximum = process.env.EDITORIAL_MAX_RUN_BUDGET_USD;
    try {
      process.env.EDITORIAL_RUN_BUDGET_USD = "9";
      process.env.EDITORIAL_MAX_RUN_BUDGET_USD = "10";
      expect(maximumRunBudgetUsd()).toBe(0.75);
      expect(defaultRunBudgetUsd()).toBe(0.75);
    } finally {
      if (previousDefault === undefined) delete process.env.EDITORIAL_RUN_BUDGET_USD; else process.env.EDITORIAL_RUN_BUDGET_USD = previousDefault;
      if (previousMaximum === undefined) delete process.env.EDITORIAL_MAX_RUN_BUDGET_USD; else process.env.EDITORIAL_MAX_RUN_BUDGET_USD = previousMaximum;
    }
  });

  it("keeps model selection in two server-owned Board quality profiles", () => {
    expect(DEFAULT_LIVE_BOARD_QUALITY_PROFILE).toBe("balanced");
    expect(tierForLiveBoardRole("initial_drafter", "balanced")).toBe("medium");
    expect(tierForLiveBoardRole("initial_drafter", "frontier_content")).toBe("high");
    expect(tierForLiveBoardRole("strategist", "frontier_content")).toBe("low");
    expect(() => resolveLiveBoardQualityProfile("arbitrary-premium-model")).toThrow(/supported live Board quality profile/i);
  });

  it("records the current OpenAI quality route pricing explicitly", () => {
    expect(routeFor("proofreader")).toMatchObject({ tier: "low", inputUsdPerMillion: 0.2, cachedInputUsdPerMillion: 0.02, outputUsdPerMillion: 1.2 });
    expect(routeFor("initial_drafter")).toMatchObject({ tier: "medium", inputUsdPerMillion: 2, cachedInputUsdPerMillion: 0.2, outputUsdPerMillion: 12 });
    expect(routeFor("initial_drafter", "high")).toMatchObject({ tier: "high", inputUsdPerMillion: 5, cachedInputUsdPerMillion: 0.5, outputUsdPerMillion: 30 });
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

  it("uses a bounded, operator-configurable reviewer output allowance", () => {
    const previous = process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS;
    try {
      delete process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS;
      expect(reviewerOutputTokens()).toBe(DEFAULT_REVIEWER_OUTPUT_TOKENS);

      process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS = "2200";
      expect(reviewerOutputTokens()).toBe(2_200);

      process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS = String(MAXIMUM_REVIEWER_OUTPUT_TOKENS + 1);
      expect(() => reviewerOutputTokens()).toThrow(/reviewer output allowance/i);
    } finally {
      if (previous === undefined) delete process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS;
      else process.env.EDITORIAL_REVIEWER_MAX_OUTPUT_TOKENS = previous;
    }
  });

  it("uses a bounded, operator-configurable Synthesizer output allowance", () => {
    const previous = process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS;
    try {
      delete process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS;
      expect(synthesizerOutputTokens()).toBe(DEFAULT_SYNTHESIZER_OUTPUT_TOKENS);

      process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS = "2400";
      expect(synthesizerOutputTokens()).toBe(2_400);

      process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS = String(MAXIMUM_SYNTHESIZER_OUTPUT_TOKENS + 1);
      expect(() => synthesizerOutputTokens()).toThrow(/Synthesizer output allowance/i);
    } finally {
      if (previous === undefined) delete process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS;
      else process.env.EDITORIAL_SYNTHESIZER_MAX_OUTPUT_TOKENS = previous;
    }
  });

  it("rejects invalid pricing instead of allowing a NaN budget comparison", () => {
    expect(() => estimateRouteCost(
      { ...routeFor("strategist"), outputUsdPerMillion: Number.NaN },
      { inputTokens: 100, outputTokens: 100 },
    )).toThrow("Pricing for");
  });
});
