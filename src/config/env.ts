import path from "node:path";

export type AppConfig = {
  appBaseUrl: string;
  databasePath: string;
  bokPath: string;
  voiceSkillPath: string;
  openAiApiKey?: string;
  zenMuxApiKey?: string;
  editorialProvider?: "mock" | "openai" | "zenmux";
  openAiEditorialModel?: string;
  zenMuxEditorialModel?: string;
};

function resolveLocalPath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(/* turbopackIgnore: true */ process.cwd(), value);
}

export function expandHomePath(value: string): string {
  if (value === "~") return process.env.HOME ?? value;
  if (value.startsWith("~/")) return path.join(process.env.HOME ?? "", value.slice(2));
  return resolveLocalPath(value);
}

export function getAppConfig(): AppConfig {
  return {
    appBaseUrl: process.env.APP_BASE_URL ?? "http://127.0.0.1:3100",
    databasePath: resolveLocalPath(process.env.DATABASE_PATH ?? "./data/ai-editorial-board.sqlite"),
    bokPath: resolveLocalPath(
      process.env.EAIO_BOK_PATH ?? "./content/knowledge/EAIO_Canonical_Knowledge_Base.md",
    ),
    voiceSkillPath: expandHomePath(process.env.KK_VOICE_SKILL_PATH ?? "~/.codex/skills/kk-spoken-voice"),
    openAiApiKey: process.env.OPENAI_API_KEY,
    zenMuxApiKey: process.env.ZENMUX_API_KEY,
    editorialProvider: process.env.EDITORIAL_PROVIDER === "zenmux" ? "zenmux" : process.env.EDITORIAL_PROVIDER === "openai" ? "openai" : "mock",
    openAiEditorialModel: process.env.OPENAI_EDITORIAL_MODEL ?? "gpt-5-mini",
    zenMuxEditorialModel: process.env.ZENMUX_EDITORIAL_MODEL ?? "x-ai/grok-4.5",
  };
}
