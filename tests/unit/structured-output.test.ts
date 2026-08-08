import { describe, expect, it } from "vitest";
import { initialDraftOutputSchema, parseStructuredJson, validateStructuredReviewOutput } from "@/ai/structured-output";

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

  it("parses a JSON object wrapped in a markdown fence without treating it as markup", () => {
    expect(parseStructuredJson("```json\n{\"role\": \"skeptic\"}\n```"))
      .toEqual({ role: "skeptic" });
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

  it("accepts plain publication prose and rejects Markdown formatting in drafts", () => {
    const base = {
      role: "initial_drafter" as const,
      factual_gaps: [],
      voice_rules_applied: ["direct language"],
    };
    expect(initialDraftOutputSchema.safeParse({ ...base, body: "A normal paragraph for publication." }).success).toBe(true);
    expect(initialDraftOutputSchema.safeParse({ ...base, body: "## Heading\n\n- A Markdown bullet" }).success).toBe(false);
  });
});
