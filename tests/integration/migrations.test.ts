import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/persistence/database";
import { migrateDatabase, validateMigrations } from "@/persistence/migrations";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});

describe("clean local baseline", () => {
  it("contains one current schema and no retired managed-theme tables", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-clean-baseline-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(path.join(directory, "test.sqlite"));
    const applied = migrateDatabase(database, path.join(process.cwd(), "migrations"));
    const tables = new Set((database.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>).map(({ name }) => name));
    const ideaColumns = (database.prepare("PRAGMA table_info(ideas)").all() as Array<{ name: string }>).map(({ name }) => name);
    const snapshotColumns = (database.prepare("PRAGMA table_info(editorial_run_snapshots)").all() as Array<{ name: string }>).map(({ name }) => name);
    const visualColumns = (database.prepare("PRAGMA table_info(visual_briefs)").all() as Array<{ name: string }>).map(({ name }) => name);
    const indexes = new Set((database.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all() as Array<{ name: string }>).map(({ name }) => name));
    database.close();

    expect(validateMigrations(path.join(process.cwd(), "migrations"))).toEqual(["001_foundation.sql"]);
    expect(applied).toEqual(["001_foundation.sql"]);
    for (const table of ["ideas", "idea_notes", "idea_output_preferences", "editorial_run_snapshots", "visual_briefs", "visual_companions", "custom_visual_attempts", "derived_short_recovery_claims", "knowledge_search"])
      expect(tables.has(table)).toBe(true);
    expect(tables.has("themes")).toBe(false);
    expect(tables.has("idea_themes")).toBe(false);
    expect(ideaColumns).toEqual(expect.arrayContaining(["audience_profile_key", "output_shape"]));
    expect(snapshotColumns).not.toContain("themes_json");
    expect(visualColumns).toEqual(expect.arrayContaining(["visual_version_number", "color_scheme", "custom_illustration"]));
    expect(indexes.has("derived_short_recovery_claims_one_dispatching_idx")).toBe(true);
    expect(indexes.has("custom_visual_attempts_one_dispatching_per_brief_idx")).toBe(true);
  });
});
