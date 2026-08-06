import { expect, test } from "@playwright/test";

test("shows the local application landing page", async ({ page }) => {
  const response = await page.goto("/");
  await expect(page.getByRole("heading", { name: "Start with the idea, not the format." })).toBeVisible();
  expect(page.url()).toContain("/dashboard");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Start with the idea, not the format." })).toBeVisible();
  await page.getByLabel("Your starting point").fill("A rough idea about the missing middle of enterprise AI and why implementation discipline matters.");
  await page.getByRole("button", { name: "Continue to clarification →" }).click();
  await expect(page.getByRole("heading", { name: "A few focused questions." })).toBeVisible();
  await page.getByRole("button", { name: "Use your best judgment" }).click();
  await expect(page.getByRole("heading", { name: "Make the intent explicit." })).toBeVisible();
  await page.getByRole("button", { name: "Review the idea first" }).click();
  await expect(page.getByText("Your path is saved. Editorial execution begins in the next milestone.")).toBeVisible();
  await page.goto("/content-status");
  await expect(page.getByRole("heading", { name: "Content status" })).toBeVisible();
  await expect(page.getByText("Canonical knowledge base")).toBeVisible();
  const sourceStatus = await page.request.get("/api/content/status?q=enterprise");
  expect(sourceStatus.ok()).toBeTruthy();
  expect((await sourceStatus.json()).bok.status).toBe("ready");
  const health = await page.request.get("/api/health");
  expect((await health.json()).accessControl).toBe("loopback-only-no-login");
});
