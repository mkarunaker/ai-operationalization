import { getAppConfig } from "@/config/env";
import { openReadOnlyDatabase } from "@/persistence/database";

export type EditorialStageStatus = "waiting" | "running" | "completed" | "failed";
export type EditorialRunProgress = {
  runId?: string;
  status: "waiting" | "running" | "completed" | "partially_completed" | "failed";
  stages: Array<{
    id: "context" | "strategist" | "skeptic" | "editor" | "synthesizer" | "draft" | "provenance";
    label: string;
    status: EditorialStageStatus;
  }>;
};

const stageDefinitions = [
  ["context", "Prepare bounded idea and BOK context"],
  ["strategist", "Strategist review"],
  ["skeptic", "Skeptic review"],
  ["editor", "Editor review"],
  ["synthesizer", "Synthesize the editorial brief"],
  ["draft", "Create the voice-aligned working draft"],
  ["provenance", "Save provenance, usage, latency, and cost"],
] as const;

export function getLiveEditorialProgress(ideaId: string, since?: string): EditorialRunProgress {
  const database = openReadOnlyDatabase(getAppConfig().databasePath);
  try {
    const run = database.prepare(
      `SELECT run.id, run.status, snapshot.generated_draft_version_id
       FROM review_runs run
       JOIN editorial_run_snapshots snapshot ON snapshot.review_run_id = run.id
       WHERE snapshot.idea_id = ? AND run.execution_mode = 'live'
         AND (? IS NULL OR run.started_at >= ?)
       ORDER BY run.started_at DESC
       LIMIT 1`,
    ).get(ideaId, since ?? null, since ?? null) as
      | { id: string; status: EditorialRunProgress["status"]; generated_draft_version_id: string | null }
      | undefined;
    if (!run) {
      return {
        status: "waiting",
        stages: stageDefinitions.map(([id, label], index) => ({
          id,
          label,
          status: index === 0 ? "running" : "waiting",
        })),
      };
    }

    const reviewRows = database.prepare(
      `SELECT role.name, review.status
       FROM agent_reviews review
       JOIN agent_roles role ON role.id = review.role_id
       WHERE review.review_run_id = ?`,
    ).all(run.id) as Array<{ name: string; status: string }>;
    const roleState = new Map(reviewRows.map((row) => [row.name, row.status]));
    const terminal = ["completed", "partially_completed", "failed"].includes(run.status);
    const stages: EditorialRunProgress["stages"] = [];
    stages.push({ id: "context", label: stageDefinitions[0][1], status: "completed" });

    let activeAssigned = false;
    for (const role of ["strategist", "skeptic", "editor", "synthesizer"] as const) {
      const persisted = roleState.get(role);
      let status: EditorialStageStatus;
      if (persisted === "completed" || persisted === "partially_structured") status = "completed";
      else if (persisted === "failed") status = "failed";
      else if (!terminal && !activeAssigned) {
        status = "running";
        activeAssigned = true;
      } else status = "waiting";
      stages.push({
        id: role,
        label: stageDefinitions.find(([id]) => id === role)![1],
        status,
      });
    }

    const synthesisCompleted = roleState.get("synthesizer") === "completed";
    stages.push({
      id: "draft",
      label: stageDefinitions[5][1],
      status: run.generated_draft_version_id
        ? "completed"
        : !terminal && synthesisCompleted
          ? "running"
          : "waiting",
    });
    stages.push({
      id: "provenance",
      label: stageDefinitions[6][1],
      status: terminal ? "completed" : "waiting",
    });
    return { runId: run.id, status: run.status, stages };
  } finally {
    database.close();
  }
}
