import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Each deterministic browser run receives an isolated temporary database and
// notebook. The configured private BOK and voice sources are never used by E2E.
const e2eRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-e2e-"));
const fixtureRoot = path.resolve(process.cwd(), "tests/fixtures");
const libraryRoot = path.join(e2eRoot, "knowledge-library");
fs.mkdirSync(libraryRoot, { mode: 0o700 });
fs.copyFileSync(path.join(fixtureRoot, "synthetic-bok.md"), path.join(libraryRoot, "synthetic-bok.md"));
fs.writeFileSync(path.join(libraryRoot, "hostile-<img src=x onerror=alert(1)>.md"), "# Browser safety fixture\n\nThis inert test document must never execute as markup.", { mode: 0o600 });
const requestedPort = Number(process.env.EDITORIAL_E2E_PORT ?? "3100");
if (!Number.isInteger(requestedPort) || requestedPort < 1024 || requestedPort > 65_535)
  throw new Error("EDITORIAL_E2E_PORT must be an integer between 1024 and 65535.");
const e2eBaseUrl = `http://127.0.0.1:${requestedPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: e2eBaseUrl,
  },
  webServer: {
    command: `npm run db:migrate && npm run content:index -- --select synthetic-bok.md && npm run build && npx next start --hostname 127.0.0.1 --port ${requestedPort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: path.join(e2eRoot, "editorial.sqlite"),
      VISUALS_PATH: path.join(e2eRoot, "visuals"),
      EDITORIAL_NOTEBOOK_PATH: path.join(e2eRoot, "EDITORIAL_NOTEBOOK.md"),
      EAIO_BOK_PATH: path.join(fixtureRoot, "retired-canonical.md"),
      EAIO_BOK_LIBRARY_PATH: libraryRoot,
      KK_VOICE_SKILL_PATH: path.join(fixtureRoot, "synthetic-voice"),
      // Deterministic browser tests must not inherit live credentials from the
      // developer shell. Any accidental provider path fails locally instead.
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      ZENMUX_API_KEY: "",
      EDITORIAL_TEST_DISABLE_PROVIDER_CALLS: "1",
    },
  },
});
