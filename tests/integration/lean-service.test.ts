import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createIdea, createTheme, developIdea, getIdea, listIdeas, listThemes, runLeanBoard, saveEditedDraft } from "@/lean/service";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-lean-"));
const previousDatabasePath = process.env.DATABASE_PATH;

beforeAll(() => { process.env.DATABASE_PATH = path.join(root, "lean.sqlite"); });
afterAll(() => { if (previousDatabasePath === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = previousDatabasePath; fs.rmSync(root, { recursive: true, force: true }); });

describe("lean idea queue", () => {
  it("saves an optional-theme idea without a model call and carries it through board and draft", () => {
    const theme = createTheme("A useful custom theme");
    const created = createIdea({ rawNotes: "A rough observation about operational value and AI activity.", themeIds: [theme.id] });
    expect(created.status).toBe("inbox");
    expect(created.themes).toEqual([theme]);
    expect(listThemes().some((item) => item.name === "Enterprise AI operationalization")).toBe(true);
    expect(listIdeas().some((item) => item.id === created.id)).toBe(true);

    const ready = developIdea(created.id, { useBestJudgment: true, answers: [] });
    expect(ready.status).toBe("ready_to_review");
    const reviewed = runLeanBoard(created.id);
    expect(reviewed.status).toBe("drafted");
    expect(reviewed.editorialBrief?.reviews).toHaveLength(3);
    expect(reviewed.draft?.body).toContain("operational value");
    const edited = saveEditedDraft(created.id, "A user-owned final draft.");
    expect(edited.draft?.body).toBe("A user-owned final draft.");
    expect(getIdea(created.id)?.draft?.version).toBeGreaterThan(1);
  });
});
