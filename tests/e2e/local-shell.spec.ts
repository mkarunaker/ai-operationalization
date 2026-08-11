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
  const captureBounds = await page.getByLabel("What are you thinking about?").boundingBox();
  const saveBounds = await page.getByRole("button", { name: "Save to Inbox" }).boundingBox();
  const addThemeBounds = await page.getByRole("button", { name: "Add theme" }).boundingBox();
  expect(captureBounds).not.toBeNull();
  expect(saveBounds).not.toBeNull();
  expect(addThemeBounds).not.toBeNull();
  expect(Math.abs((captureBounds!.x + captureBounds!.width) - (saveBounds!.x + saveBounds!.width))).toBeLessThanOrEqual(2);
  expect(addThemeBounds!.width).toBeLessThanOrEqual(30);
  expect(addThemeBounds!.height).toBeLessThanOrEqual(30);
  await page.getByLabel("What are you thinking about?").fill(`${marker("capture")}: Capture begins with the reader and the intended output, not a platform.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await expect(page.getByText("Who should this help?")).toBeVisible();
  await expect(page.getByText("What should this Board run create?")).toBeVisible();
  await expect(page.getByText("View original capture")).toBeVisible();
  await expect(page.locator(".lifecycle-actions")).toContainText("Park this idea");
  await expect(page.locator(".lifecycle-actions")).toContainText("Delete this idea");
  const developmentSectionGap = await page.locator(".development-section").evaluateAll((sections) => {
    const [first, second] = sections.map((section) => section.getBoundingClientRect());
    return second.top - first.bottom;
  });
  expect(developmentSectionGap).toBeGreaterThanOrEqual(28);
  await expect(page.locator("label.audience-note-field").getByLabel(/Audience note/)).toBeVisible();
  await expect(page.getByLabel("Output shape")).toHaveValue("short");
  await expect(page.getByLabel("Output shape").locator("option")).toHaveText(["Short post", "Article", "Article + derived short post"]);
  await expect(page.getByText(/LinkedIn|Medium|Substack/)).toHaveCount(0);
  await page.getByLabel("Output shape").selectOption("long_with_derived_short");
  await expect(page.getByText("When both are selected, the short output is derived from the exact long-form version.")).toBeVisible();
  await expect(page.getByText("Optional research and evidence")).toBeVisible();
  await page.getByText("Optional research and evidence").click();
  await expect(page.getByText("Record sources I already have")).toBeVisible();
  await expect(page.getByText("Prepare a local research brief")).toBeVisible();
  const researchChoiceBounds = await page.locator(".research-mode-picker label").evaluateAll((choices) => choices.map((choice) => {
    const box = choice.getBoundingClientRect();
    return { top: box.top, bottom: box.bottom, left: box.left };
  }));
  expect(researchChoiceBounds).toHaveLength(2);
  expect(researchChoiceBounds[1]!.top).toBeGreaterThan(researchChoiceBounds[0]!.bottom);
  expect(Math.abs(researchChoiceBounds[1]!.left - researchChoiceBounds[0]!.left)).toBeLessThanOrEqual(2);
  await expect(page.locator(".research-field-group").first()).toContainText("1. Frame the question");
  await expect(page.locator(".research-field-group").nth(1)).toContainText("2. Preserve what you found");
});

test("deletes an unpublished idea directly from the Ideas list", async ({ page }) => {
  const title = marker("queue-delete");
  await page.goto("/");
  await page.getByLabel(/Working title/).fill(title);
  await page.getByLabel("What are you thinking about?").fill("An unpublished local capture can be removed from the queue without opening its workspace.");
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.goto("/");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: `Delete ${title}` }).click();
  await expect(page.locator(".idea-card").filter({ hasText: title })).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Deleted");
});

test("keeps the Knowledge sources page inside the shared application navigation", async ({ page }) => {
  await page.goto("/content-status");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Ideas" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Editorial Notebook" })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: "Knowledge sources" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { name: "Content status" })).toBeVisible();
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

test("organizes Write as one clear setup, matched output editors, and flat review surfaces", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await expect(page.getByRole("region", { name: "Writing setup" })).toContainText("Saved Board-run contract");
  await expect(page.getByRole("region", { name: "Writing setup" })).toContainText("Current Develop preferences");
  const localLedger = page.getByRole("region", { name: "Local run ledger" });
  await expect(localLedger).toContainText("Tokens used");
  await expect(localLedger).toContainText("$0.00 local");
  await expect(localLedger).not.toContainText("est. $");
  await expect(page.locator(".output-editor")).toHaveCount(2);
  await expect(page.locator(".output-editor").nth(0)).toContainText("ARTICLE");
  await expect(page.locator(".output-editor").nth(1)).toContainText("DERIVED SHORT POST");
  await expect(page.locator(".output-editor").nth(0).getByRole("button", { name: "Run draft review" })).toBeVisible();
  await expect(page.locator(".output-editor").nth(1).getByRole("button", { name: "Run derived short-post review" })).toBeVisible();
  const editorContainment = await page.locator(".output-editor").evaluateAll((editors) => editors.map((editor) => {
    const textarea = editor.querySelector("textarea");
    const actions = editor.querySelector(".output-editor-actions");
    return {
      editorOverflows: editor.scrollWidth > editor.clientWidth,
      textareaBoxSizing: textarea ? getComputedStyle(textarea).boxSizing : null,
      textareaOverflowWrap: textarea ? getComputedStyle(textarea).overflowWrap : null,
      actionRowWraps: actions ? getComputedStyle(actions).flexWrap : null,
      actionRowOverflows: actions ? actions.scrollWidth > actions.clientWidth : null,
    };
  }));
  expect(editorContainment).toEqual(expect.arrayContaining([
    expect.objectContaining({
      editorOverflows: false,
      textareaBoxSizing: "border-box",
      textareaOverflowWrap: "anywhere",
      actionRowWraps: "wrap",
      actionRowOverflows: false,
    }),
  ]));
  await page.getByRole("button", { name: "Run draft review" }).click();
  const reviewResult = page.locator(".final-review-result").first();
  await expect(reviewResult).toBeVisible();
  expect(await reviewResult.evaluate((element) => element.tagName)).toBe("SECTION");
  await expect(reviewResult.locator("details")).toHaveCount(1);
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board/ }).click();
  await expect(page.locator(".saved-run-status")).toContainText("Saved run status");
});

test("labels the short-post review with the exact short output", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "short" });
  await expect(page.getByRole("heading", { name: "Short post review" })).toBeVisible();
  await expect(page.getByText("The saved assessment stays connected to this exact short-post version.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Article review" })).toHaveCount(0);
});

test("renders the exact visual asset on the page and downloads it as PNG", async ({ page }) => {
  await createIdeaThroughWrite(page);
  await page.locator(".visual-companion > summary").first().click();
  const templatePicker = page.locator(".visual-template-picker");
  await expect(templatePicker.getByRole("radio")).toHaveCount(4);
  const templateTopEdges = await templatePicker.locator("label").evaluateAll((labels) => labels.map((label) => Math.round(label.getBoundingClientRect().top)));
  expect(new Set(templateTopEdges).size).toBe(1);
  await expect(templatePicker.getByRole("radio", { name: /Three-step flow/ })).not.toBeChecked();
  await page.getByRole("button", { name: "Prepare visual brief" }).click();
  await expect(page.getByText("What should this visual help the reader see?")).toBeVisible();
  await expect(page.getByText("Rendering cost:").locator("..")).toContainText("$0.00 local");
  await expect(page.getByRole("button", { name: "Approve visual brief" })).toBeVisible();
  await page.getByRole("button", { name: "Approve visual brief" }).click();
  await page.getByRole("button", { name: "Render approved visual" }).click();
  const visual = page.locator("img.visual-rendered-asset");
  await expect(visual).toBeVisible();
  await expect(visual).toHaveAttribute("src", /^data:image\/svg\+xml/);
  await expect(page.locator(".visual-flow-actions")).toContainText("Refresh this visual");
  await expect(page.locator(".visual-flow-actions")).toContainText("Download PNG");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PNG" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.png$/);
});

test("keeps a legacy unlinked visual readable in Write and Finalize", async ({ page }) => {
  const ideaId = await createIdeaThroughWrite(page);
  const legacyVisual = {
    id: "legacy_unlinked_visual",
    draftVersionId: "legacy-output-version",
    type: "flow",
    eyebrow: "A SIMPLE DIAGNOSTIC",
    title: "Preserved legacy visual",
    subtitle: "Saved before visual briefs",
    steps: [],
    altText: "Legacy visual description",
    caption: "Legacy visual caption",
    filePath: "legacy/asset.svg",
    createdAt: "2026-08-10T00:00:00.000Z",
  };
  await page.route(`**/api/ideas/${ideaId}`, async (route) => {
    const response = await route.fetch();
    const payload = await response.json() as { idea?: Record<string, unknown> };
    if (route.request().method() !== "GET" || !payload.idea) {
      await route.fulfill({ response });
      return;
    }
    await route.fulfill({
      response,
      json: {
        ...payload,
        idea: {
          ...payload.idea,
          visualCompanion: legacyVisual,
          visualBrief: undefined,
          visualBriefs: [],
          supportingVisualCompanions: [],
        },
      },
    });
  });

  await page.reload();
  const writeVisual = page.locator(".visual-companion").first();
  await expect(writeVisual.locator("img.visual-rendered-asset")).toBeVisible();
  await expect(writeVisual).toContainText("Saved before visual briefs were introduced");
  await expect(writeVisual.getByRole("button", { name: "Refresh this visual" })).toHaveCount(0);

  await page.goto(`/ideas/${ideaId}/publish`);
  const finalizeVisual = page.locator(".finalize-panel .visual-companion");
  await expect(finalizeVisual.locator("img.visual-rendered-asset")).toBeVisible();
  await expect(finalizeVisual).toContainText("Legacy visual caption");
});

test("keeps approved visual grammar immutable while exposing article support and derived-short visual lifecycles", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await page.locator(".visual-companion > summary").first().click();
  await page.getByRole("radio", { name: /Three-step flow/ }).check();
  await page.getByRole("button", { name: "Prepare visual brief" }).click();
  await page.getByRole("button", { name: "Approve visual brief" }).click();
  await expect(page.locator(".visual-template-picker").getByRole("radio", { name: /Iceberg contrast/ })).toBeDisabled();
  await page.getByRole("button", { name: "Render approved visual" }).click();
  await expect(page.locator(".visual-companion").first().locator(".visual-flow-actions")).toContainText("$0.00 local");
  await expect(page.getByRole("button", { name: "Prepare supporting visual brief" })).toBeVisible();
  await page.getByRole("button", { name: "Prepare supporting visual brief" }).click();
  await expect(page.getByText("Supporting visual · recommended")).toBeVisible();
  await expect(page.locator(".supporting-visual")).toContainText("Rendering cost:");
  await page.getByRole("button", { name: "Approve supporting brief" }).click();
  await page.getByRole("button", { name: "Render supporting visual" }).click();

  await page.locator(".derived-short-visual > summary").click();
  await expect(page.getByText(/Separate optional asset for exact derived short-post version/)).toBeVisible();
  await page.locator(".derived-short-visual").getByRole("radio", { name: /Three-step flow/ }).check();
  await page.getByRole("button", { name: "Prepare derived short visual brief" }).click();
  await expect(page.locator(".derived-short-visual")).toContainText("Rendering cost:");
  await page.getByRole("button", { name: "Approve derived short visual brief" }).click();
  await page.getByRole("button", { name: "Render approved derived short visual" }).click();
  await expect(page.locator(".derived-short-visual .visual-flow-actions")).toContainText("$0.00 local");
  await expect(page.locator("img.visual-rendered-asset")).toHaveCount(3);
});

test("lets an author replace a derived-short no-visual recommendation with its own selected shape", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await page.locator(".visual-companion").first().locator("summary").click();
  await page.locator(".visual-companion").first().getByRole("radio", { name: /Iceberg contrast/ }).check();
  const derived = page.getByLabel("Derived short post draft");
  await derived.fill("This short reflection offers one practical point for a reader to consider.");
  await page.getByRole("button", { name: "Save derived short version" }).click();
  await page.locator(".derived-short-visual > summary").click();
  const panel = page.locator(".derived-short-visual");
  await expect(panel.getByRole("radio")).toHaveCount(4);
  await expect(panel.getByRole("radio", { name: /Iceberg contrast/ })).not.toBeChecked();
  await page.getByRole("button", { name: "Prepare derived short visual brief" }).click();
  await expect(panel.getByText(/No visual recommended for this exact derived short post/)).toBeVisible();
  await expect(panel.getByRole("button", { name: "Request selected derived short visual" })).toHaveCount(0);
  await panel.getByRole("radio", { name: /Decision fork/ }).check();
  await page.getByRole("button", { name: "Request selected derived short visual" }).click();
  await expect(panel).toContainText("Rendering cost:");
  await expect(page.getByRole("button", { name: "Approve derived short visual brief" })).toBeVisible();
});

test("exposes delivery channel only in Finalize and preserves article-first sequencing", async ({ page }) => {
  await createIdeaThroughWrite(page, { shape: "long_with_derived_short" });
  await page.locator(".visual-companion > summary").first().click();
  await page.getByRole("button", { name: "Prepare visual brief" }).click();
  await page.getByRole("button", { name: "Approve visual brief" }).click();
  await page.getByRole("button", { name: "Render approved visual" }).click();
  await reviewAllDualOutputs(page);
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.locator(".finalize-output")).toHaveCount(2);
  const finalVisual = page.locator(".finalize-panel .visual-rendered-asset");
  await expect(finalVisual).toBeVisible();
  const finalVisualBounds = await finalVisual.boundingBox();
  expect(finalVisualBounds?.width).toBeLessThanOrEqual(640);
  await expect(page.getByRole("link", { name: "Return to Write" })).toHaveClass(/return-to-write/);
  await expect(page.locator(".finalize-output").nth(0)).toContainText("ARTICLE");
  await expect(page.locator(".finalize-output").nth(1)).toContainText("DERIVED SHORT POST");
  await expect(page.getByLabel("Delivery channel")).toHaveCount(2);
  await expect(page.getByLabel("Delivery channel").first().locator("option")).toHaveText(["LinkedIn", "Medium", "Substack"]);
  await page.getByLabel("Delivery channel").nth(0).selectOption("medium");
  await page.getByLabel("Publication URL").nth(0).fill("https://example.test/article");
  await page.getByLabel("Published date").nth(0).fill("2026-08-10T09:30");
  const voiceChecks = page.getByRole("button", { name: "Check final voice" });
  await voiceChecks.nth(0).click();
  await voiceChecks.nth(1).click();
  const publish = page.getByRole("button", { name: "Mark this version as published" });
  await expect(publish.nth(1)).toBeDisabled();
  await expect(page.getByText(/Publish the article before recording this derived short post/)).toBeVisible();
  await publish.nth(0).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  // Publishing reloads the Finalize cards, so reacquire the remaining exact
  // output rather than retaining a detached locator from the old render.
  await page.getByLabel("Delivery channel").selectOption("substack");
  await page.getByLabel("Publication URL").fill("https://example.test/derived-short");
  await page.getByLabel("Published date").fill("2026-08-10T10:15");
  await page.getByRole("button", { name: "Mark this version as published" }).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  const records = page.locator(".publication-record.published-record");
  await expect(records).toHaveCount(2);
  await expect(records.nth(0)).toContainText("Delivery channel");
  await expect(records.nth(0)).toContainText("Medium");
  await expect(records.nth(0)).toContainText("Publication URL");
  await expect(records.nth(0)).toContainText("https://example.test/article");
  await expect(records.nth(0)).toContainText("2026");
  await expect(records.nth(1)).toContainText("Substack");
  await expect(records.nth(1)).toContainText("https://example.test/derived-short");
  await expect(records.nth(1)).toContainText("Published date");
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
  await page.locator(".derived-short-visual > summary").click();
  const visualPanel = page.locator(".derived-short-visual");
  await visualPanel.getByRole("radio", { name: /Three-step flow/ }).check();
  await page.getByRole("button", { name: "Prepare derived short visual brief" }).click();
  await expect(visualPanel).toContainText("Rendering cost:");
  await expect(page.getByRole("button", { name: "Approve derived short visual brief" })).toBeVisible();
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
  const articleReviewActions = page.locator(".output-editor").first().locator(".output-editor-actions");
  await expect(articleReviewActions.getByRole("button", { name: "Run draft review" })).toHaveText("Run draft review");
  await expect(articleReviewActions.locator(".proofreader-disclosure")).toContainText("local deterministic proofread · $0.00 · no provider call");
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0]).toMatchObject({ action: "run_final_review", proofreadMode: "deterministic" });

  actions.length = 0;
  currentPreview = preview({ available: false, proofreader: { ...preview().proofreader, available: true } });
  await page.reload();
  await expect(articleReviewActions.getByRole("button", { name: "Run draft review" })).toHaveText("Run draft review");
  await expect(articleReviewActions.locator(".proofreader-disclosure")).toContainText("test-proofreader-model proofread · upper-bound reservation est. $0.0020");
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
  await expectBlocked(undefined, /Run this saved-output review in Write before publishing/);
  await expectBlocked({ ...completed, proofreadCompleted: false, proofreadStatus: "not_run" }, /Live proofread is not complete for this saved output/);
  await expectBlocked({ ...completed, proofreadCompleted: false, proofreadStatus: "failed" }, /Proofread failed for this saved output/);
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
