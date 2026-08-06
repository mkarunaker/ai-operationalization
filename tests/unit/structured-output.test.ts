import { describe, expect, it } from "vitest";
import { validateStructuredReviewOutput } from "@/ai/structured-output";

describe("structured review output", () => {
  it("accepts the common review envelope", () => {
    expect(
      validateStructuredReviewOutput({
        role: "skeptic",
        summary: "Claim needs evidence.",
        confidence: { score: 0.7, reason: "Enough context." },
        findings: [],
        strengths: [],
        risks: [],
        top_recommendations: [],
        recommended_action: "revise",
      }).success,
    ).toBe(true);
  });

  it("rejects confidence outside the allowed range", () => {
    expect(
      validateStructuredReviewOutput({
        role: "skeptic",
        summary: "x",
        confidence: { score: 2, reason: "x" },
        findings: [],
        strengths: [],
        risks: [],
        top_recommendations: [],
        recommended_action: "revise",
      }).success,
    ).toBe(false);
  });
});
