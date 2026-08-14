import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { freshStartConfirmation, freshStartTargets, requireFreshStartConfirmation } from "@/persistence/fresh-start";

const temporaryDirectories: string[] = [];

function temporaryDirectory() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-fresh-start-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});

describe("fresh-start reset containment", () => {
  it("requires the exact destructive confirmation", () => {
    expect(() => requireFreshStartConfirmation([])).toThrow(freshStartConfirmation);
    expect(() => requireFreshStartConfirmation([freshStartConfirmation])).not.toThrow();
  });

  it("rejects project-root and external targets while allowing a nonexistent project-local database", () => {
    const projectRoot = temporaryDirectory();
    const externalRoot = temporaryDirectory();
    const databasePath = path.join(projectRoot, "data", "editorial.sqlite");
    const visualPath = path.join(projectRoot, "visuals");

    const realProjectRoot = fs.realpathSync(projectRoot);
    expect(freshStartTargets(projectRoot, databasePath, visualPath)).toEqual([
      path.join(realProjectRoot, "data", "editorial.sqlite"),
      path.join(realProjectRoot, "data", "editorial.sqlite-wal"),
      path.join(realProjectRoot, "data", "editorial.sqlite-shm"),
      path.join(realProjectRoot, "visuals"),
    ]);
    expect(() => freshStartTargets(projectRoot, projectRoot, visualPath)).toThrow(/limited to database and visual paths inside this project/i);
    expect(() => freshStartTargets(projectRoot, path.join(externalRoot, "editorial.sqlite"), visualPath)).toThrow(/limited to database and visual paths inside this project/i);
  });

  it("rejects an in-project symlink to an external visual root without touching its target", () => {
    const projectRoot = temporaryDirectory();
    const externalRoot = temporaryDirectory();
    const sentinel = path.join(externalRoot, "must-survive.txt");
    fs.writeFileSync(sentinel, "outside the project");
    const visualPath = path.join(projectRoot, "visuals");
    fs.symlinkSync(externalRoot, visualPath);

    expect(() => freshStartTargets(projectRoot, path.join(projectRoot, "data", "editorial.sqlite"), visualPath)).toThrow(/limited to database and visual paths inside this project/i);
    expect(fs.readFileSync(sentinel, "utf8")).toBe("outside the project");
  });

  it("keeps a sibling safe when a project-local symlinked parent contains a nonexistent reset target", () => {
    const projectRoot = temporaryDirectory();
    const targetRoot = path.join(projectRoot, "actual-data");
    fs.mkdirSync(targetRoot);
    const sentinel = path.join(targetRoot, "must-survive.txt");
    fs.writeFileSync(sentinel, "safe sibling");
    const linkedData = path.join(projectRoot, "data");
    fs.symlinkSync(targetRoot, linkedData);

    const [databasePath] = freshStartTargets(projectRoot, path.join(linkedData, "editorial.sqlite"), path.join(projectRoot, "visuals"));
    expect(databasePath).toBe(path.join(fs.realpathSync(targetRoot), "editorial.sqlite"));
    fs.rmSync(databasePath, { force: true });
    expect(fs.readFileSync(sentinel, "utf8")).toBe("safe sibling");
  });
});
