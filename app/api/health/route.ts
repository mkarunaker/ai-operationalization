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
    bokReadable: fs.existsSync(config.bokPath),
    voiceSkillConfigured: Boolean(config.voiceSkillPath),
  });
}
