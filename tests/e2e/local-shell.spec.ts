import { expect, test } from "@playwright/test";

test("captures, develops, reviews, and records a local publication", async ({ page }) => {
  const response = await page.goto("/");
  await expect(page.getByRole("heading", { name: "Capture the thought. Develop it when it matters." })).toBeVisible();
  expect(page.url()).toMatch(/\/$/);
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain("default-src 'self'");
  await page.getByRole("link", { name: "Editorial Notebook" }).click();
  await expect(page.getByRole("heading", { name: "Editorial Notebook" })).toBeVisible();
  await page.getByLabel("Working notes").fill("# Test notebook\n\nA private working note.");
  await page.getByRole("button", { name: "Save snapshot" }).click();
  await expect(page.getByText(/Snapshot saved at/)).toBeVisible();
  await page.getByRole("link", { name: "Ideas" }).click();
  await page.getByLabel("What are you thinking about?").fill("A rough idea about the missing middle of enterprise AI and why implementation discipline matters.\n\n<style>body{display:none}</style><script>window.__editorialInjected=true</script><a href=\"javascript:alert(1)\">unsafe</a>");
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await expect(page.getByRole("heading", { name: "Develop the thinking, then the words." })).toBeVisible();
  await expect(page.getByText(/<style>body\{display:none\}/)).toBeVisible();
  expect(await page.evaluate(() => (window as typeof window & { __editorialInjected?: boolean }).__editorialInjected)).toBeUndefined();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Edit title" }).click();
  await page.getByLabel("Working title").fill("The missing middle is operational discipline");
  await page.getByRole("button", { name: "Save title" }).click();
  await expect(page.getByRole("heading", { name: "The missing middle is operational discipline" })).toBeVisible();
  await page.getByRole("button", { name: "Park this idea" }).click();
  await expect(page.getByText(/This idea is parked/)).toBeVisible();
  await page.getByRole("button", { name: "Return to Inbox" }).click();
  await expect(page.getByRole("button", { name: "Develop this idea →" })).toBeVisible();
  await page.getByRole("button", { name: "Move idea down in queue" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Primary audience").selectOption("executive");
  await page.getByLabel("Short minimum words").fill("321");
  await page.getByLabel("Short maximum words").fill("357");
  await page.getByLabel(/Audience note/).fill("Saved reader note for provenance.");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await expect(page.getByText("You do not need to answer more questions first.")).toBeVisible();
  await page.locator(".research-workspace > summary").click();
  await page.getByLabel("Research question").fill("What evidence would help qualify this operational claim?");
  await page.getByLabel("What the sources say").fill("A documented source can support the observation without making it universal.");
  await page.getByRole("button", { name: "Save research and evidence" }).click();
  await expect(page.getByText("Research and evidence saved locally.")).toBeVisible();
  await expect(page.getByText("Author-provided evidence")).toBeVisible();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await expect(page.getByRole("heading", { name: "Review the thinking before shaping the draft." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Idea workflow stages" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run live editorial review" })).toBeVisible();
  await page.getByText("Advanced run settings").click();
  await expect(page.getByText(/Free local test · \$0\.00 · no provider call/i)).toBeVisible();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await expect(page.getByText("Grounded deterministic test run")).toBeVisible();
  await expect(page.getByText("SUGGESTED CHANGES FOR THIS DRAFT")).toBeVisible();
  await expect(page.getByText("YOUR NEXT ACTION")).toBeVisible();
  await expect(page.getByText("Why the Board suggested this")).toBeVisible();
  await page.getByText(/Grounded with \d+ BOK passages/).click();
  await expect(page.getByText(/Reader contract used: executive · Saved reader note for provenance/)).toBeVisible();
  await expect(page.getByText("Selected BOK passages", { exact: true })).toBeVisible();
  await expect(page.getByText("Role and model assignments", { exact: true })).toBeVisible();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Develop/ }).click();
  await page.getByLabel("Primary audience").selectOption("general");
  await page.getByLabel("Short minimum words").fill("180");
  await page.getByLabel("Short maximum words").fill("300");
  await page.getByLabel(/Audience note/).fill("Mutable preference changed after the saved run.");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board/ }).click();
  await page.getByText(/Grounded with \d+ BOK passages/).click();
  await expect(page.getByText(/Reader contract used: executive · Saved reader note for provenance/)).toBeVisible();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  await expect(page.getByRole("heading", { name: "Write, review, and prepare each publication output." })).toBeVisible();
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Executives and organizational leaders");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Short 321–357 words");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Curious general readers");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Short form: 180–300 words");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Mutable preference changed after the saved run.");
  await expect(page.getByRole("button", { name: /Run draft review/ })).toContainText("Editorial assessment + local deterministic proofread · $0.00 · no provider call");
  await expect(page.getByText(/Grounded deterministic test output/)).toBeVisible();
  const draft = page.getByLabel("Working draft");
  await expect(draft).toBeVisible();
  await draft.fill("A practical observation about enterprise AI needs a concrete example because teh operating discipline changes whether a pilot becomes useful. What would change in your organization?");
  await expect(page.getByText(/Unsaved edits are not covered/)).toBeVisible();
  await page.getByRole("button", { name: "Save draft version" }).click();
  await page.getByRole("button", { name: "Run draft review" }).click();
  await page.getByText(/Ready for your final judgment|Revise before publishing/).click();
  await expect(page.getByText("Material correction")).toBeVisible();
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.getByText(/Resolve or explicitly dismiss every material Proofread and clarity finding/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark this version as published" })).toBeDisabled();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  await expect(page.getByText(/Ready for your final judgment|Revise before publishing/)).toBeVisible();
  await draft.fill("A revised practical observation about enterprise AI needs a concrete example because operating discipline changes whether a pilot becomes useful. What would change in your organization?");
  await expect(page.getByText(/Unsaved edits are not covered/)).toBeVisible();
  await page.getByRole("button", { name: "Save draft version" }).click();
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.getByText(/Run the combined editorial assessment and proofread for this exact saved output/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark this version as published" })).toBeDisabled();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect(page.getByText(/Prior review history · 1 saved memo/)).toBeVisible();
  await page.getByText(/Ready for your final judgment|Revise before publishing/).click();
  await page.getByText("Record your decision on the original recommendations").click();
  await page.getByRole("combobox").first().selectOption("revised");
  await expect(page.getByText("Your recommendation decision was saved locally.")).toBeVisible();
  await page.reload();
  await page.getByText(/Ready for your final judgment|Revise before publishing/).click();
  await page.getByText("Record your decision on the original recommendations").click();
  await expect(page.getByRole("combobox").first()).toHaveValue("revised");
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.getByRole("heading", { name: "Confirm the exact versions and record publication." })).toBeVisible();
  await expect(page.getByText(/Run the combined editorial assessment and proofread/)).not.toBeVisible();
  await page.getByRole("button", { name: "Check final voice" }).click();
  await expect(page.getByText(/AI-pattern risk/)).toBeVisible();
  await page.getByRole("button", { name: "Mark this version as published" }).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  await page.getByRole("link", { name: /Write Version/ }).click();
  await expect(page.getByLabel("Working draft")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save draft version" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Run draft review" })).toBeDisabled();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Develop/ }).click();
  await expect(page.getByRole("button", { name: "Edit title" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move idea up in queue" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Move idea down in queue" })).toBeDisabled();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board/ }).click();
  await expect(page.locator(".run-actions button")).toBeDisabled();
  await page.locator(".live-board-cta > summary").click();
  await page.getByText("Advanced run settings").click();
  await expect(page.getByRole("button", { name: "Run free deterministic editorial test" })).toBeDisabled();
  await page.goto("/content-status");
  await expect(page.getByRole("heading", { name: "Content status" })).toBeVisible();
  await expect(page.getByText("Canonical knowledge base")).toBeVisible();
  const sourceStatus = await page.request.get("/api/content/status?q=enterprise");
  expect(sourceStatus.ok()).toBeTruthy();
  expect((await sourceStatus.json()).bok).toHaveProperty("status");
  const health = await page.request.get("/api/health");
  expect((await health.json()).accessControl).toBe("loopback-only-no-login");
});

test("explains each proofread Finalize block from persisted exact-version status", async ({ page }) => {
  const marker = `e2e-proofread-finalize-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: Finalize must state the exact proofread block without pretending a saved version is eligible.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  await page.getByRole("button", { name: "Run draft review" }).click();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const currentResponse = await page.request.get(`/api/ideas/${ideaId}`);
  const current = (await currentResponse.json()) as { idea: Record<string, unknown> };
  const completedReview = current.idea.finalReview as Record<string, unknown>;
  let visibleIdea: Record<string, unknown> = current.idea;
  await page.route(`**/api/ideas/${ideaId}`, async (route) => {
    if (route.request().method() === "GET" && !new URL(route.request().url()).search)
      return route.fulfill({ json: { idea: visibleIdea } });
    return route.continue();
  });

  const expectBlocked = async (review: Record<string, unknown> | undefined, message: RegExp) => {
    visibleIdea = { ...current.idea, finalReview: review };
    await page.goto(`/ideas/${ideaId}/publish`);
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark this version as published" })).toBeDisabled();
  };
  await expectBlocked(undefined, /Run the combined editorial assessment and proofread/);
  await expectBlocked({ ...completedReview, proofreadCompleted: false, proofreadStatus: "not_run" }, /live-required proofread has not produced a validated result/);
  await expectBlocked({ ...completedReview, proofreadCompleted: false, proofreadStatus: "failed" }, /low-cost proofread failed for this exact saved output/);
  await expectBlocked({
    ...completedReview,
    proofreadCompleted: true,
    proofreadStatus: "completed",
    proofreadFindings: [{ id: "material-proof", category: "clarity", severity: "material", current: "weak wording", suggestion: "clear wording", rationale: "A reader needs a clear sentence." }],
  }, /Resolve or explicitly dismiss every material Proofread and clarity finding/);
});

test("uses proofreader availability, not Board availability, for the combined review action", async ({ page }) => {
  const marker = `e2e-proofreader-availability-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: proofreader routing must remain independent from Board-route availability.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const current = await (await page.request.get(`/api/ideas/${ideaId}`)).json() as { idea: Record<string, unknown> };
  let preview = {
    provider: "test-provider", model: "board-model", tier: "low", budgetCap: 0.05, maximumBudgetCap: 0.25,
    pricingAssumption: "synthetic", available: true, estimatedCost: 0.001, planned: [],
    reviewerReruns: { medium: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true }, high: { provider: "test-provider", model: "test-high", tier: "high", estimatedCost: 0.02, available: true } },
    linkedinRefresh: { provider: "test-provider", model: "test-low", tier: "low", estimatedCost: 0.001, available: true },
    linkedinEscalation: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
    proofreader: { provider: "test-provider", model: "proofreader-model", tier: "low", estimates: { linkedin: 0.002, canonical: 0.009, linkedin_companion: 0.002 }, available: false },
  };
  const actions: Array<Record<string, unknown>> = [];
  await page.route(`**/api/ideas/${ideaId}**`, async (route) => {
    const request = route.request();
    if (request.method() === "GET" && new URL(request.url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview } });
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
  await expect(page.getByRole("button", { name: "Run draft review" })).not.toContainText("proofreader-model");
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0]).toMatchObject({ action: "run_final_review", proofreadMode: "deterministic" });

  actions.length = 0;
  preview = { ...preview, available: false, proofreader: { ...preview.proofreader, available: true } };
  await page.reload();
  await expect(page.getByRole("button", { name: /Run draft review/ })).toContainText("proofreader-model proofread · est. $0.0020");
  await page.getByRole("button", { name: "Run draft review" }).click();
  await expect.poll(() => actions.length).toBe(2);
  expect(actions).toEqual(expect.arrayContaining([
    expect.objectContaining({ action: "run_final_review", proofreadMode: "live_required" }),
    expect.objectContaining({ action: "run_live_proofread" }),
  ]));
});

test("finalizes Medium and LinkedIn outputs independently from the current canonical article", async ({ page }) => {
  const marker = `e2e-long-form-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("Working title").fill("A deliberate author title");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: a detailed article about why enterprise AI pilots need accountable owners before they become dependable workflows.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await expect(page.getByRole("heading", { name: "A deliberate author title" })).toBeVisible();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Finalize/ }).click();
  await expect(page.getByText(/Create a current LinkedIn companion in Write before recording this article publication/)).not.toBeVisible();
  await expect(page.getByText(/Run the combined editorial assessment and proofread/)).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Mark this version as published" }).first()).toBeDisabled();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  await page.getByRole("link", { name: /Write Version/ }).click();
  await expect(page.getByText("Article first, then its LinkedIn companion.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Long form: 800–1100 words.");
  await expect(page.getByRole("region", { name: "Reader contract" })).toContainText("Short form: 180–300 words");
  await expect(page.getByText(/LINKEDIN COMPANION · VERSION \d+/)).toBeVisible();
  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const disclosurePreview = {
    provider: "test-provider", model: "board-model", tier: "low", budgetCap: 0.05, maximumBudgetCap: 0.25,
    pricingAssumption: "synthetic", available: false, estimatedCost: 0.001, planned: [],
    reviewerReruns: { medium: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true }, high: { provider: "test-provider", model: "test-high", tier: "high", estimatedCost: 0.02, available: true } },
    linkedinRefresh: { provider: "test-provider", model: "test-low", tier: "low", estimatedCost: 0.001, available: true },
    linkedinEscalation: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
    proofreader: { provider: "test-provider", model: "exact-proofreader", tier: "low", estimates: { linkedin: 0, canonical: 0.009, linkedin_companion: 0.002 }, available: true },
  };
  const previewRoute = async (route: import("@playwright/test").Route) => {
    if (route.request().method() === "GET" && new URL(route.request().url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview: disclosurePreview } });
    return route.continue();
  };
  await page.route(`**/api/ideas/${ideaId}**`, previewRoute);
  await page.reload();
  await expect(page.getByRole("button", { name: "Run draft review" })).toContainText("exact-proofreader proofread · est. $0.0090");
  await expect(page.getByRole("button", { name: "Run LinkedIn review" })).toContainText("exact-proofreader proofread · est. $0.0020");
  await page.unroute(`**/api/ideas/${ideaId}**`, previewRoute);
  await page.reload();
  await page.getByRole("button", { name: "Run draft review" }).click();
  await page.getByRole("button", { name: "Run LinkedIn review" }).click();
  await page.reload();
  await expect(page.getByText("LINKEDIN COMPANION · VERSION", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "Continue to Finalize →" }).click();
  await expect(page.locator(".finalize-output")).toHaveCount(2);
  await expect(page.locator(".finalize-output").nth(0).locator(".eyebrow").first()).toContainText("MEDIUM ARTICLE");
  await expect(page.locator(".finalize-output").nth(1).locator(".eyebrow").first()).toContainText("LINKEDIN COMPANION");
  await expect(page.getByLabel("Working draft")).toHaveCount(0);
  const voiceButtons = page.getByRole("button", { name: "Check final voice" });
  await voiceButtons.nth(0).click();
  await voiceButtons.nth(1).click();
  const publishButtons = page.getByRole("button", { name: "Mark this version as published" });
  await expect(publishButtons.nth(1)).toBeDisabled();
  await expect(page.getByText(/Record the exact Medium article publication first/)).toBeVisible();
  await publishButtons.nth(0).click();
  await expect(page.getByText("Published record saved locally.")).toBeVisible();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Write/ }).click();
  await expect(page.getByLabel("Working draft")).toBeDisabled();
  const companionEditor = page.getByLabel("LinkedIn companion draft");
  await expect(companionEditor).toBeEnabled();
  await companionEditor.fill("A promising AI pilot still needs an owner, sensible controls, and a measurable outcome before it becomes dependable work. What would you check before scaling it?");
  await page.getByRole("button", { name: "Save LinkedIn version" }).click();
  await page.getByRole("button", { name: "Run LinkedIn review" }).click();
  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Finalize/ }).click();
  await expect(page.locator(".finalize-output")).toHaveCount(2);
  await page.getByRole("button", { name: "Check final voice" }).click();
  await page.getByRole("button", { name: "Mark this version as published" }).click();
  await expect(page.getByText(/2 of 2 published/)).toBeVisible();
});

test("refreshes a clean LinkedIn editor while preserving unsaved author wording", async ({ page }) => {
  const marker = `e2e-companion-recovery-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: a canonical article and LinkedIn companion need exact-version recovery behavior.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();

  const draft = page.getByLabel("Working draft");
  await draft.fill("A refreshed canonical article keeps the LinkedIn post tied to the exact saved source. A clear owner, appropriate controls, and an observable outcome determine whether the work should scale.");
  await page.getByRole("button", { name: "Save draft version" }).click();
  await expect(page.getByText(/Refresh only the LinkedIn post from this saved article/)).toBeVisible();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const currentResponse = await page.request.get(`/api/ideas/${ideaId}`);
  const current = (await currentResponse.json()) as { idea: Record<string, unknown> };
  const canonical = current.idea.canonicalDraft as { version: number };
  const existingCompanion = current.idea.linkedinCompanion as Record<string, unknown>;
  let virtualIdea: Record<string, unknown> = {
    ...current.idea,
    linkedinCompanion: {
      ...existingCompanion,
      body: "Recovered companion text appears immediately when the editor has no unsaved edits.",
      stale: false,
      sourceCanonicalVersion: canonical.version,
    },
  };
  let releaseSaveResponse: (() => void) | undefined;
  const saveResponseGate = new Promise<void>((resolve) => {
    releaseSaveResponse = resolve;
  });

  await page.route(`**/api/ideas/${ideaId}`, async (route) => {
    const request = route.request();
    if (request.method() === "GET") {
      if (new URL(request.url()).searchParams.get("execution")) return route.continue();
      return route.fulfill({ json: { idea: virtualIdea } });
    }
    const body = JSON.parse(request.postData() ?? "{}") as { action?: string };
    if (body.action === "run_grounded_board") return route.fulfill({ json: { idea: virtualIdea } });
    if (body.action === "save_linkedin_companion") {
      await saveResponseGate;
      virtualIdea = {
        ...virtualIdea,
        linkedinCompanion: {
          ...(virtualIdea.linkedinCompanion as Record<string, unknown>),
          body: "Unexpected server wording must not replace unsaved author wording.",
        },
      };
      return route.fulfill({ json: { idea: virtualIdea } });
    }
    return route.continue();
  });

  await page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board/ }).click();
  await page.locator(".live-board-cta > summary").click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  const companionEditor = page.getByLabel("LinkedIn companion draft");
  await expect(companionEditor).toHaveValue("Recovered companion text appears immediately when the editor has no unsaved edits.");

  // Start an action while the editor is clean, then type while its response is
  // deliberately delayed. The response must consult the current editor state,
  // not the clean state captured when the request began.
  await page.getByRole("button", { name: "Save LinkedIn version" }).click();
  await companionEditor.fill("Unsaved author wording must remain in the controlled editor.");
  releaseSaveResponse?.();
  await expect(companionEditor).toHaveValue("Unsaved author wording must remain in the controlled editor.");
});

test("refreshes a stale LinkedIn companion through the scoped recovery action", async ({ page }) => {
  const marker = `e2e-scoped-linkedin-refresh-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: refresh only the short-form companion after a saved article revision.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();

  const draft = page.getByLabel("Working draft");
  await draft.fill("A saved article revision should make only its derived LinkedIn companion stale. Refreshing the companion must preserve the Board review and use the exact current article.");
  await page.getByRole("button", { name: "Save draft version" }).click();
  await expect(page.getByText(/Refresh only the LinkedIn post from this saved article/)).toBeVisible();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const currentResponse = await page.request.get(`/api/ideas/${ideaId}`);
  const current = (await currentResponse.json()) as { idea: Record<string, unknown> };
  const canonical = current.idea.canonicalDraft as { version: number };
  const previousCompanion = current.idea.linkedinCompanion as Record<string, unknown>;
  const recoveredIdea: Record<string, unknown> = {
    ...current.idea,
    linkedinCompanion: {
      ...previousCompanion,
      body: "This exact scoped refresh returned a new LinkedIn companion from the current article.",
      stale: false,
      sourceCanonicalVersion: canonical.version,
    },
  };
  const recoveryPreview = {
    provider: "test-provider",
    model: "test-model",
    tier: "low",
    budgetCap: 0.05,
    maximumBudgetCap: 0.25,
    pricingAssumption: "synthetic test pricing",
    available: true,
    estimatedCost: 0.001,
    planned: [],
    reviewerReruns: {
      medium: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
      high: { provider: "test-provider", model: "test-high", tier: "high", estimatedCost: 0.02, available: true },
    },
    linkedinRefresh: { provider: "test-provider", model: "test-low", tier: "low", estimatedCost: 0.001, available: true },
    linkedinEscalation: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
    proofreader: { provider: "test-provider", model: "test-proofreader", tier: "low", estimates: { linkedin: 0.002, canonical: 0.009, linkedin_companion: 0.002 }, available: false },
  };
  let releaseRecovery: (() => void) | undefined;
  let recoveryStarted: (() => void) | undefined;
  const recoveryGate = new Promise<void>((resolve) => { releaseRecovery = resolve; });
  const recoveryObserved = new Promise<void>((resolve) => { recoveryStarted = resolve; });

  await page.route(`**/api/ideas/${ideaId}**`, async (route) => {
    const request = route.request();
    if (request.method() === "GET" && new URL(request.url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview: recoveryPreview } });
    const body = request.method() === "POST" ? JSON.parse(request.postData() ?? "{}") as { action?: string } : undefined;
    if (body?.action === "refresh_live_linkedin_companion") {
      recoveryStarted?.();
      await recoveryGate;
      return route.fulfill({ json: { idea: recoveredIdea } });
    }
    return route.continue();
  });

  await page.reload();
  await expect(page.getByRole("button", { name: /Run draft review/ })).toContainText("local deterministic proofread · $0.00 · no provider call");
  const refresh = page.getByRole("button", { name: /Refresh LinkedIn from Article v/ });
  await expect(refresh).toBeEnabled();
  await refresh.click();
  await recoveryObserved;
  await expect(page.getByLabel("LinkedIn companion draft")).toHaveCount(0);
  releaseRecovery?.();
  await expect(page.getByLabel("LinkedIn companion draft")).toHaveValue("This exact scoped refresh returned a new LinkedIn companion from the current article.");
  await expect(page.locator(".editorial-progress > summary").first()).toHaveText("LinkedIn recovery complete");
  await expect(page.locator(".editorial-progress > summary").first()).not.toContainText("Live Editorial Board complete");
});

test("labels a rejected LinkedIn recovery without inventing failure provenance", async ({ page }) => {
  const marker = `e2e-rejected-linkedin-recovery-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: a rejected scoped recovery must not look like a provider failure.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();
  await page.getByRole("link", { name: "Continue to Write →" }).click();
  await page.getByLabel("Working draft").fill("A saved article revision makes its LinkedIn companion stale. A rejected recovery must not claim a provider attempt or failure provenance.");
  await page.getByRole("button", { name: "Save draft version" }).click();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const recoveryPreview = {
    provider: "test-provider", model: "test-model", tier: "low", budgetCap: 0.05, maximumBudgetCap: 0.25,
    pricingAssumption: "synthetic test pricing", available: false, estimatedCost: 0.001, planned: [],
    reviewerReruns: {
      medium: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
      high: { provider: "test-provider", model: "test-high", tier: "high", estimatedCost: 0.02, available: true },
    },
    linkedinRefresh: { provider: "test-provider", model: "test-low", tier: "low", estimatedCost: 0.001, available: true },
    linkedinEscalation: { provider: "test-provider", model: "test-medium", tier: "medium", estimatedCost: 0.01, available: true },
    proofreader: { provider: "test-provider", model: "available-proofreader", tier: "low", estimates: { linkedin: 0.002, canonical: 0.009, linkedin_companion: 0.002 }, available: true },
  };
  await page.route(`**/api/ideas/${ideaId}**`, async (route) => {
    const request = route.request();
    if (request.method() === "GET" && new URL(request.url()).searchParams.get("execution") === "live_preview")
      return route.fulfill({ json: { preview: recoveryPreview } });
    const body = request.method() === "POST" ? JSON.parse(request.postData() ?? "{}") as { action?: string } : undefined;
    if (body?.action === "refresh_live_linkedin_companion")
      return route.fulfill({ status: 400, json: { error: "Synthetic route policy rejection." } });
    return route.continue();
  });
  await page.reload();
  await expect(page.getByRole("button", { name: /Run draft review/ })).toContainText("available-proofreader");
  await page.getByRole("button", { name: /Refresh LinkedIn from Article v/ }).click();
  const progress = page.locator(".editorial-progress").filter({ hasText: "LinkedIn recovery rejected before provider dispatch" });
  await expect(progress).toContainText("No provider failure provenance was created.");
  await expect(progress.locator("li").filter({ hasText: "Validate recovery route and budget" })).toContainText("failed");
  await expect(progress.locator("li").filter({ hasText: "Save linked companion and provenance" })).toContainText("not_run");
  await expect(progress).not.toContainText("Save failure provenance");
});

test("renders article and LinkedIn drafting as not run after a saved Synthesizer failure", async ({ page }) => {
  const marker = `e2e-synthesis-status-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: a failed synthesis must not look like drafting succeeded.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const currentResponse = await page.request.get(`/api/ideas/${ideaId}`);
  const current = (await currentResponse.json()) as { idea: Record<string, unknown> };
  const brief = current.idea.editorialBrief as Record<string, unknown>;
  const failedIdea: Record<string, unknown> = {
    ...current.idea,
    editorialBrief: {
      ...brief,
      runStatus: "failed",
      generatedDraftVersionId: undefined,
      generatedLinkedinCompanionDraftVersionId: undefined,
      runFailures: [{ role: "synthesizer", summary: "Synthetic saved synthesis failure." }],
    },
  };

  await page.route(`**/api/ideas/${ideaId}`, async (route) => {
    if (route.request().method() === "GET" && !new URL(route.request().url()).search)
      return route.fulfill({ json: { idea: failedIdea } });
    return route.continue();
  });
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board.*Review incomplete/ })).toBeVisible();
  const savedProgress = page.locator(".editorial-progress").filter({ hasText: "Saved run status" });
  await expect(savedProgress).toContainText("Saved run status · incomplete");
  await expect(savedProgress.locator("li").filter({ hasText: "Create the voice-aligned working draft" })).toContainText("not_run");
  await expect(savedProgress.locator("li").filter({ hasText: "Create standalone LinkedIn post" })).toContainText("not_run");
});

test("renders an unattempted Synthesizer and downstream outputs as not run after every reviewer fails", async ({ page }) => {
  const marker = `e2e-all-reviewer-failures-${Date.now()}`;
  await page.goto("/");
  await page.getByLabel("What are you thinking about?").fill(`${marker}: every failed reviewer must stop synthesis rather than make it appear complete.`);
  await page.getByRole("button", { name: "Save to Inbox" }).click();
  await page.getByRole("button", { name: "Develop this idea →" }).click();
  await page.getByLabel("Publication plan").selectOption("medium_linkedin");
  await page.getByRole("button", { name: "Save development notes" }).click();
  await page.getByRole("button", { name: "Continue to editorial review →" }).click();
  await page.getByText("Advanced run settings").click();
  await page.getByRole("button", { name: "Run free deterministic editorial test" }).click();

  const ideaId = new URL(page.url()).pathname.match(/^\/ideas\/([^/]+)/)?.[1];
  expect(ideaId).toBeTruthy();
  const currentResponse = await page.request.get(`/api/ideas/${ideaId}`);
  const current = (await currentResponse.json()) as { idea: Record<string, unknown> };
  const brief = current.idea.editorialBrief as Record<string, unknown>;
  const failedIdea: Record<string, unknown> = {
    ...current.idea,
    editorialBrief: {
      ...brief,
      runStatus: "failed",
      generatedDraftVersionId: undefined,
      generatedLinkedinCompanionDraftVersionId: undefined,
      attemptedRoles: ["strategist", "skeptic", "editor"],
      runFailures: [
        { role: "strategist", summary: "Synthetic Strategist failure." },
        { role: "skeptic", summary: "Synthetic Skeptic failure." },
        { role: "editor", summary: "Synthetic Editor failure." },
      ],
    },
  };
  await page.route(`**/api/ideas/${ideaId}`, async (route) => {
    if (route.request().method() === "GET" && !new URL(route.request().url()).search)
      return route.fulfill({ json: { idea: failedIdea } });
    return route.continue();
  });
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Idea workflow stages" }).getByRole("link", { name: /Editorial Board.*Review incomplete/ })).toBeVisible();
  const savedProgress = page.locator(".editorial-progress").filter({ hasText: "Saved run status" });
  await expect(savedProgress.locator("li").filter({ hasText: "Strategist review" })).toContainText("failed");
  await expect(savedProgress.locator("li").filter({ hasText: "Synthesize the editorial brief" })).toContainText("not_run");
  await expect(savedProgress.locator("li").filter({ hasText: "Create the voice-aligned working draft" })).toContainText("not_run");
  await expect(savedProgress.locator("li").filter({ hasText: "Create standalone LinkedIn post" })).toContainText("not_run");
});
