import path from "node:path";
import { getAppConfig } from "../src/config/env";
import { openDatabase } from "../src/persistence/database";
import { migrateDatabase, validateMigrations } from "../src/persistence/migrations";

const migrationsDirectory = path.join(process.cwd(), "migrations");
const migrationIds = validateMigrations(migrationsDirectory);

if (process.argv.includes("--validate-only")) {
  console.log(`Validated ${migrationIds.length} migration file(s).`);
  process.exit(0);
}

const database = openDatabase(getAppConfig().databasePath);
const applied = migrateDatabase(database, migrationsDirectory);
database.close();
console.log(applied.length === 0 ? "Database is already current." : `Applied: ${applied.join(", ")}`);
