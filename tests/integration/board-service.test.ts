import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runBoard } from "@/board/service";
import { choosePath, completeIntake, createIntake, getWorkspace } from "@/intake/service";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-board-"));
const priorDatabasePath = process.env.DATABASE_PATH;
beforeAll(() => { process.env.DATABASE_PATH = path.join(root, "board.sqlite"); });
afterAll(() => { if (priorDatabasePath === undefined) delete process.env.DATABASE_PATH; else process.env.DATABASE_PATH = priorDatabasePath; fs.rmSync(root, { recursive: true, force: true }); });

describe("Editorial Board orchestration", () => {
  it("runs only Strategist and Skeptic for pre-draft idea review", async () => {
    const created = await createIntake({ rawNotes: "A practical argument for treating AI operations as a management discipline." });
    const initial = getWorkspace(created.id)!;
    completeIntake(created.id, { useBestJudgment: true, answers: initial.questions.map((question) => ({ question, answer: "", choice: "best_judgment" })) });
    choosePath(created.id, "review_idea");
    const result = await runBoard(created.id);
    expect(result.status).toBe("completed");
    expect(result.reviews.map((review) => review.role)).toEqual(["strategist", "skeptic"]);
    expect(result.reviews.every((review) => review.recommendations.length > 0)).toBe(true);
    expect(result.estimatedCost).toBe(0);
  });
});
