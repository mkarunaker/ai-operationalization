import { expect, test, type Page, type Route } from "@playwright/test";

type OutputShape = "short" | "long" | "long_with_derived_short";

function marker(label: string) {
  return `e2e-reader-output-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function createIdeaThroughWrite(
  page: Page,
  input: { shape?: OutputShape; audience?: "professional" | "executive" | "practitioner" | "general"; note?: string; shortRange?: [string, string]; longRange?: [string, string] } = {},
) {
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker("idea")}: An AI initiative becomes dependable only when an accountable owner, appropriate controls, and an observable outcome are explicit.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  if (input.audience) await page.getByLabel("Primary audience").selectOption(input.audience);
  if (input.note !== undefined) await page.getByLabel(/Audience note/).fill(input.note);
  if (input.shape) await page.getByLabel("Output shape").selectOption(input.shape);
  if (input.shortRange) {
    await page.getByLabel("Short minimum words").fill(input.shortRange[0]);
    await page.getByLabel("Short maximum words").fill(input.shortRange[1]);
  }
  if (input.longRange) {
    await page.getByLabel("Long minimum words").fill(input.longRange[0]);
    await page.getByLabel("Long maximum words").fill(input.longRange[1]);
  }
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  await page.waitForURL(/\/draft$/);
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  return ideaId!;
}

function preview(overrides: Record<string, unknown> = {}) {
  return {
    provider: "test-board-provider",
    model: "test-board-model",
    tier: "low",
    budgetCap: 0.05,
    maximumBudgetCap: 0.25,
    pricingAssumption: "synthetic pricing",
    available: false,
    source: { boardReady: true },
    estimatedCost: 0.001,
    planned: [],
    reviewerReruns: {
      medium: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
      high: { provider: "test-provider", model: "test-high", tier: "high", estimatedCost: 0.02, available: true },
    },
    derivedShortRefresh: { provider: "test-provider", model: "derived-low", tier: "low", estimatedCost: 0.001, available: true },
    derivedShortEscalation: { provider: "test-provider", model: "derived-medium", tier: "medium", estimatedCost: 0.01, available: true },
    proofreader: { provider: "test-proofreader-provider", model: "test-proofreader-model", tier: "low", estimates: { short: 0.002, article: 0.009, derived_short: 0.003 }, available: false },
    ...overrides,
  };
}

async function reviewAllDualOutputs(page: Page) {
  await page.getByRole("button", { name: "Run draft review" }).click();
  await page.getByRole("button", { name: "Run derived short-post review" }).click();
  await expect(page.getByText(/Ready for your final judgment|Revise before publishing/).first()).toBeVisible();
}

test("uses reader and output shape controls without naming a delivery platform", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker("capture")}: Capture begins with the reader and the intended output, not a platform.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await expect(page.getByLabel("Output shape")).toHaveValue("short");
  await expect(page.getByLabel("Output shape").locator("option")).toHaveText(["Short post", "Article", "Article + derived short post"]);
  await expect(page.getByText(/LinkedIn|Medium|Substack/)).toHaveCount(0);
  await page.getByLabel("Output shape").selectOption("long_with_derived_short");
  await expect(page.getByText("When both are selected, the short output is derived from the exact long-form version.")).toBeVisible();
});

test("rejects incoherent reader-output updates atomically through the local route", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker("atomic-route")}: The route must never save an incoherent output contract.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const original = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: { outputShape: string; outputPreferences: unknown } };
  const rejected = await page.request.post(`/api/ideas/${ideaId}`, { data: { outputShape: "long" } });
  expect(rejected.status()).toBe(400);
  expect(await rejected.json()).toMatchObject({ error: expect.stringMatching(/complete selected reader-output preferences/i) });
  expect((await (await page.request.get(`/api/ideas/${ideaId}`)).json() as typeof original).idea).toMatchObject(original.idea);
  const coherent = { longFormEnabled: true, longFormMinWords: 1234, longFormMaxWords: 1567, shortFormEnabled: true, shortFormMinWords: 321, shortFormMaxWords: 357, shortFormSource: "derived_from_long" };
  const preferencesOnly = await page.request.post(`/api/ideas/${ideaId}`, { data: { outputPreferences: coherent } });
  expect(preferencesOnly.ok()).toBe(true);
  expect(await preferencesOnly.json()).toMatchObject({ idea: { outputShape: "long_with_derived_short", outputPreferences: coherent } });
  const mismatched = await page.request.post(`/api/ideas/${ideaId}`, { data: { outputShape: "short", outputPreferences: coherent } });
  expect(mismatched.status()).toBe(400);
  expect((await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: unknown }).idea).toMatchObject({ outputShape: "long_with_derived_short", outputPreferences: coherent });
});

test("keeps the Editorial Board setup visible when its local source index is unavailable", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker("unavailable-board")}: The Board setup should explain an unavailable local index without hiding its next step.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  await page.route(`**/api/ideas/${ideaId}**`, async (route: Route) => {
    if (route.request().method() === "GET" && new URL(route.request().url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview: preview({ source: { boardReady: false, unavailableReason: "The Editorial Board needs a ready Book of Knowledge index. Index the configured source before starting a Board run." }, available: false }) } });
    return route.continue();
  });
  await page.goto(`/ideas/${ideaId}/board`);
  await expect(page.getByText("EDITORIAL BOARD RUN")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("ready Book of Knowledge index");
  await page.getByText("Advanced run settings").click();
  await expect(page.getByRole("button", { name: "Run free deterministic editorial test" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run live editorial review" })).toBeDisabled();
});

test("shows immutable Board reader provenance separately from mutable Develop preferences", async ({ page }) => {
  await createIdeaThroughWrite(page, {
    shape: "long_with_derived_short",
    audience: "executive",
    note: "Saved executive provenance note.",
    shortRange: ["321", "357"],
    longRange: ["1234", "1567"],
  });
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Saved Board-run contract");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Saved executive provenance note.");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Long 1234–1567 words");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Short 321–357 words");

  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Develop/ }).click();
  await page.getByLabel("Primary audience").selectOption("general");
  await page.getByLabel(/Audience note/).fill("Current mutable general-reader note.");
  await page.getByLabel("Short minimum words").fill("181");
  await page.getByLabel("Short maximum words").fill("199");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Saved executive provenance note.");
  await expect(page.getByRole("region", { name: "Current reader preferences" })).toContainText("Current mutable general-reader note.");
  await expect(page.getByRole("region", { name: "Current reader preferences" })).toContainText("Short post: 181–199 words");
});

test("creates generic article and derived-short outputs without a delivery channel", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await expect(page.getByText("Article first, then its derived short post.")).toBeVisible();
  await expect(page.getByText(/^DERIVED SHORT POST · VERSION \d+$/)).toBeVisible();
  await expect(page.getByLabel("Working draft")).toBeVisible();
  await expect(page.getByLabel("Derived short post draft")).toBeVisible();
  await expect(page.getByText(/LinkedIn|Medium|Substack/)).toHaveCount(0);
});

test("exposes delivery channel only in Finalize and preserves article-first sequencing", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await reviewAllDualOutputs(page);
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.locator(".finalize-output")).toHaveCount(2);
  await expect(page.locator(".finalize-output").nth(0)).toContainText("ARTICLE");
  await expect(page.locator(".finalize-output").nth(1)).toContainText("DERIVED SHORT POST");
  await expect(page.getByLabel("Delivery channel")).toHaveCount(2);
  await expect(page.getByLabel("Delivery channel").first().locator("option")).toHaveText(["LinkedIn", "Medium", "Substack"]);
  await page.getByLabel("Delivery channel").nth(0).selectOption("medium");
  await page.getByLabel("Delivery channel").nth(1).selectOption("substack");
  const voiceChecks = page.getByRole("button", { name: "Check final voice" });
  await voiceChecks.nth(0).click();
  await voiceChecks.nth(1).click();
  const publish = page.getByRole("button", { name: "Mark this version as published" });
  await expect(publish.nth(1)).toBeDisabled();
  await expect(page.getByText(/Record the exact article publication first/)).toBeVisible();
  await publish.nth(0).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  // Publishing reloads the Finalize cards, so reacquire the remaining exact
  // output rather than retaining a detached locator from the old render.
  await page.getByRole("button", { name: "Mark this version as published" }).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const persisted = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: { publications: Array<{ channel: string; draftFormat: string }> } };
  expect(persisted.idea.publications).toEqual(expect.arrayContaining([
    expect.objectContaining({ channel: "medium", draftFormat: "article" }),
    expect.objectContaining({ channel: "substack", draftFormat: "derived_short" }),
  ]));
});

test("keeps a saved derived short post independently editable and reviewable after article publication", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await reviewAllDualOutputs(page);
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  const voiceChecks = page.getByRole("button", { name: "Check final voice" });
  await voiceChecks.nth(0).click();
  await voiceChecks.nth(1).click();
  await page.getByRole("button", { name: "Mark this version as published" }).first().click();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  const derived = page.getByLabel("Derived short post draft");
  await expect(derived).toBeEnabled();
  await derived.fill("A derived short post can be revised after its source article is recorded. An accountable owner and observable outcome remain the practical test.");
  await page.getByRole("button", { name: "Save derived short version" }).click();
  await page.getByRole("button", { name: "Run derived short-post review" }).click();
  await expect(page.getByText(/Derived short post ready for final judgment|Revise derived short post before finalizing/)).toBeVisible();
});

test("uses proofreader availability rather than Board availability for review controls", async ({ page }) => {
  const ideaId = await createIdeaThroughWrite(page);
  const current = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: Record<string, unknown> };
  const actions: Array<Record<string, unknown>> = [];
  let currentPreview = preview({ available: true, proofreader: { ...preview().proofreader, available: false } });
  await page.route(`**/api/ideas/${ideaId}**`, async (route: Route) => {
    const request = route.request();
    if (request.method() === "GET" && new URL(request.url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview: currentPreview } });
    if (request.method() === "POST") {
      const body = JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
      if (body.action === "run_final_review" || body.action === "run_live_proofread") {
        actions.push(body);
        return route.fulfill({ json: { idea: current.idea } });
      }
    }
    return route.continue();
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Run draft review" })).toContainText("local deterministic proofread · $0.00 · no provider call");
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0]).toMatchObject({ action: "run_final_review", proofreadMode: "deterministic" });

  actions.length = 0;
  currentPreview = preview({ available: false, proofreader: { ...preview().proofreader, available: true } });
  await page.reload();
  await expect(page.getByRole("button", { name: "Run draft review" })).toContainText("test-proofreader-model proofread · est. $0.0020");
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect.poll(() => actions.length).toBe(2);
  expect(actions).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: "run_final_review", proofreadMode: "live_required" }),
    expect.objectContaining({ action: "run_live_proofread", format: "short" }),
  ]));
});

test("explains each exact-output Finalize proofread blocker without enabling publish", async ({ page }) => {
  const ideaId = await createIdeaThroughWrite(page);
  await page.getByRole("button", { name: "Run draft review" }).click();
  const current = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: Record<string, unknown> };
  const completed = current.idea.shortPostFinalReview as Record<string, unknown>;
  let visibleIdea: Record<string, unknown> = current.idea;
  await page.route(`**/api/ideas/${ideaId}`, async (route: Route) => {
    if (route.request().method() === "GET" && !new URL(route.request().url()).search)
      return route.fulfill({ json: { idea: visibleIdea } });
    return route.continue();
  });
  const expectBlocked = async (review: Record<string, unknown> | undefined, message: RegExp) => {
    visibleIdea = { ...current.idea, shortPostFinalReview: review };
    await page.goto(`/ideas/${ideaId}/publish`);
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark this version as published" })).toBeDisabled();
  };
  await expectBlocked(undefined, /Run the combined editorial assessment and proofread/);
  await expectBlocked({ ...completed, proofreadCompleted: false, proofreadStatus: "not_run" }, /live-required proofread has not produced a validated result/);
  await expectBlocked({ ...completed, proofreadCompleted: false, proofreadStatus: "failed" }, /low-cost proofread failed for this exact saved output/);
  await expectBlocked({ ...completed, proofreadCompleted: true, proofreadStatus: "completed", proofreadFindings: [{ id: "material-proof", category: "clarity", severity: "material", current: "unclear wording", suggestion: "clear wording", rationale: "A reader needs a clearer sentence." }] }, /Resolve or explicitly dismiss every material Proofread and clarity finding/);
});

test("preserves unsaved derived-short wording when a concurrent response returns", async ({ page }) => {
  const ideaId = await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await page.goto(`/ideas/${ideaId}/draft`);
  await expect(page.getByLabel("Derived short post draft")).toBeVisible();
  const current = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: Record<string, unknown> };
  const existing = current.idea.derivedShortPost as Record<string, unknown>;
  const virtualIdea: Record<string, unknown> = { ...current.idea, derivedShortPost: { ...existing, body: "Returned wording must not replace an author edit." } };
  let release: (() => void) | undefined;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  await page.route(`**/api/ideas/${ideaId}`, async (route: Route) => {
    const request = route.request();
    if (request.method() === "GET") return route.fulfill({ json: { idea: virtualIdea } });
    const body = JSON.parse(request.postData() ?? "{}") as { action?: string };
    if (body.action === "save_derived_short") {
      await gate;
      return route.fulfill({ json: { idea: virtualIdea } });
    }
    return route.continue();
  });
  await page.reload();
  const derived = page.getByLabel("Derived short post draft");
  await expect(derived).toHaveValue("Returned wording must not replace an author edit.");
  await page.getByRole("button", { name: "Save derived short version" }).click();
  await derived.fill("Unsaved author wording must remain in the editor.");
  release?.();
  await expect(derived).toHaveValue("Unsaved author wording must remain in the editor.");
});

test("rejects caller-supplied proofreader routing fields through the local mutation route", async ({ page }) => {
  const ideaId = await createIdeaThroughWrite(page);
  const result = await page.request.post(`/api/ideas/${ideaId}`, {
    data: { action: "run_live_proofread", format: "short", draftVersionId: "arbitrary", budgetCap: 0.05, provider: "injected", model: "injected", tier: "high", pricingAssumption: "injected" },
  });
  expect(result.status()).toBe(400);
  await expect(result.json()).resolves.toMatchObject({ error: "Proofreader provider, model, tier, and pricing are resolved only by the server route." });
});
