import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

// Each deterministic browser run receives an isolated temporary database and
// notebook. The configured private BOK and voice sources are never used by E2E.
const e2eRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aeb-e2e-"));
const fixtureRoot = path.resolve(process.cwd(), "tests/fixtures");

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3100",
  },
  webServer: {
    command: "npm run db:migrate && npm run content:index && npm run build && npx next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: path.join(e2eRoot, "editorial.sqlite"),
      VISUALS_PATH: path.join(e2eRoot, "visuals"),
      EDITORIAL_NOTEBOOK_PATH: path.join(e2eRoot, "EDITORIAL_NOTEBOOK.md"),
      EAIO_BOK_PATH: path.join(fixtureRoot, "synthetic-bok.md"),
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
