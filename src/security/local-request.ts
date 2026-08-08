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
    /^The (live editorial run|reviewer rerun) cap cannot exceed/,
    /^Projected (live-run|reviewer) cost/,
    /^Live-run budget would be exceeded/,
    /^Live-run budget could not be validated/,
    /^Pricing for /,
    /^(Anthropic|OpenAI|ZenMux) (is not configured|model is not configured|request failed|response reached|response contained|refused)/,
    /^Structured output remained invalid/,
    /^The model call failed/,
    /^Editorial review stopped because no reviewer produced validated output\.$/,
    /^Generated draft did not satisfy/,
    /^An escalation reason is required/,
    /^A ready (Book of Knowledge|kk-spoken-voice skill)/,
    /^Published workflow is locked/,
    /^This exact output is already published/,
    /^The selected draft version is no longer current/,
    /^Create a current LinkedIn companion from this article before recording/,
    /^Record the exact canonical article publication before recording its LinkedIn companion\./,
    /^Publication history is inconsistent:/,
    /^The selected draft format does not match/,
    /^The selected draft version or format is no longer current/,
    /^The submitted review text does not match/,
    /^The publication text does not match/,
    /^Use the dedicated LinkedIn companion action/,
    /^This approval action is no longer available/,
    /^This LinkedIn companion is stale or unlinked/,
    /^A current draft format is required/,
  ];
  return safePatterns.some((pattern) => pattern.test(message))
    ? message
    : "The local request could not be completed safely.";
}
