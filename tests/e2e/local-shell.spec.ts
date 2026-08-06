import { expect, test } from "@playwright/test";

test("shows the local application landing page", async ({ page }) => {
  const response = await page.goto("/");
  await expect(page.getByRole("heading", { name: "AI Editorial Board" })).toBeVisible();
  await expect(page.getByText("A private local workspace for developing and reviewing your ideas.")).toBeVisible();
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "AI Editorial Board" })).toBeVisible();
  const health = await page.request.get("/api/health");
  expect((await health.json()).accessControl).toBe("loopback-only-no-login");
});
