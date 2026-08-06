import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "@/security/rate-limit";

describe("FixedWindowRateLimiter", () => {
  it("blocks further login attempts after the configured limit", () => {
    let time = 0;
    const limiter = new FixedWindowRateLimiter(2, 60_000, () => time);
    expect(limiter.consume("local-login").allowed).toBe(true);
    expect(limiter.consume("local-login").allowed).toBe(true);
    const blocked = limiter.consume("local-login");
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.retryAfterSeconds).toBe(60);
    time = 60_001;
    expect(limiter.consume("local-login").allowed).toBe(true);
  });
});
