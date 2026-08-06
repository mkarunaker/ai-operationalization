import { afterEach, describe, expect, it } from "vitest";
import { isLocalAuthConfigured, verifyLocalPassword } from "@/auth/password";
import { createSignedSessionToken, verifySignedSessionToken } from "@/auth/session";

const originalPassword = process.env.LOCAL_AUTH_PASSWORD;
const originalSecret = process.env.APP_SESSION_SECRET;

afterEach(() => {
  process.env.LOCAL_AUTH_PASSWORD = originalPassword;
  process.env.APP_SESSION_SECRET = originalSecret;
});

describe("local authentication security", () => {
  it("requires configured credentials and verifies the passphrase", () => {
    process.env.LOCAL_AUTH_PASSWORD = "correct horse battery staple";
    process.env.APP_SESSION_SECRET = "a-very-long-local-test-secret-value";
    expect(isLocalAuthConfigured()).toBe(true);
    expect(verifyLocalPassword("correct horse battery staple")).toBe(true);
    expect(verifyLocalPassword("incorrect")).toBe(false);
  });

  it("rejects a tampered signed session", () => {
    const secret = "a-very-long-local-test-secret-value";
    const session = { subject: "local-owner" as const, issuedAt: 0, expiresAt: Date.now() + 60_000 };
    const token = createSignedSessionToken(session, secret);
    expect(verifySignedSessionToken(token, secret)).toEqual(session);
    expect(verifySignedSessionToken(`${token}changed`, secret)).toBeNull();
  });
});
