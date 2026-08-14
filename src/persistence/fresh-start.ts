import fs from "node:fs";
import path from "node:path";

export const freshStartConfirmation = "--confirm-fresh-start";

function realPathThroughExistingAncestor(target: string) {
  const missing: string[] = [];
  let ancestor = path.resolve(target);
  while (true) {
    try {
      const stat = fs.lstatSync(ancestor);
      if (stat.isSymbolicLink()) return path.join(fs.realpathSync(ancestor), ...missing);
      return path.join(fs.realpathSync(ancestor), ...missing);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(ancestor);
      if (parent === ancestor) throw error;
      missing.unshift(path.basename(ancestor));
      ancestor = parent;
    }
  }
}

function isRealProjectChild(projectRoot: string, target: string) {
  const realProjectRoot = fs.realpathSync(projectRoot);
  const realTarget = realPathThroughExistingAncestor(target);
  const relative = path.relative(realProjectRoot, realTarget);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

export function requireFreshStartConfirmation(args: string[]) {
  if (!args.includes(freshStartConfirmation))
    throw new Error(`This permanently deletes the local database and generated visual assets. Re-run with ${freshStartConfirmation} after stopping the app.`);
}

export function freshStartTargets(projectRoot: string, databasePath: string, visualAssetsPath: string) {
  const targets = [databasePath, `${databasePath}-wal`, `${databasePath}-shm`, visualAssetsPath];
  if (!targets.every((target) => isRealProjectChild(projectRoot, target)))
    throw new Error("Fresh-start reset is limited to database and visual paths inside this project.");
  return targets.map((target) => realPathThroughExistingAncestor(target));
}
