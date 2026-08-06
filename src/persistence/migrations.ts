import fs from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

type Migration = { id: string; sql: string };

function readMigrations(directory: string): Migration[] {
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({ id: file, sql: fs.readFileSync(path.join(directory, file), "utf8") }));
}

export function migrateDatabase(database: DatabaseSync, migrationsDirectory: string): string[] {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const applied = new Set(
    (database.prepare("SELECT id FROM schema_migrations").all() as Array<{ id: string }>).map((row) => row.id),
  );
  const executed: string[] = [];

  for (const migration of readMigrations(migrationsDirectory)) {
    if (applied.has(migration.id)) continue;
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.exec(migration.sql);
      database.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(migration.id);
      database.exec("COMMIT;");
      executed.push(migration.id);
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }

  return executed;
}

export function validateMigrations(migrationsDirectory: string): string[] {
  const migrations = readMigrations(migrationsDirectory);
  if (migrations.length === 0) throw new Error("No SQL migrations found.");
  if (new Set(migrations.map((migration) => migration.id)).size !== migrations.length) {
    throw new Error("Migration identifiers must be unique.");
  }
  return migrations.map((migration) => migration.id);
}
