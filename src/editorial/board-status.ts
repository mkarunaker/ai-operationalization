export type BoardRunStatus = "completed" | "partially_completed" | "failed" | undefined;
export type PersistedBoardStageStatus = "completed" | "failed" | "not_run";
export type BoardRoleStage = "strategist" | "skeptic" | "editor" | "synthesizer";

/**
 * A terminal Board run must distinguish a role that failed from one that was
 * never reached. In particular, synthesis is not attempted when every
 * independent reviewer fails.
 */
export function boardRoleStageStatus(input: {
  role: BoardRoleStage;
  attemptedRoles: readonly string[];
  failedRoles: readonly string[];
}): PersistedBoardStageStatus {
  if (input.failedRoles.includes(input.role)) return "failed";
  return input.attemptedRoles.includes(input.role) ? "completed" : "not_run";
}

/**
 * A companion recovery can repair only the Final Drafter output. It must never
 * turn a failed Board-thinking role into a completed Board review.
 */
export function isBoardReviewIncomplete(input: {
  runStatus: BoardRunStatus;
  failures: Array<{ role: string }>;
  finalDrafterRecovered: boolean;
}) {
  if (input.runStatus === "failed") return true;
  if (input.runStatus !== "partially_completed") return false;
  return input.failures.some((failure) => failure.role !== "final_drafter") || !input.finalDrafterRecovered;
}

export function shouldResetCompanionEditor(action: string | undefined, hasUnsavedEdits: boolean) {
  return !hasUnsavedEdits && [
    "run_grounded_board",
    "run_live_board",
    "save_linkedin_companion",
    "retry_live_linkedin_companion",
    "refresh_live_linkedin_companion",
    "escalate_live_linkedin_companion",
  ].includes(action ?? "");
}

/**
 * A completed LinkedIn stage means that the current Board result actually
 * produced a linked companion. In particular, a failed Synthesizer means the
 * drafting stages were never reached; they must not be rendered as success.
 */
export function companionCreationStageStatus(input: {
  isDualOutputPlan: boolean;
  generatedDraftVersionId?: string;
  generatedLinkedinCompanionDraftVersionId?: string;
  finalDrafterFailed: boolean;
}): PersistedBoardStageStatus | undefined {
  if (!input.isDualOutputPlan) return undefined;
  if (!input.generatedDraftVersionId) return "not_run";
  if (input.generatedLinkedinCompanionDraftVersionId) return "completed";
  return input.finalDrafterFailed ? "failed" : "not_run";
}

/**
 * A drafting stage is not a failure when synthesis never produced the brief
 * required to start it. Keep "not_run" distinct from a failed drafter so the
 * saved workflow tells the author what actually happened.
 */
export function primaryDraftCreationStageStatus(input: {
  generatedDraftVersionId?: string;
  synthesizerFailed: boolean;
  initialDrafterFailed: boolean;
}): PersistedBoardStageStatus {
  if (input.generatedDraftVersionId) return "completed";
  if (input.synthesizerFailed) return "not_run";
  return input.initialDrafterFailed ? "failed" : "not_run";
}

/**
 * Keep the editor controlled without silently overwriting author text when a
 * server response arrives after a scoped recovery action.
 */
export function reconcileCompanionEditorState(input: {
  action: string | undefined;
  hasUnsavedEdits: boolean;
  currentBody: string;
  returnedBody?: string;
}) {
  if (!shouldResetCompanionEditor(input.action, input.hasUnsavedEdits)) {
    return { body: input.currentBody, dirty: input.hasUnsavedEdits, replaced: false };
  }
  return { body: input.returnedBody ?? "", dirty: false, replaced: true };
}
