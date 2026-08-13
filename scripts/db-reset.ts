import fs from "node:fs";
import path from "node:path";
import { getAppConfig } from "../src/config/env";
import { openDatabase } from "../src/persistence/database";
import { migrateDatabase } from "../src/persistence/migrations";

const confirmation = "--confirm-fresh-start";

function isSafeProjectChild(target: string) {
  const root = path.resolve(process.cwd());
  const resolved = path.resolve(target);
  const relative = path.relative(root, resolved);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

if (!process.argv.includes(confirmation)) {
  throw new Error(
    `This permanently deletes the local database and generated visual assets. Re-run with ${confirmation} after stopping the app.`,
  );
}

const config = getAppConfig();
if (!isSafeProjectChild(config.databasePath) || !isSafeProjectChild(config.visualAssetsPath)) {
  throw new Error("Fresh-start reset is limited to database and visual paths inside this project.");
}

for (const target of [config.databasePath, `${config.databasePath}-wal`, `${config.databasePath}-shm`, config.visualAssetsPath]) {
  fs.rmSync(target, { recursive: true, force: true });
}

const database = openDatabase(config.databasePath);
try {
  const applied = migrateDatabase(database, path.join(process.cwd(), "migrations"));
  console.log(`Fresh local workspace created from ${applied.join(", ")}.`);
} finally {
  database.close();
}
