import { refreshContent } from "../src/content/loader";

const report = refreshContent();
console.log(`BOK: ${report.bok.status} (${report.bok.path})`);
console.log(`  version: ${report.bok.version ?? "—"}; sections: ${report.bok.indexedSectionCount ?? 0}`);
console.log(`Voice skill: ${report.voiceSkill.status} (${report.voiceSkill.path})`);
console.log(`  version: ${report.voiceSkill.version ?? "—"}`);
console.log(`Index result: ${report.changed} changed, ${report.skipped} skipped, ${report.retired} retired, ${report.failed} failed.`);
process.exit(report.bok.status === "ready" ? 0 : 1);
