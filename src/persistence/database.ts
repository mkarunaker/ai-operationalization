import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const reconciledRuntimeDatabases = new Set<string>();

/**
 * A request-bound process cannot honestly resume a run that was active when
 * the server stopped. On the first normal open in a new process, close only
 * those orphaned runs so reload never presents them as queued continuation.
 */
export function reconcileInterruptedReviewRuns(database: DatabaseSync) {
  database
    .prepare(
      `UPDATE review_runs
          SET status = 'failed',
              completed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
              interrupted_at = COALESCE(interrupted_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        WHERE status = 'running'
          AND review_type = 'editorial'
          AND execution_mode = 'live'
          AND EXISTS (
            SELECT 1
              FROM editorial_run_snapshots snapshot
             WHERE snapshot.review_run_id = review_runs.id
          )`,
    )
    .run();
}

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
    if (!reconciledRuntimeDatabases.has(databasePath)) {
      reconcileInterruptedReviewRuns(database);
      reconciledRuntimeDatabases.add(databasePath);
    }
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

/** Open a read-only projection only after startup recovery has reconciled an interrupted run. */
export function openRecoveredReadOnlyDatabase(databasePath: string): DatabaseSync {
  const recovery = openInitializedDatabase(databasePath);
  recovery.close();
  return openReadOnlyDatabase(databasePath);
}
