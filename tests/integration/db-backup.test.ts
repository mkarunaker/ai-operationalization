import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase } from "@/persistence/database";
import { migrateDatabase } from "@/persistence/migrations";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});

describe("local backup and restore verification", () => {
  it("creates an owner-only, integrity-checked backup of a synthetic database and validates a restore copy", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-backup-test-"));
    temporaryDirectories.push(directory);
    const databasePath = path.join(directory, "synthetic.sqlite");
    const database = openDatabase(databasePath);
    migrateDatabase(database, path.join(process.cwd(), "migrations"));
    database.close();

    const output = execFileSync(process.execPath, ["--import", "tsx", "scripts/db-backup.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_PATH: databasePath },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const backupsDirectory = path.join(directory, "backups");
    const backups = fs.readdirSync(backupsDirectory);
    expect(output).toMatch(/Verified local backup: /);
    expect(backups).toHaveLength(1);
    expect(fs.statSync(backupsDirectory).mode & 0o777).toBe(0o700);
    expect(fs.statSync(path.join(backupsDirectory, backups[0]!)).mode & 0o777).toBe(0o600);
  });
});
