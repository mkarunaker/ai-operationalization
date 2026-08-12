import { describe, expect, it } from "vitest";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

describe("local mutation request boundary", () => {
  it("accepts same-origin loopback JSON", () => {
    const request = new Request("http://127.0.0.1:3100/api/ideas/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://127.0.0.1:3100",
        "sec-fetch-site": "same-origin",
      },
      body: "{}",
    });
    expect(() => requireLocalJsonMutation(request)).not.toThrow();

    const loopbackAlias = new Request("http://127.0.0.1:3101/api/ideas/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3101",
        "sec-fetch-site": "same-origin",
      },
      body: "{}",
    });
    expect(() => requireLocalJsonMutation(loopbackAlias)).not.toThrow();
  });

  it("rejects cross-origin, non-JSON, and non-loopback mutations", () => {
    expect(() => requireLocalJsonMutation(new Request("http://127.0.0.1:3100/api/test", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://example.com" },
      body: "{}",
    }))).toThrow("Cross-origin");
    expect(() => requireLocalJsonMutation(new Request("http://127.0.0.1:3100/api/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    }))).toThrow("application/json");
    expect(() => requireLocalJsonMutation(new Request("http://example.test/api/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    }))).toThrow("local application origin");
  });

  it("does not expose arbitrary internal errors", () => {
    expect(safeRouteError(new Error("SQLITE failure at /private/path"))).toBe(
      "The local request could not be completed safely.",
    );
  });

  it("keeps detailed, application-authored derived-short recovery guidance", () => {
    const message = "The derived-short drafter failed before a validated response was available. The article and completed Board review were saved; raw provider details are intentionally withheld.";
    expect(safeRouteError(new Error(message))).toBe(message);
  });

  it("keeps actionable proofreader and Finalize guidance while sanitizing arbitrary errors", () => {
    for (const message of [
      "The live proofread did not produce a validated result. No proofread finding is eligible until you retry this exact saved output.",
      "Live proofreader execution must use the configured low-tier proofreader route.",
      "Run the proofread and clarity check for this exact saved output before publishing.",
      "Resolve or explicitly dismiss every material proofread finding before publishing.",
      "A valid proofread budget cap is required.",
      "A saved Editorial Board reader contract is required for a live proofread.",
      "The saved Editorial Board reader contract is invalid. Run the Editorial Board again before a live proofread.",
      "Working-draft provider, model, tier, pricing, and output allowance are resolved only by the server route.",
      "Only one working-draft retry is permitted for a saved Editorial Board run. Start a new Board run after adjusting the configured route or output allowance.",
      "New supporting visual authoring is deferred while this workflow focuses on one versioned lead visual. Earlier supporting assets remain read-only history.",
      "OpenAI response reached its output limit. No affected stage completed. Retry only that stage if this may have been temporary. If it happens again, an administrator must adjust that role's configured output allowance or route before a new Board run.",
      "A configured Initial Drafter model is required.",
      "The working-draft retry cap cannot exceed $0.25.",
      "A failed working-draft stage with a saved Editorial Board synthesis is required before retrying this stage.",
      "The saved Editorial Board synthesis is unavailable. Run the Editorial Board again before retrying the draft stage.",
      "The saved voice reference is unavailable. Index the configured source, then run the Editorial Board again before retrying the draft stage.",
      "An approved visual brief fixes its explanatory template. Create a new brief to change it.",
      "Each visual claim and label must be traceable to this exact saved output.",
      "This exact saved output already has two supporting visual briefs.",
      "Prepare a lead visual brief for this exact saved output before requesting a supporting visual.",
      "Render the lead visual for this exact saved output before rendering a supporting visual.",
      "The selected output does not match this idea's reader-output shape.",
      "Create a current derived short post from an approved article before editing it.",
      "Published workflow is locked. Published history remains read-only; create a new idea to develop fresh content.",
    ]) expect(safeRouteError(new Error(message))).toBe(message);
  });
});
