import fs from "node:fs";
import path from "node:path";
import { getAppConfig } from "../src/config/env";
import { openDatabase } from "../src/persistence/database";
import { freshStartTargets, requireFreshStartConfirmation } from "../src/persistence/fresh-start";
import { migrateDatabase } from "../src/persistence/migrations";

requireFreshStartConfirmation(process.argv);

const config = getAppConfig();
const targets = freshStartTargets(process.cwd(), config.databasePath, config.visualAssetsPath);

for (const target of targets) {
  fs.rmSync(target, { recursive: true, force: true });
}

const database = openDatabase(config.databasePath);
try {
  const applied = migrateDatabase(database, path.join(process.cwd(), "migrations"));
  console.log(`Fresh local workspace created from ${applied.join(", ")}.`);
} finally {
  database.close();
}
