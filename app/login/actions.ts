"use server";

import { redirect } from "next/navigation";
import { createLocalSession } from "@/auth/session";
import { isLocalAuthConfigured, verifyLocalPassword } from "@/auth/password";
import { localLoginRateLimiter } from "@/security/rate-limit";

export type LoginState = { error?: string };

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  if (!isLocalAuthConfigured()) {
    return { error: "Local authentication is not configured. Set LOCAL_AUTH_PASSWORD and APP_SESSION_SECRET in .env.local." };
  }
  const limit = localLoginRateLimiter.consume("local-login");
  if (!limit.allowed) return { error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` };
  const password = formData.get("password");
  if (typeof password !== "string" || !verifyLocalPassword(password)) return { error: "Incorrect local passphrase." };
  await createLocalSession();
  redirect("/dashboard");
}
