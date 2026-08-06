import fs from "node:fs";
import { NextResponse } from "next/server";
import { isLocalAuthConfigured } from "@/auth/password";
import { getAppConfig } from "@/config/env";

export const runtime = "nodejs";

export function GET() {
  const config = getAppConfig();
  return NextResponse.json({
    status: "ok",
    application: "AI Editorial Board",
    localOnly: true,
    authConfigured: isLocalAuthConfigured(),
    databaseConfigured: Boolean(config.databasePath),
    bokReadable: fs.existsSync(config.bokPath),
    voiceSkillConfigured: Boolean(config.voiceSkillPath),
  });
}
