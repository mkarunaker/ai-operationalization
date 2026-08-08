import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(databasePath: string): DatabaseSync {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const database = new DatabaseSync(databasePath);
  fs.chmodSync(databasePath, 0o600);
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");
  return database;
}

/**
 * Opens an existing database for normal application work without applying
 * migrations. Schema changes are an explicit owner operation via
 * `npm run db:migrate`, after the documented backup check.
 */
export function openInitializedDatabase(databasePath: string): DatabaseSync {
  if (!fs.existsSync(databasePath))
    throw new Error("The local database has not been initialized. Run npm run db:migrate first.");
  const database = openDatabase(databasePath);
  try {
    database.prepare("SELECT 1 FROM schema_migrations LIMIT 1").get();
    return database;
  } catch (error) {
    database.close();
    throw new Error("The local database is not initialized. Run npm run db:migrate first.", {
      cause: error,
    });
  }
}

/** Opens the already-initialized local database without creating, migrating, or changing it. */
export function openReadOnlyDatabase(databasePath: string): DatabaseSync {
  if (!fs.existsSync(databasePath)) throw new Error("The local database has not been initialized. Run npm run db:migrate first.");
  return new DatabaseSync(databasePath, { readOnly: true });
}
