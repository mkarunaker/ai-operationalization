import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getAppConfig } from "@/config/env";

const notebookInput = z.object({ content: z.string().trim().min(1).max(200_000) });
const now = () => new Date().toISOString();
const checksum = (content: string) => crypto.createHash("sha256").update(content).digest("hex");
const versionId = () => now().replace(/[-:.]/g, "").replace("Z", "Z");

export type NotebookDocument = { content: string; path: string; updatedAt: string; checksum: string; versions: Array<{ id: string; savedAt: string; path: string }> };

function initialNotebook() {
  return `# Editorial Notebook

> Working space for evolving ideas, theme notes, research reminders, and candidate posts. This is not the canonical Book of Knowledge. Promote a note into the BOK only after deliberate review.

## 1. See through the AI hype

### Working notes

### Candidate post ideas

- AI activity is not AI maturity.
- From AI hype to operational value.
- Why copying another company’s AI playbook is usually the wrong starting point.

## 2. Understand the operationalization gap

### Working notes

### Candidate post ideas

- The missing middle of enterprise AI.
- Why pilots stall after the demo.
- Governance, platforms, and organizational friction are connected problems.

## 3. Improve leadership judgment

### Working notes

### Candidate post ideas

- FOMO is not an AI strategy.
- What boards should ask before demanding an AI roadmap.
- The questions to ask before approving another pilot.

## 4. Select the right work

### Working notes

### Candidate post ideas

- Start with the workflow problem.
- Is AI actually needed here?
- What outcome would make this use case worth operating?
- How much autonomy is justified?

## 5. Build, adopt, and operate with principles

### Working notes

### Candidate post ideas

- Human accountability does not disappear when an agent acts.
- Design for blast radius, reversibility, and least privilege.
- Observability tells you what happened; outcomes tell you whether it mattered.
- A launched workflow is not yet an adopted capability.

## Open questions and research reminders

`;
}

function paths() {
  const notebookPath = getAppConfig().editorialNotebookPath;
  return { notebookPath, directory: path.dirname(notebookPath), versionsDirectory: path.join(path.dirname(notebookPath), "versions") };
}

function ensureNotebook() {
  const target = paths();
  fs.mkdirSync(target.directory, { recursive: true, mode: 0o700 });
  fs.mkdirSync(target.versionsDirectory, { recursive: true, mode: 0o700 });
  if (!fs.existsSync(target.notebookPath)) atomicWrite(target.notebookPath, initialNotebook());
  return target;
}

function atomicWrite(filePath: string, content: string) {
  const temporaryPath = `${filePath}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporaryPath, content, { encoding: "utf8", mode: 0o600 });
  fs.renameSync(temporaryPath, filePath);
  fs.chmodSync(filePath, 0o600);
}

function versions(versionsDirectory: string) {
  return fs.readdirSync(versionsDirectory)
    .filter((file) => /^\d{8}T\d{6}\d{3}Z\.md$/.test(file))
    .sort((left, right) => right.localeCompare(left))
    .map((file) => ({ id: file.replace(/\.md$/, ""), savedAt: `${file.slice(0, 4)}-${file.slice(4, 6)}-${file.slice(6, 8)}T${file.slice(9, 15).slice(0, 2)}:${file.slice(9, 15).slice(2, 4)}:${file.slice(9, 15).slice(4, 6)}.${file.slice(15, 18)}Z`, path: path.join(versionsDirectory, file) }));
}

export function getNotebook(): NotebookDocument {
  const target = ensureNotebook(); const content = fs.readFileSync(target.notebookPath, "utf8"); const stat = fs.statSync(target.notebookPath);
  return { content, path: target.notebookPath, updatedAt: stat.mtime.toISOString(), checksum: checksum(content), versions: versions(target.versionsDirectory) };
}

export function saveNotebook(input: unknown): NotebookDocument {
  const { content } = notebookInput.parse(input); const target = ensureNotebook(); const id = versionId();
  atomicWrite(path.join(target.versionsDirectory, `${id}.md`), content);
  atomicWrite(target.notebookPath, content);
  return getNotebook();
}
