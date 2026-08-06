import { describe, expect, it } from "vitest";
import { deriveReviewRunStatus } from "@/domain/review-run";

describe("deriveReviewRunStatus", () => {
  it("keeps successful reviewer output when another reviewer fails", () => {
    expect(
      deriveReviewRunStatus([
        { role: "strategist", status: "completed" },
        { role: "skeptic", status: "failed" },
        { role: "editor", status: "completed" },
      ]),
    ).toBe("partially_completed");
  });

  it("fails only when every reviewer fails", () => {
    expect(
      deriveReviewRunStatus([
        { role: "strategist", status: "failed" },
        { role: "skeptic", status: "failed" },
      ]),
    ).toBe("failed");
  });
});
