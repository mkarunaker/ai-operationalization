import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getAppConfig } from "../src/config/env";

function timestamp() {
  return new Date().toISOString().replace(/[-:.]/g, "").replace("Z", "Z");
}

function quotedSqlPath(value: string) {
  return value.replace(/'/g, "''");
}

function integrityCheck(filePath: string) {
  const database = new DatabaseSync(filePath, { readOnly: true });
  try {
    const integrity = database.prepare("PRAGMA integrity_check").get() as { integrity_check?: string };
    if (integrity.integrity_check !== "ok") throw new Error("SQLite integrity check failed for the backup.");
    database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get();
  } finally {
    database.close();
  }
}

const databasePath = getAppConfig().databasePath;
if (!fs.existsSync(databasePath)) throw new Error("The configured local database does not exist, so no backup was created.");

const backupsDirectory = path.join(path.dirname(databasePath), "backups");
fs.mkdirSync(backupsDirectory, { recursive: true, mode: 0o700 });
fs.chmodSync(backupsDirectory, 0o700);
const backupPath = path.join(backupsDirectory, `ai-editorial-board-remediation-${timestamp()}.sqlite`);
if (fs.existsSync(backupPath)) throw new Error("Refusing to overwrite an existing local backup.");

const source = new DatabaseSync(databasePath);
try {
  source.exec(`VACUUM INTO '${quotedSqlPath(backupPath)}'`);
} finally {
  source.close();
}
fs.chmodSync(backupPath, 0o600);
integrityCheck(backupPath);

const restoreDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-backup-restore-"));
const restorePath = path.join(restoreDirectory, "restore-validation.sqlite");
try {
  fs.copyFileSync(backupPath, restorePath);
  fs.chmodSync(restorePath, 0o600);
  integrityCheck(restorePath);
} finally {
  fs.rmSync(restoreDirectory, { recursive: true, force: true });
}

console.log(`Verified local backup: ${path.relative(process.cwd(), backupPath)}`);
