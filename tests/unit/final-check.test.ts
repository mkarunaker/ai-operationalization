import { describe, expect, it } from "vitest";
import { checkHumanVoice } from "@/voice/final-check";

describe("final human-voice check", () => {
  it("flags explainable AI-like patterns without claiming authorship", () => {
    const result = checkHumanVoice("In today's rapidly evolving landscape, we should delve into this — it is not just about pilots but value. What do you think?");
    expect(result.riskPercent).toBeGreaterThan(20);
    expect(result.findings.map((finding) => finding.id)).toContain("em_dash");
    expect(result.disclaimer).toContain("not an AI-authorship detector");
  });

  it("keeps direct writing at low risk", () => {
    expect(checkHumanVoice("A pilot can be useful. It is not proof that the operating model is ready.").label).toBe("low");
  });

  it("flags Markdown formatting so publication copy stays plain prose", () => {
    const result = checkHumanVoice("## Heading\n\n- A Markdown list item");
    expect(result.findings.map((finding) => finding.id)).toContain("markdown_formatting");
  });
});
