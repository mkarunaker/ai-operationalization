import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, openInitializedDatabase, openRecoveredReadOnlyDatabase } from "@/persistence/database";
import { migrateDatabase } from "@/persistence/migrations";

const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-database-init-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});

describe("runtime database initialization", () => {
  it("never creates or migrates a database during normal runtime opening", () => {
    const root = temporaryDirectory();
    const databasePath = path.join(root, "editorial.sqlite");
    expect(() => openInitializedDatabase(databasePath)).toThrow(/not been initialized/i);
    expect(fs.existsSync(databasePath)).toBe(false);

    const migrationDirectory = path.join(root, "current-baseline");
    fs.mkdirSync(migrationDirectory);
    for (const source of fs.readdirSync(path.join(process.cwd(), "migrations")))
      fs.copyFileSync(path.join(process.cwd(), "migrations", source), path.join(migrationDirectory, source));
    const setup = openDatabase(databasePath);
    try {
      migrateDatabase(setup, migrationDirectory);
    } finally {
      setup.close();
    }

    const runtime = openInitializedDatabase(databasePath);
    try {
      const applied = runtime.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get() as { count: number };
      expect(applied.count).toBe(2);
    } finally {
      runtime.close();
    }
  });

  it("marks an interrupted request-bound run failed when a new runtime opens the database", () => {
    const root = temporaryDirectory();
    const databasePath = path.join(root, "interrupted.sqlite");
    const migrationDirectory = path.join(root, "current-baseline");
    fs.mkdirSync(migrationDirectory);
    for (const source of fs.readdirSync(path.join(process.cwd(), "migrations")))
      fs.copyFileSync(path.join(process.cwd(), "migrations", source), path.join(migrationDirectory, source));
    const setup = openDatabase(databasePath);
    try {
      migrateDatabase(setup, migrationDirectory);
      setup.prepare("INSERT INTO users (id, name, email) VALUES ('test-user', 'Test user', 'test@example.test')").run();
      setup.prepare("INSERT INTO projects (id, user_id, title, status) VALUES ('test-project', 'test-user', 'Test project', 'active')").run();
      setup.prepare("INSERT INTO ideas (id, project_id, raw_notes, status) VALUES ('test-idea', 'test-project', 'Synthetic interruption fixture.', 'ready_to_review')").run();
      setup.prepare("INSERT INTO content_items (id, project_id, idea_id, content_type, status) VALUES ('test-content', 'test-project', 'test-idea', 'editorial_post', 'ready_to_review')").run();
      setup.prepare("INSERT INTO draft_versions (id, content_item_id, version_number, body, created_by) VALUES ('test-snapshot', 'test-content', 1, 'Synthetic saved development snapshot.', 'development_snapshot')").run();
      setup.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, review_type, execution_mode, status, estimated_cost, started_at) VALUES ('interrupted-run', 'test-content', 'test-snapshot', 'editorial', 'live', 'running', 0, CURRENT_TIMESTAMP)").run();
      setup.prepare("INSERT INTO editorial_run_snapshots (id, review_run_id, idea_id, content_item_id, original_capture, notes_json, clarification_answers_json, output_shape, prompt_manifest) VALUES ('test-run-snapshot', 'interrupted-run', 'test-idea', 'test-content', 'Synthetic interruption fixture.', '[]', '[]', 'short', '{}')").run();
      setup.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, review_type, execution_mode, status, estimated_cost, started_at) VALUES ('targeted-reviewer-run', 'test-content', 'test-snapshot', 'editorial', 'live', 'running', 0, CURRENT_TIMESTAMP)").run();
      setup.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, review_type, execution_mode, status, estimated_cost, started_at) VALUES ('final-draft-run', 'test-content', 'test-snapshot', 'final_draft', 'live', 'running', 0, CURRENT_TIMESTAMP)").run();
      setup.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, review_type, execution_mode, status, estimated_cost, started_at) VALUES ('grounded-test-board', 'test-content', 'test-snapshot', 'editorial', 'grounded_test', 'running', 0, CURRENT_TIMESTAMP)").run();
      setup.prepare("INSERT INTO editorial_run_snapshots (id, review_run_id, idea_id, content_item_id, original_capture, notes_json, clarification_answers_json, output_shape, prompt_manifest) VALUES ('grounded-test-snapshot', 'grounded-test-board', 'test-idea', 'test-content', 'Synthetic grounded-test fixture.', '[]', '[]', 'short', '{}')").run();
      setup.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, review_type, execution_mode, status, estimated_cost, started_at, completed_at) VALUES ('terminal-live-board', 'test-content', 'test-snapshot', 'editorial', 'live', 'completed', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)").run();
      setup.prepare("INSERT INTO editorial_run_snapshots (id, review_run_id, idea_id, content_item_id, original_capture, notes_json, clarification_answers_json, output_shape, prompt_manifest) VALUES ('terminal-live-snapshot', 'terminal-live-board', 'test-idea', 'test-content', 'Synthetic terminal fixture.', '[]', '[]', 'short', '{}')").run();
    } finally {
      setup.close();
    }

    const restartedRuntime = openRecoveredReadOnlyDatabase(databasePath);
    try {
      const interrupted = restartedRuntime.prepare("SELECT status, completed_at, interrupted_at FROM review_runs WHERE id = 'interrupted-run'").get() as { status: string; completed_at: string; interrupted_at: string };
      expect(interrupted).toMatchObject({
        status: "failed",
        completed_at: expect.any(String),
        interrupted_at: expect.any(String),
      });
      expect(interrupted.completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(interrupted.interrupted_at).toBe(interrupted.completed_at);
      expect(restartedRuntime.prepare("SELECT id, status, interrupted_at FROM review_runs WHERE id != 'interrupted-run' ORDER BY id").all()).toEqual([
        { id: "final-draft-run", status: "running", interrupted_at: null },
        { id: "grounded-test-board", status: "running", interrupted_at: null },
        { id: "targeted-reviewer-run", status: "running", interrupted_at: null },
        { id: "terminal-live-board", status: "completed", interrupted_at: null },
      ]);
    } finally {
      restartedRuntime.close();
    }
  });
});
