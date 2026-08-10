import { getAppConfig } from "@/config/env";
import { openReadOnlyDatabase } from "@/persistence/database";
import { boardRoleStageStatus } from "@/editorial/board-status";

export type EditorialStageStatus = "waiting" | "running" | "completed" | "failed" | "not_run";
export type EditorialRunProgress = {
  runId?: string;
  kind?: "board" | "companion_recovery";
  recoveryFailure?: "persisted_provider_failure" | "pre_dispatch_rejection";
  status: "waiting" | "running" | "completed" | "partially_completed" | "failed";
  stages: Array<{
    id: "context" | "strategist" | "skeptic" | "editor" | "synthesizer" | "draft" | "linkedin_companion" | "provenance";
    label: string;
    status: EditorialStageStatus;
  }>;
};

type StageId = EditorialRunProgress["stages"][number]["id"];
type StageDefinition = readonly [StageId, string];

const baseStageDefinitions: readonly StageDefinition[] = [
  ["context", "Prepare bounded idea and BOK context"],
  ["strategist", "Strategist review"],
  ["skeptic", "Skeptic review"],
  ["editor", "Editor review"],
  ["synthesizer", "Synthesize the editorial brief"],
  ["draft", "Create the voice-aligned working draft"],
  ["provenance", "Save provenance, usage, latency, and cost"],
] as const;

function stageDefinitions(includeLinkedinCompanion: boolean) {
  const stages: StageDefinition[] = [...baseStageDefinitions];
  if (includeLinkedinCompanion)
    stages.splice(6, 0, ["linkedin_companion", "Create standalone LinkedIn post"]);
  return stages;
}

function isDualOutputPlan(value: string | null | undefined) {
  return value === "medium_linkedin" || value === "substack_linkedin";
}

export function getLiveEditorialProgress(ideaId: string, since?: string): EditorialRunProgress {
  const database = openReadOnlyDatabase(getAppConfig().databasePath);
  try {
    const run = database.prepare(
      `SELECT run.id, run.status, snapshot.generated_draft_version_id, snapshot.publication_plan
       FROM review_runs run
       JOIN editorial_run_snapshots snapshot ON snapshot.review_run_id = run.id
       WHERE snapshot.idea_id = ? AND run.execution_mode = 'live'
         AND (? IS NULL OR run.started_at >= ?)
       ORDER BY run.started_at DESC
       LIMIT 1`,
    ).get(ideaId, since ?? null, since ?? null) as
      | { id: string; status: EditorialRunProgress["status"]; generated_draft_version_id: string | null; publication_plan: string | null }
      | undefined;
    if (!run) {
      const plan = database.prepare("SELECT publication_plan FROM ideas WHERE id = ?").get(ideaId) as { publication_plan: string | null } | undefined;
      const definitions = stageDefinitions(isDualOutputPlan(plan?.publication_plan));
      return {
        status: "waiting",
        stages: definitions.map(([id, label], index) => ({
          id,
          label,
          status: index === 0 ? "running" : "waiting",
        })),
      };
    }

    const definitions = stageDefinitions(isDualOutputPlan(run.publication_plan));

    const reviewRows = database.prepare(
      `SELECT role.name, review.status
       FROM agent_reviews review
       JOIN agent_roles role ON role.id = review.role_id
       WHERE review.review_run_id = ?`,
    ).all(run.id) as Array<{ name: string; status: string }>;
    const roleState = new Map(reviewRows.map((row) => [row.name, row.status]));
    const terminal = ["completed", "partially_completed", "failed"].includes(run.status);
    const attemptedRoles = reviewRows.map((row) => row.name);
    const failedRoles = reviewRows.filter((row) => row.status === "failed").map((row) => row.name);
    const stages: EditorialRunProgress["stages"] = [];
    stages.push({ id: "context", label: baseStageDefinitions[0][1], status: "completed" });

    let activeAssigned = false;
    for (const role of ["strategist", "skeptic", "editor", "synthesizer"] as const) {
      const persisted = roleState.get(role);
      let status: EditorialStageStatus;
      if (terminal) status = boardRoleStageStatus({ role, attemptedRoles, failedRoles });
      else if (persisted === "completed" || persisted === "partially_structured") status = "completed";
      else if (persisted === "failed") status = "failed";
      else if (!terminal && !activeAssigned) {
        status = "running";
        activeAssigned = true;
      } else status = "waiting";
      stages.push({
        id: role,
        label: baseStageDefinitions.find(([id]) => id === role)![1],
        status,
      });
    }

    const synthesisCompleted = roleState.get("synthesizer") === "completed";
    stages.push({
      id: "draft",
      label: baseStageDefinitions[5][1],
      status: run.generated_draft_version_id
        ? "completed"
        : terminal
          ? synthesisCompleted ? "failed" : "not_run"
          : synthesisCompleted ? "running" : "waiting",
    });
    if (isDualOutputPlan(run.publication_plan)) {
      const companion = run.generated_draft_version_id
        ? database.prepare(
            `SELECT child.id
             FROM draft_relationships relationship
             JOIN draft_versions child ON child.id = relationship.child_draft_version_id
             JOIN model_calls call ON call.id = child.model_call_id
             WHERE relationship.parent_draft_version_id = ?
               AND relationship.relationship_type = 'linkedin_companion'
               AND json_extract(COALESCE(call.raw_usage, '{}'), '$.reviewRunId') = ?
               AND call.agent_role = 'final_drafter'
             ORDER BY child.rowid DESC
             LIMIT 1`,
          ).get(run.generated_draft_version_id, run.id)
        : undefined;
      stages.push({
        id: "linkedin_companion",
        label: definitions.find(([id]) => id === "linkedin_companion")![1],
        status: companion
          ? "completed"
          : terminal
            ? run.generated_draft_version_id ? "failed" : "not_run"
            : run.generated_draft_version_id ? "running" : "waiting",
      });
    }
    stages.push({
      id: "provenance",
      label: baseStageDefinitions[6][1],
      status: terminal ? "completed" : "waiting",
    });
    return { runId: run.id, status: run.status, stages };
  } finally {
    database.close();
  }
}
