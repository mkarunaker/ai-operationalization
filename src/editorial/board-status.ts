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
 * A derived-short recovery can repair only the Final Drafter output. It must never
 * turn a failed Board-thinking role into a completed Board review.
 */
export function isBoardReviewIncomplete(input: {
  runStatus: BoardRunStatus;
  failures: Array<{ role: string }>;
  finalDrafterRecovered: boolean;
  reviewerRecoveredRoles?: readonly string[];
  interrupted?: boolean;
}) {
  if (input.interrupted) return true;
  if (input.runStatus === "completed") return false;
  const recoveredRoles = new Set(input.reviewerRecoveredRoles ?? []);
  const unresolved = input.failures.some((failure) =>
    failure.role === "final_drafter"
      ? !input.finalDrafterRecovered
      : ["strategist", "skeptic", "editor"].includes(failure.role)
        ? !recoveredRoles.has(failure.role)
        : true,
  );
  return input.runStatus === "failed" ? unresolved : unresolved || !input.finalDrafterRecovered;
}

export function shouldResetDerivedShortEditor(action: string | undefined, hasUnsavedEdits: boolean) {
  return !hasUnsavedEdits && [
    "run_grounded_board",
    "run_live_board",
    "save_derived_short",
    "retry_live_derived_short",
    "refresh_live_derived_short",
    "escalate_live_derived_short",
  ].includes(action ?? "");
}

/**
 * A completed derived-short stage means that the current Board result actually
 * produced a linked derived short post. In particular, a failed Synthesizer means the
 * drafting stages were never reached; they must not be rendered as success.
 */
export function derivedShortCreationStageStatus(input: {
  includesDerivedShort: boolean;
  generatedDraftVersionId?: string;
  generatedDerivedShortDraftVersionId?: string;
  finalDrafterFailed: boolean;
}): PersistedBoardStageStatus | undefined {
  if (!input.includesDerivedShort) return undefined;
  if (!input.generatedDraftVersionId) return "not_run";
  if (input.generatedDerivedShortDraftVersionId) return "completed";
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
export function reconcileDerivedShortEditorState(input: {
  action: string | undefined;
  hasUnsavedEdits: boolean;
  currentBody: string;
  returnedBody?: string;
}) {
  if (!shouldResetDerivedShortEditor(input.action, input.hasUnsavedEdits)) {
    return { body: input.currentBody, dirty: input.hasUnsavedEdits, replaced: false };
  }
  return { body: input.returnedBody ?? "", dirty: false, replaced: true };
}
