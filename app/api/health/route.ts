import fs from "node:fs";
import { NextResponse } from "next/server";
import { getAppConfig } from "@/config/env";

export const runtime = "nodejs";

export function GET() {
  const config = getAppConfig();
  return NextResponse.json({
    status: "ok",
    application: "AI Editorial Board",
    localOnly: true,
    accessControl: "loopback-only-no-login",
    databaseConfigured: Boolean(config.databasePath),
    knowledgeLibraryReadable: fs.existsSync(config.knowledgeLibraryPath) && fs.statSync(config.knowledgeLibraryPath).isDirectory(),
    voiceSkillConfigured: Boolean(config.voiceSkillPath),
  });
}
