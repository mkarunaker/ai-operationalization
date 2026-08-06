import crypto from "node:crypto";
import { getAppConfig } from "@/config/env";

export function isLocalAuthConfigured(): boolean {
  const config = getAppConfig();
  return Boolean(config.localAuthPassword && config.sessionSecret && config.sessionSecret.length >= 24);
}

export function verifyLocalPassword(candidate: string): boolean {
  const password = getAppConfig().localAuthPassword;
  if (!password) return false;
  const expected = crypto.pbkdf2Sync(password, "ai-editorial-board-local-auth", 120_000, 32, "sha256");
  const received = crypto.pbkdf2Sync(candidate, "ai-editorial-board-local-auth", 120_000, 32, "sha256");
  return crypto.timingSafeEqual(expected, received);
}
