import nextEnv from "@next/env";
import { refreshContent } from "../src/content/loader";

// Standalone tsx scripts do not inherit Next.js's automatic .env.local
// loading. Keep source indexing aligned with the running application without
// printing any configured values or source content.
nextEnv.loadEnvConfig(process.cwd());
const report = refreshContent();
console.log(`BOK: ${report.bok.status} (${report.bok.path})`);
console.log(`  version: ${report.bok.version ?? "—"}; sections: ${report.bok.indexedSectionCount ?? 0}`);
console.log(`Voice skill: ${report.voiceSkill.status} (${report.voiceSkill.path})`);
console.log(`  version: ${report.voiceSkill.version ?? "—"}`);
console.log(`Index result: ${report.changed} changed, ${report.skipped} skipped, ${report.retired} retired, ${report.failed} failed.`);
process.exit(report.bok.status === "ready" ? 0 : 1);
