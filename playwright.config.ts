import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3101",
  },
  webServer: {
    command: "npx next dev --hostname 127.0.0.1 --port 3101",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
    env: {
      DATABASE_PATH: "/tmp/ai-editorial-board-e2e.sqlite",
      EDITORIAL_NOTEBOOK_PATH: "/tmp/ai-editorial-notebook-e2e/EDITORIAL_NOTEBOOK.md",
    },
  },
});
