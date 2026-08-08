import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "../../next.config";

describe("content security policy", () => {
  it("keeps development debugging support but removes unsafe-eval from production", () => {
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).not.toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(false)).toContain("default-src 'self'");
    expect(contentSecurityPolicy(false)).toContain("frame-ancestors 'none'");
  });
});
