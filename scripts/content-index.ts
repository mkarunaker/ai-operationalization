import nextEnv from "@next/env";
import { refreshContent, setSelectedKnowledgeDocuments } from "../src/content/loader";

// Standalone tsx scripts do not inherit Next.js's automatic .env.local
// loading. Keep source indexing aligned with the running application without
// printing any configured values or source content.
nextEnv.loadEnvConfig(process.cwd());
const args = process.argv.slice(2);
const selectAt = args.indexOf("--select");
if (selectAt >= 0) {
  const names = args.slice(selectAt + 1);
  if (names.length === 0) throw new Error("Pass one or more direct Markdown filenames after --select.");
  setSelectedKnowledgeDocuments(names);
}
const report = refreshContent();
console.log(`Knowledge library: ${report.bok.status}`);
console.log(`  selected documents: ${report.knowledgeDocuments.filter((document) => document.selected).length}; sections: ${report.bok.indexedSectionCount ?? 0}`);
for (const document of report.knowledgeDocuments.filter((item) => item.selected))
  console.log(`  ${document.name}: ${document.status}; version: ${document.version ?? "—"}; sections: ${document.indexedSectionCount ?? 0}`);
console.log(`Voice skill: ${report.voiceSkill.status} (${report.voiceSkill.path})`);
console.log(`  version: ${report.voiceSkill.version ?? "—"}`);
console.log(`Index result: ${report.changed} changed, ${report.skipped} skipped, ${report.retired} retired, ${report.failed} failed.`);
process.exit(report.bok.status === "ready" ? 0 : 1);
