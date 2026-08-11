const loopbackHosts = new Set(["127.0.0.1", "localhost", "[::1]", "::1"]);

export class PublicRequestError extends Error {}

export function requireLocalJsonMutation(request: Request) {
  const requestUrl = new URL(request.url);
  if (!loopbackHosts.has(requestUrl.hostname))
    throw new PublicRequestError("State-changing requests are accepted only on the local application origin.");

  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json")
    throw new PublicRequestError("State-changing requests must use application/json.");

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none")
    throw new PublicRequestError("Cross-origin state-changing requests are not allowed.");

  const origin = request.headers.get("origin");
  if (origin) {
    let originUrl: URL;
    try {
      originUrl = new URL(origin);
    } catch {
      throw new PublicRequestError("Cross-origin state-changing requests are not allowed.");
    }

    // Browsers may use localhost and 127.0.0.1 interchangeably for this local-only
    // application. Sec-Fetch-Site above remains the authoritative browser signal;
    // the Origin check additionally ensures the request came from a loopback page.
    if (!loopbackHosts.has(originUrl.hostname))
      throw new PublicRequestError("Cross-origin state-changing requests are not allowed.");
  }
}

export function safeRouteError(error: unknown) {
  if (error instanceof PublicRequestError) return error.message;
  const message = error instanceof Error ? error.message : "";
  const safePatterns = [
    /^Idea not found/,
    /^The local database (has not been initialized|is not initialized)/,
    /^Only Strategist/,
    /^A reviewer rerun/,
    /^A high-tier reviewer rerun/,
    /^A positive per-run budget cap/,
    /^A positive proofread budget cap/,
    /^A valid proofread budget cap/,
    /^The derived-short (retry|recovery) cap cannot exceed/,
    /^The (live editorial run|reviewer rerun) cap cannot exceed/,
    /^Projected (live-run|reviewer) cost/,
    /^Live-run budget would be exceeded/,
    /^Live-run budget could not be validated/,
    /^Pricing for /,
    /^(Anthropic|OpenAI|ZenMux) (is not configured|model is not configured|request failed|response reached|response contained|refused)/,
    /^The configured model declined the editorial request\./,
    /^The configured model declined the structured derived-short drafting request\./,
    /^The live proofread did not produce a validated result\./,
    /^Live proofreader execution must use the configured low-tier proofreader route\./,
    /^Proofreader provider, model, tier, and pricing are resolved only by the server route\./,
    /^Run the (combined draft review|proofread and clarity check)/,
    /^Resolve or explicitly dismiss every material proofread finding/,
    /^The model response did not match the required structured format/,
    /^The generated (publication text|text) (did not satisfy|contained Markdown)/,
    /^The derived-short drafter (reached its output limit|returned an invalid structured response|completed, but its result could not be saved safely|failed before a validated response was available)/,
    /^Only (the explicit|an explicit) derived-short escalation /,
    /^The explicit derived-short escalation action uses /,
    /^Explain why this derived-short recovery needs /,
    /^The model call failed/,
    /^Editorial review stopped because no reviewer produced validated output\.$/,
    /^No reviewer returned a validated editorial evaluation\./,
    /^An escalation reason is required/,
    /^A ready (Book of Knowledge|kk-spoken-voice skill)/,
    /^Published workflow is locked/,
    /^Published ideas are retained/,
    /^An idea with a publication record cannot be deleted/,
    /^This exact output is already published/,
    /^This exact output already has a publication record/,
    /^Run and acknowledge the final human-voice check/,
    /^Output shape must match the (complete )?selected reader-output preferences/,
    /^The selected output does not match this idea's reader-output shape/,
    /^The selected draft version is no longer current/,
    /^Create a current derived short post from this article before recording/,
    /^Create a current derived short post from an approved article before editing it/,
    /^Record the exact article publication before recording its derived short post\./,
    /^Publication history is inconsistent:/,
    /^The selected draft format does not match/,
    /^The selected draft version or format is no longer current/,
    /^The submitted review text does not match/,
    /^The publication text does not match/,
    /^Use the dedicated derived-short action/,
    /^This approval action is no longer available/,
    /^This exact-output review is no longer available/,
    /^This derived short post is stale or unlinked/,
    /^A derived short post is available only when the selected output shape includes one/,
    /^A saved article is required before creating a derived short post/,
    /^A current derived short post already exists/,
    /^A current draft format is required/,
    /^A saved Editorial Board reader contract is required for a live proofread/,
    /^The saved Editorial Board reader contract is invalid\. Run the Editorial Board again before a live proofread/,
    /^An approved visual brief fixes its explanatory template\./,
    /^Approve a visual brief for this exact saved output before rendering\./,
    /^Visual brief not found for this idea\./,
    /^This saved output has no recommended visual to approve\./,
    /^Request a visual recommendation before editing a visual brief\./,
    /^This exact saved output already has (a lead visual brief|two supporting visual briefs)\./,
    /^Prepare a lead visual brief for this exact saved output before requesting a supporting visual\./,
    /^Render the lead visual for this exact saved output before rendering a supporting visual\./,
    /^Each visual claim and label must be traceable to this exact saved output\./,
    /^Create a new visual brief before changing an approved or rendered brief\./,
    /^Save the current selected output before requesting a visual brief\./,
  ];
  return safePatterns.some((pattern) => pattern.test(message))
    ? message
    : "The local request could not be completed safely.";
}
