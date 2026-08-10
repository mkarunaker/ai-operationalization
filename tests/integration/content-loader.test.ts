import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { refreshContent, searchKnowledge } from "../../src/content/loader";
import { openDatabase } from "../../src/persistence/database";
import { migrateDatabase } from "../../src/persistence/migrations";

const temporaryDirectories: string[] = [];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-content-"));
  temporaryDirectories.push(root);
  const bok = path.join(root, "EAIO_Canonical_Knowledge_Base.md");
  const voiceDirectory = path.join(root, "voice");
  fs.mkdirSync(voiceDirectory);
  fs.writeFileSync(bok, "# Editorial strategy\n\nUse a clear point of view.\n\n## Audience\n\nWrite for thoughtful operators.");
  fs.writeFileSync(path.join(voiceDirectory, "SKILL.md"), "# Voice\n\nNatural and direct.");
  const databasePath = path.join(root, "board.sqlite");
  const database = openDatabase(databasePath);
  try {
    migrateDatabase(database, path.join(process.cwd(), "migrations"));
  } finally {
    database.close();
  }
  return { root, bok, voiceDirectory, config: { appBaseUrl: "http://127.0.0.1:3100", databasePath, visualAssetsPath: path.join(root, "visuals"), bokPath: bok, voiceSkillPath: voiceDirectory, editorialNotebookPath: path.join(root, "EDITORIAL_NOTEBOOK.md") } };
}

afterEach(() => { for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });

describe("runtime content loader", () => {
  it("indexes configured sources, skips unchanged content, and supports FTS search", () => {
    const input = fixture();
    const first = refreshContent(input.config);
    expect(first.bok).toMatchObject({ status: "ready", indexedSectionCount: 2 });
    expect(first.voiceSkill.status).toBe("ready");
    expect(searchKnowledge("operators", 5, input.config)).toEqual([expect.objectContaining({ headingPath: "Editorial strategy › Audience", retrievalMethod: "fts5" })]);
    expect(refreshContent(input.config)).toMatchObject({ changed: 0, skipped: 2, failed: 0 });
  });

  it("preserves the prior valid index when an invalid refresh is attempted", () => {
    const input = fixture();
    refreshContent(input.config);
    fs.writeFileSync(input.bok, "\n\n");
    const failed = refreshContent(input.config);
    expect(failed.bok.status).toBe("error");
    expect(searchKnowledge("operators", 5, input.config)).toHaveLength(1);
  });
});
