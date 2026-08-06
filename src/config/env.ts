import path from "node:path";

export type AppConfig = {
  appBaseUrl: string;
  databasePath: string;
  bokPath: string;
  voiceSkillPath: string;
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
  };
}
