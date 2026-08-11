import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/persistence/database";
import { migrateDatabase } from "@/persistence/migrations";

const tempDirectories: string[] = [];

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe("foundation migration", () => {
  it("creates required tables and the FTS index", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-migration-"));
    tempDirectories.push(directory);
    const database = openDatabase(path.join(directory, "test.sqlite"));
    migrateDatabase(database, path.join(process.cwd(), "migrations"));
    const names = database.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'index')").all() as Array<{ name: string }>;
    const triggerNames = database.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all() as Array<{ name: string }>;
    const visualBriefSql = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'visual_briefs'").get() as { sql: string };
    const visualBriefMigration = database.prepare("SELECT id FROM schema_migrations WHERE id = '019_visual_brief_approval.sql'").get();
    database.close();

    const tables = new Set(names.map((row) => row.name));
    expect(tables).toContain("content_intent_briefs");
    expect(tables).toContain("model_calls");
    expect(tables).toContain("retrieval_records");
    expect(tables).toContain("knowledge_search");
    expect(tables).toContain("themes");
    expect(tables).toContain("idea_themes");
    expect(tables).toContain("research_items");
    expect(tables).toContain("visual_briefs");
    expect(visualBriefMigration).toBeTruthy();
    expect(visualBriefSql.sql).toContain("vertical_path");
    expect(visualBriefSql.sql).not.toContain("'maturity_path'");
    expect(triggerNames.map((trigger) => trigger.name)).toEqual(expect.arrayContaining([
      "visual_briefs_limit_before_insert",
      "visual_briefs_limit_before_update",
    ]));
    expect(fs.statSync(path.join(directory, "test.sqlite")).mode & 0o777).toBe(0o600);
  });

  it("builds the generic reader-output model on a fresh temporary database", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-reader-output-migration-"));
    tempDirectories.push(directory);
    const database = openDatabase(path.join(directory, "test.sqlite"));
    migrateDatabase(database, path.join(process.cwd(), "migrations"));
    const applied = database.prepare("SELECT id FROM schema_migrations WHERE id = '018_reader_first_distribution_neutral.sql'").get();
    const ideaColumns = database.prepare("PRAGMA table_info(ideas)").all() as Array<{ name: string }>;
    const relationshipSql = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'draft_relationships'").get() as { sql: string };
    const publicationSql = database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'publications'").get() as { sql: string };
    const tables = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>;
    database.close();

    expect(applied).toBeTruthy();
    expect(ideaColumns.map((column) => column.name)).toContain("output_shape");
    expect(relationshipSql.sql).toContain("derived_short");
    expect(publicationSql.sql).toContain("channel");
    expect(tables.map((table) => table.name)).toEqual(expect.arrayContaining(["article_draft_approvals", "derived_short_approvals"]));
  });

  it("maps populated legacy output records without losing publication dependents", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-reader-output-upgrade-"));
    tempDirectories.push(directory);
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const legacyMigrations = path.join(directory, "legacy-migrations");
    fs.cpSync(path.join(process.cwd(), "migrations"), legacyMigrations, { recursive: true });
    fs.rmSync(path.join(legacyMigrations, "018_reader_first_distribution_neutral.sql"));
    fs.rmSync(path.join(legacyMigrations, "019_visual_brief_approval.sql"));
    migrateDatabase(database, legacyMigrations);

    database.prepare("INSERT INTO users (id, name, email) VALUES ('user', 'Synthetic owner', 'owner@example.test')").run();
    database.prepare("INSERT INTO projects (id, user_id, title, description, status) VALUES ('project', 'user', 'Synthetic project', '', 'active')").run();
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('idea', 'project', 'Synthetic idea', 'Synthetic notes', 'ready', 0, 'medium_linkedin')").run();
    // Exercise every legacy mapping branch with deliberately varied old plan
    // values. These are synthetic compatibility records, not new app input.
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('paired-substack', 'project', 'Paired Substack', '', 'ready', 0, 'substack_linkedin')").run();
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('long-medium', 'project', 'Long Medium', '', 'ready', 0, 'medium')").run();
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('long-substack', 'project', 'Long Substack', '', 'ready', 0, 'substack')").run();
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('short-linkedin', 'project', 'Short LinkedIn', '', 'ready', 0, 'linkedin')").run();
    database.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, status, priority, publication_plan) VALUES ('short-null', 'project', 'Short Default', '', 'ready', 0, NULL)").run();
    database.prepare("INSERT INTO content_items (id, project_id, idea_id, content_type, status) VALUES ('content', 'project', 'idea', 'editorial_post', 'ready')").run();
    database.prepare("INSERT INTO content_intent_briefs (id, content_item_id, supporting_points, user_provided_evidence, claims_requiring_validation, intended_platform, open_questions, system_assumptions, version, status) VALUES ('brief', 'content', '[]', '[]', '[]', 'Legacy reader context', '[]', '[]', 1, 'editable')").run();
    database.prepare("INSERT INTO draft_versions (id, content_item_id, version_number, body, created_by, publication_format) VALUES ('article', 'content', 1, 'An article body.', 'user', 'canonical')").run();
    database.prepare("INSERT INTO draft_versions (id, content_item_id, version_number, body, created_by, publication_format) VALUES ('derived', 'content', 2, 'A derived short body.', 'user', 'linkedin_companion')").run();
    database.prepare("INSERT INTO draft_relationships (parent_draft_version_id, child_draft_version_id, relationship_type) VALUES ('article', 'derived', 'linkedin_companion')").run();
    database.prepare("INSERT INTO canonical_draft_approvals (canonical_draft_version_id, idea_id) VALUES ('article', 'idea')").run();
    database.prepare("INSERT INTO linkedin_companion_approvals (companion_draft_version_id, idea_id) VALUES ('derived', 'idea')").run();
    database.prepare("INSERT INTO publications (id, content_item_id, draft_version_id, platform, published_at, final_text) VALUES ('publication', 'content', 'article', 'medium', '2026-08-09T00:00:00.000Z', 'An article body.')").run();
    // This is an actual pre-Milestone-7 asset: migration 019 has not yet
    // created visual_briefs or visual_companions.visual_brief_id.
    database.prepare("INSERT INTO visual_companions (id, idea_id, content_item_id, draft_version_id, visual_type, title, subtitle, steps_json, alt_text, caption, file_path) VALUES ('legacy-visual', 'idea', 'content', 'article', 'flow', 'Legacy visual', 'Pre-brief asset', '[]', 'Legacy alt text', 'Legacy caption', 'legacy/asset.svg')").run();
    database.prepare("INSERT INTO performance_snapshots (id, publication_id, captured_at, other_metrics) VALUES ('performance', 'publication', '2026-08-09T00:00:00.000Z', '{}')").run();
    database.prepare("INSERT INTO feedback_items (id, publication_id, source, feedback_type, text) VALUES ('feedback', 'publication', 'synthetic', 'comment', 'Synthetic feedback')").run();
    database.prepare("INSERT INTO retrospectives (id, publication_id) VALUES ('retrospective', 'publication')").run();
    database.prepare("INSERT INTO publication_provenance (publication_id, voice_check_json) VALUES ('publication', '{}')").run();
    const snapshotPlans = {
      "snapshot-paired-medium": "medium_linkedin",
      "snapshot-paired-substack": "substack_linkedin",
      "snapshot-long-medium": "medium",
      "snapshot-long-substack": "substack",
      "snapshot-short-linkedin": "linkedin",
      "snapshot-short-null": null,
    } as const;
    for (const [snapshotId, publicationPlan] of Object.entries(snapshotPlans)) {
      const runId = `run-${snapshotId}`;
      database.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, status, completed_at) VALUES (?, 'content', 'article', 'completed', '2026-08-09T00:00:00.000Z')").run(runId);
      database.prepare("INSERT INTO editorial_run_snapshots (id, review_run_id, generated_draft_version_id, idea_id, content_item_id, original_capture, notes_json, clarification_answers_json, themes_json, publication_plan, prompt_manifest) VALUES (?, ?, 'article', 'idea', 'content', 'Synthetic capture', '[]', '[]', '[]', ?, '{}')").run(snapshotId, runId, publicationPlan);
    }

    migrateDatabase(database, path.join(process.cwd(), "migrations"));

    expect(database.prepare("SELECT output_shape FROM ideas WHERE id = 'idea'").get()).toEqual({ output_shape: "long_with_derived_short" });
    expect(database.prepare("SELECT id, output_shape FROM ideas WHERE id != 'idea' ORDER BY id").all()).toEqual([
      { id: "long-medium", output_shape: "long" },
      { id: "long-substack", output_shape: "long" },
      { id: "paired-substack", output_shape: "long_with_derived_short" },
      { id: "short-linkedin", output_shape: "short" },
      { id: "short-null", output_shape: "short" },
    ]);
    expect(database.prepare("SELECT id, output_shape FROM editorial_run_snapshots ORDER BY id").all()).toEqual([
      { id: "snapshot-long-medium", output_shape: "long" },
      { id: "snapshot-long-substack", output_shape: "long" },
      { id: "snapshot-paired-medium", output_shape: "long_with_derived_short" },
      { id: "snapshot-paired-substack", output_shape: "long_with_derived_short" },
      { id: "snapshot-short-linkedin", output_shape: "short" },
      { id: "snapshot-short-null", output_shape: "short" },
    ]);
    expect(database.prepare("SELECT reader_context FROM content_intent_briefs WHERE id = 'brief'").get()).toEqual({ reader_context: "Legacy reader context" });
    expect(database.prepare("SELECT publication_format FROM draft_versions WHERE id = 'article'").get()).toEqual({ publication_format: "article" });
    expect(database.prepare("SELECT publication_format FROM draft_versions WHERE id = 'derived'").get()).toEqual({ publication_format: "derived_short" });
    expect(database.prepare("SELECT relationship_type FROM draft_relationships").get()).toEqual({ relationship_type: "derived_short" });
    expect(database.prepare("SELECT channel FROM publications WHERE id = 'publication'").get()).toEqual({ channel: "medium" });
    expect(database.prepare("SELECT article_draft_version_id FROM article_draft_approvals WHERE article_draft_version_id = 'article'").get()).toEqual({ article_draft_version_id: "article" });
    expect(database.prepare("SELECT derived_short_draft_version_id FROM derived_short_approvals WHERE derived_short_draft_version_id = 'derived'").get()).toEqual({ derived_short_draft_version_id: "derived" });
    expect(database.prepare("SELECT id FROM performance_snapshots WHERE publication_id = 'publication'").get()).toEqual({ id: "performance" });
    expect(database.prepare("SELECT id FROM feedback_items WHERE publication_id = 'publication'").get()).toEqual({ id: "feedback" });
    expect(database.prepare("SELECT id FROM retrospectives WHERE publication_id = 'publication'").get()).toEqual({ id: "retrospective" });
    expect(database.prepare("SELECT publication_id FROM publication_provenance WHERE publication_id = 'publication'").get()).toEqual({ publication_id: "publication" });
    expect(database.prepare("SELECT id, draft_version_id, visual_brief_id, title, file_path FROM visual_companions WHERE id = 'legacy-visual'").get()).toEqual({
      id: "legacy-visual", draft_version_id: "article", visual_brief_id: null, title: "Legacy visual", file_path: "legacy/asset.svg",
    });
    database.close();
  });
});
