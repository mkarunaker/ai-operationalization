import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, openInitializedDatabase } from "@/persistence/database";
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
      expect(applied.count).toBe(1);
    } finally {
      runtime.close();
    }
  });
});
