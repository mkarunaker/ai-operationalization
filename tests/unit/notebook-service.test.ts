import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getNotebook, saveNotebook } from "@/notebook/service";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-notebook-"));
const priorPath = process.env.EDITORIAL_NOTEBOOK_PATH;

beforeAll(() => { process.env.EDITORIAL_NOTEBOOK_PATH = path.join(root, "EDITORIAL_NOTEBOOK.md"); });
afterAll(() => { if (priorPath === undefined) delete process.env.EDITORIAL_NOTEBOOK_PATH; else process.env.EDITORIAL_NOTEBOOK_PATH = priorPath; fs.rmSync(root, { recursive: true, force: true }); });

describe("editorial notebook", () => {
  it("creates a local working document and immutable snapshot on explicit save", () => {
    expect(getNotebook().content).toContain("See through the AI hype");
    const saved = saveNotebook({ content: "# My private editorial note\n\nA useful observation." });
    expect(saved.content).toContain("A useful observation.");
    expect(saved.versions).toHaveLength(1);
    expect(fs.readFileSync(saved.versions[0].path, "utf8")).toBe(saved.content);
    expect(fs.statSync(saved.path).mode & 0o777).toBe(0o600);
  });
});
