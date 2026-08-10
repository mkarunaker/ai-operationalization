import { describe, expect, it } from "vitest";
import { boardRoleStageStatus, companionCreationStageStatus, isBoardReviewIncomplete, primaryDraftCreationStageStatus, reconcileCompanionEditorState, shouldResetCompanionEditor } from "@/editorial/board-status";

describe("persisted Board and companion status", () => {
  it("never lets companion recovery conceal a failed Board-thinking role", () => {
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

  it("updates the controlled companion only when an action replaced it and the author has no unsaved edits", () => {
    expect(shouldResetCompanionEditor("refresh_live_linkedin_companion", false)).toBe(true);
    expect(shouldResetCompanionEditor("retry_live_linkedin_companion", true)).toBe(false);
    expect(shouldResetCompanionEditor("run_final_review", false)).toBe(false);

    expect(reconcileCompanionEditorState({
      action: "refresh_live_linkedin_companion",
      hasUnsavedEdits: false,
      currentBody: "Old local text",
      returnedBody: "Recovered companion text",
    })).toEqual({ body: "Recovered companion text", dirty: false, replaced: true });
    expect(reconcileCompanionEditorState({
      action: "retry_live_linkedin_companion",
      hasUnsavedEdits: true,
      currentBody: "Unsaved author wording",
      returnedBody: "Recovered companion text",
    })).toEqual({ body: "Unsaved author wording", dirty: true, replaced: false });
  });

  it("never represents an unattempted LinkedIn stage as completed", () => {
    expect(companionCreationStageStatus({
      isDualOutputPlan: true,
      generatedDraftVersionId: undefined,
      generatedLinkedinCompanionDraftVersionId: undefined,
      finalDrafterFailed: false,
    })).toBe("not_run");
    expect(companionCreationStageStatus({
      isDualOutputPlan: true,
      generatedDraftVersionId: "draft_canonical",
      generatedLinkedinCompanionDraftVersionId: undefined,
      finalDrafterFailed: true,
    })).toBe("failed");
    expect(companionCreationStageStatus({
      isDualOutputPlan: true,
      generatedDraftVersionId: "draft_canonical",
      generatedLinkedinCompanionDraftVersionId: "draft_linkedin",
      finalDrafterFailed: false,
    })).toBe("completed");
  });

  it("keeps both drafting stages not_run when synthesis stopped before drafting", () => {
    expect(primaryDraftCreationStageStatus({
      generatedDraftVersionId: undefined,
      synthesizerFailed: true,
      initialDrafterFailed: false,
    })).toBe("not_run");
    expect(companionCreationStageStatus({
      isDualOutputPlan: true,
      generatedDraftVersionId: undefined,
      generatedLinkedinCompanionDraftVersionId: undefined,
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
