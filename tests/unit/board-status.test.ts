import { describe, expect, it } from "vitest";
import { boardRoleStageStatus, derivedShortCreationStageStatus, isBoardReviewIncomplete, primaryDraftCreationStageStatus, reconcileDerivedShortEditorState, shouldResetDerivedShortEditor } from "@/editorial/board-status";

describe("persisted Board and derived-short status", () => {
  it("never lets derived-short recovery conceal a failed Board-thinking role", () => {
    expect(isBoardReviewIncomplete({
      runStatus: "partially_completed",
      failures: [{ role: "skeptic" }, { role: "final_drafter" }],
      finalDrafterRecovered: true,
    })).toBe(true);
    expect(isBoardReviewIncomplete({
      runStatus: "failed",
      failures: [{ role: "synthesizer" }],
      finalDrafterRecovered: true,
    })).toBe(true);
  });

  it("allows only an explicitly linked scoped reviewer recovery to resolve that reviewer failure", () => {
    expect(isBoardReviewIncomplete({
      runStatus: "partially_completed",
      failures: [{ role: "skeptic" }],
      finalDrafterRecovered: true,
      reviewerRecoveredRoles: ["skeptic"],
    })).toBe(false);
    expect(isBoardReviewIncomplete({
      runStatus: "partially_completed",
      failures: [{ role: "skeptic" }],
      finalDrafterRecovered: true,
      reviewerRecoveredRoles: [],
    })).toBe(true);
  });

  it("keeps a persisted interruption incomplete even when a reviewer already failed or later recovered", () => {
    expect(isBoardReviewIncomplete({
      runStatus: "failed",
      failures: [{ role: "skeptic" }],
      finalDrafterRecovered: true,
      reviewerRecoveredRoles: ["skeptic"],
      interrupted: true,
    })).toBe(true);
  });

  it("updates the controlled derived short post only when an action replaced it and the author has no unsaved edits", () => {
    expect(shouldResetDerivedShortEditor("refresh_live_derived_short", false)).toBe(true);
    expect(shouldResetDerivedShortEditor("retry_live_derived_short", true)).toBe(false);
    expect(shouldResetDerivedShortEditor("run_final_review", false)).toBe(false);

    expect(reconcileDerivedShortEditorState({
      action: "refresh_live_derived_short",
      hasUnsavedEdits: false,
      currentBody: "Old local text",
      returnedBody: "Recovered derived short text",
    })).toEqual({ body: "Recovered derived short text", dirty: false, replaced: true });
    expect(reconcileDerivedShortEditorState({
      action: "retry_live_derived_short",
      hasUnsavedEdits: true,
      currentBody: "Unsaved author wording",
      returnedBody: "Recovered derived short text",
    })).toEqual({ body: "Unsaved author wording", dirty: true, replaced: false });
  });

  it("never represents an unattempted derived-short stage as completed", () => {
    expect(derivedShortCreationStageStatus({
      includesDerivedShort: true,
      generatedDraftVersionId: undefined,
      generatedDerivedShortDraftVersionId: undefined,
      finalDrafterFailed: false,
    })).toBe("not_run");
    expect(derivedShortCreationStageStatus({
      includesDerivedShort: true,
      generatedDraftVersionId: "draft_article",
      generatedDerivedShortDraftVersionId: undefined,
      finalDrafterFailed: true,
    })).toBe("failed");
    expect(derivedShortCreationStageStatus({
      includesDerivedShort: true,
      generatedDraftVersionId: "draft_article",
      generatedDerivedShortDraftVersionId: "draft_derived_short",
      finalDrafterFailed: false,
    })).toBe("completed");
  });

  it("keeps both drafting stages not_run when synthesis stopped before drafting", () => {
    expect(primaryDraftCreationStageStatus({
      generatedDraftVersionId: undefined,
      synthesizerFailed: true,
      initialDrafterFailed: false,
    })).toBe("not_run");
    expect(derivedShortCreationStageStatus({
      includesDerivedShort: true,
      generatedDraftVersionId: undefined,
      generatedDerivedShortDraftVersionId: undefined,
      finalDrafterFailed: false,
    })).toBe("not_run");
  });

  it("keeps an unattempted Synthesizer distinct from a failed reviewer", () => {
    const attemptedRoles = ["strategist", "skeptic", "editor"];
    const failedRoles = ["strategist", "skeptic", "editor"];
    expect(boardRoleStageStatus({ role: "strategist", attemptedRoles, failedRoles })).toBe("failed");
    expect(boardRoleStageStatus({ role: "synthesizer", attemptedRoles, failedRoles })).toBe("not_run");
  });
});
