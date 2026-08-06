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
    database.close();

    const tables = new Set(names.map((row) => row.name));
    expect(tables).toContain("content_intent_briefs");
    expect(tables).toContain("model_calls");
    expect(tables).toContain("retrieval_records");
    expect(tables).toContain("knowledge_search");
    expect(fs.statSync(path.join(directory, "test.sqlite")).mode & 0o777).toBe(0o600);
  });
});
