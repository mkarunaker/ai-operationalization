import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppConfig } from "@/config/env";

const SESSION_COOKIE = "aeb_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export type LocalSession = { subject: "local-owner"; issuedAt: number; expiresAt: number };

function getSecret(): string {
  const secret = getAppConfig().sessionSecret;
  if (!secret || secret.length < 24) throw new Error("APP_SESSION_SECRET must be configured with at least 24 characters.");
  return secret;
}

function sign(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

export function createSignedSessionToken(session: LocalSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySignedSessionToken(value: string | undefined, secret: string): LocalSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as LocalSession;
    return parsed.subject === "local-owner" && parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function getLocalSession(): Promise<LocalSession | null> {
  const store = await cookies();
  try {
    return verifySignedSessionToken(store.get(SESSION_COOKIE)?.value, getSecret());
  } catch {
    return null;
  }
}

export async function createLocalSession(): Promise<void> {
  const store = await cookies();
  const issuedAt = Date.now();
  store.set(SESSION_COOKIE, createSignedSessionToken({ subject: "local-owner", issuedAt, expiresAt: issuedAt + SESSION_MAX_AGE_SECONDS * 1000 }, getSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearLocalSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function requireLocalSession(): Promise<LocalSession> {
  const session = await getLocalSession();
  if (!session) redirect("/login");
  return session;
}
