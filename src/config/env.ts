import path from "node:path";

export type AppConfig = {
  appBaseUrl: string;
  databasePath: string;
  bokPath: string;
  voiceSkillPath: string;
  localAuthPassword?: string;
  sessionSecret?: string;
};

function resolveLocalPath(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(/* turbopackIgnore: true */ process.cwd(), value);
}

export function getAppConfig(): AppConfig {
  return {
    appBaseUrl: process.env.APP_BASE_URL ?? "http://127.0.0.1:3100",
    databasePath: resolveLocalPath(process.env.DATABASE_PATH ?? "./data/ai-editorial-board.sqlite"),
    bokPath: resolveLocalPath(
      process.env.EAIO_BOK_PATH ?? "./content/knowledge/EAIO_Canonical_Knowledge_Base.md",
    ),
    voiceSkillPath: process.env.KK_VOICE_SKILL_PATH ?? "~/.codex/skills/kk-spoken-voice",
    localAuthPassword: process.env.LOCAL_AUTH_PASSWORD,
    sessionSecret: process.env.APP_SESSION_SECRET,
  };
}
