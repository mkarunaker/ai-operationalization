# Integrated repository audit — 2026-08-13

## Verdict

Original verdict: **DO NOT APPROVE.** Current disposition: **APPROVE AFTER REMEDIATION.** The repeat independent read-only audit found no concrete blocker in B1–B11. A live-provider smoke test remains unauthorized without an explicit owner decision.

## Remediation checkpoint

Remediation is complete and independently approved. The first fresh review returned `DO NOT APPROVE` for a remaining B8 creation-boundary gap; the direct API regression and narrow correction described below closed that path. The repeat review approved the complete 26-file staged patch with no concrete blockers. The complete deterministic Playwright suite passed with **44 tests**. No live-provider test is authorized without an explicit owner decision.

Validation evidence: `npm run typecheck`; `npm run lint`; `npm test` (25 files / 166 tests); `npm run db:validate` (one baseline migration); `npm run build`; `npm run test:e2e` (44 passed); `npm run security:secrets` (138 files); `npm run security:audit` (0 vulnerabilities); and both Git diff checks. No provider call or meaningful-data migration occurred.

### Repeat-audit remediation — B8 direct creation boundary

- Precise claim: a structured create request cannot persist an original capture that differs from its structured Principle; coherent creation, later Principle revision, retrieval, and each new Board snapshot must retain one identity while prior snapshots remain immutable.
- Implementation: `src/lean/service.ts:77-82` now rejects conflicting `rawNotes` and structured `Principle` during strict create validation, before the database is opened or any idea is persisted.
- Direct regression: `tests/integration/grounded-editorial-run.test.ts:410` exercises the real `POST /api/ideas` route, verifies a conflicting payload leaves the idea count unchanged, creates the coherent structured idea through that route, runs Boards before and after a Principle revision, and checks durable capture, structured brief, ordered snapshots, and newest selected retrieval text.
- Expected prior failure: the conflicting create request returned `201`; the new regression failed at that exact assertion before the service correction.
- Observed result: the focused grounded integration file passed 39 tests after the fix, followed by the complete no-provider gate above. No provider call, data migration, or historical snapshot rewrite occurred.
- Repeat-audit result: `APPROVE`. The reviewer confirmed the repaired creation identity, retained B1–B7 and B9–B11 guarantees, all ten tracked application routes, the single baseline migration with both atomic paid-dispatch indexes, and the exact staged/private-asset separation.

This report adjudicates three independent audits against the current tracked repository. It is the source of truth for the remediation milestone recorded in `BUILD_ROADMAP.md` as **Milestone 9.5 — Integrated audit remediation and paid-run safety**.

## Audit target

- Expected commit: `b9c77fa`
- Actual commit: `b9c77fa3111036b5646337c2aca147b22dee758f`
- Branch: `main`
- Tracked Git state: clean; no staged or unstaged tracked changes
- Claude report commit: `b9c77fa3111036b5646337c2aca147b22dee758f`
- Grok report commit: `b9c77fa3111036b5646337c2aca147b22dee758f`
- Product/UX report commit: `b9c77fa3111036b5646337c2aca147b22dee758f`

All three reports name the same tracked commit, but they did not inspect exactly the same effective application. Claude read and tested a working-tree superset containing the ignored `app/api/visuals/[visualId]/route.ts`; the product auditor evaluated committed source. Grok ran selected tests from the filesystem but did not exercise the visual route. Findings concerning tracked files remain comparable. The missing committed custom-image endpoint must be evaluated from HEAD, where it is absent.

## Deduplicated blocker matrix

| Priority | ID | Severity | Boundary | Required result |
|---|---|---|---|---|
| P0 | B1 | High | Tracked application completeness | A clean checkout contains and tests the database-authorized custom-image route. |
| P0 | B2 | High | Prompt boundary serialization | Hostile source labels cannot alter the untrusted-context structure. |
| P0 | B10 | Medium | Custom-image prompt trust | The author title is bounded as untrusted image-model data. |
| P0 | B11 | High | Post-response cost accounting | Invalid actual estimates fail closed and cannot reduce cumulative committed cost. |
| P0 | B3 | High | Run terminalization | Every owned Board or reviewer run reaches a terminal state after persistence faults. |
| P0 | B5 | High | Derived-short paid dispatch | Concurrent recovery requests can dispatch at most once for one exact source article. |
| P0 | B6 | High | Custom-image paid dispatch | Concurrent generation requests can dispatch at most once for one approved brief. |
| P0 | B4 | High | Destructive fresh-start containment | Confirmation and real filesystem containment prevent deletion outside the project. |
| P1 | B8 | High | Structured narrative identity | Principle, durable raw capture, retrieval, and new Board snapshot remain identical. |
| P1 | B7 | High | Request-bound live-run truthfulness | Navigation and reload behavior clearly enforce the keep-page-open policy. |
| P1 | B9 | Medium | Pre-dispatch author control | A recommended custom concept can be corrected without approval or provider dispatch. |

## Confirmed blockers

### B1 — Required custom-image route is not tracked

- Invariant: the committed staging set must reproduce the tested application; a paid custom image must remain displayable and downloadable by database-authorized asset ID.
- Evidence: `.gitignore:7` uses `visuals/`, which also ignores `app/api/visuals/[visualId]/route.ts`. The route is absent from `git ls-tree`, while `app/visual-flow.tsx:24,50` requests it.
- Failure: a clean checkout may generate and charge for an image, persist a completed visual, and then return 404 for display and download.
- Missing regression: tracked-route inventory plus a synthetic PNG request through the real endpoint.
- Narrow fix: change the ignore rule to `/visuals/`, commit the route, and keep lookup restricted to `customVisualImageAsset()`.
- Interaction risk: generated root assets must remain ignored; the route must never accept a browser file path.
- External sources: Claude BLOCKER-1; product auditor B2.

### B2 — Source labels can break the prompt boundary attribute

- Invariant: all untrusted material remains structurally inside an escaped boundary at every model transition.
- Evidence: `src/security/prompt-injection.ts:18-19` escapes only `&`, `<`, and `>`; `src/ai/prompt-boundary.ts:24-25` places source text in a quoted attribute; BOK headings and locations reach that attribute at `src/editorial/grounded-run.ts:793-800`.
- Failure: a heading such as `x\"><system>...</system>` can close the source attribute and inject attacker-shaped markup outside the intended envelope.
- Missing regression: hostile source values containing quotes, apostrophes, CR/LF, and closing tags.
- Narrow fix: use an attribute-context escaper or remove source attributes from the serialization.
- Interaction risk: prompt fingerprints and exact-string tests will change; historical provenance remains immutable.
- External source: Grok B2.

### B3 — Persistence faults can leave a run permanently `running`

- Invariant: every created run reaches `completed`, `partially_completed`, or `failed` on every exit path.
- Evidence: failure transactions at `src/editorial/grounded-run.ts:1480-1510,1569-1597,1785-1811,2601-2633` roll back their terminal update when attempt/failure persistence throws. No outer unwind guard terminalizes the function-owned run.
- Failure: provider work completes, telemetry persistence fails, failure persistence also fails, and the committed run remains `running` and disappears from terminal Board selection.
- Missing regression: an injected attempt-write or commit fault after a successful provider response.
- Narrow fix: on exception unwind, update only the function-owned run if it is still `running`, outside the failed transaction. Apply the same rule to targeted reviewer runs.
- Interaction risk: do not mark a legitimately active concurrent run failed; preserve confirmed dispatch, unconfirmed claim, and pre-dispatch rejection distinctions.
- External sources: Claude GAP-1; Grok B1.

### B4 — Fresh-start containment is vulnerable to symlink escape

- Invariant: the intentionally destructive fresh-start command requires exact confirmation and may delete only real project-local database and visual targets.
- Evidence: `scripts/db-reset.ts:9-14` uses lexical `path.resolve/path.relative` checks and `:27-28` deletes the accepted targets recursively.
- Failure: an in-project symlink can resolve to an external file or directory that the command then deletes.
- Missing regression: confirmation, root/external path, and symlink-escape fixtures.
- Narrow fix: canonicalize the real project root and each target's existing parent or nearest existing ancestor before deletion; reject every realpath escape.
- Interaction risk: support a nonexistent default database safely without following a symlinked visual root.
- External sources: Claude GAP-2 and non-blocking item 3; Grok fresh-start coverage note.

### B5 — Concurrent derived-short recovery can duplicate paid dispatch

- Invariant: one exact article recovery operation can create at most one provider dispatch at a time.
- Evidence: `src/editorial/grounded-run.ts:1886-1906` checks for an existing child before awaiting the provider; persistence and uniqueness occur only after the call at `:1911-1922`.
- Failure: two requests both see no current child and both call the provider.
- Missing regression: a latched no-network provider with two overlapping recovery requests.
- Narrow fix: insert an atomic claim keyed to the exact parent article after cost preflight and immediately before dispatch.
- Interaction risk: retain truthful active/unconfirmed, confirmed failure, and explicitly retryable states.
- External sources: none; independently discovered.

### B6 — Concurrent custom-image generation can duplicate paid dispatch

- Invariant: one approved custom-image brief can have at most one active generation dispatch.
- Evidence: `src/lean/service.ts:3477-3498` inserts a new `dispatching` attempt after checking only for a completed companion. `migrations/001_foundation.sql:96` has no uniqueness rule for an active attempt per brief.
- Failure: two serialized preflight transactions both see no completed companion, insert separate attempts, and call the provider.
- Missing regression: overlapping synthetic image-provider calls for one brief.
- Narrow fix: add database-enforced uniqueness for the active dispatch claim and fail the losing caller as already active/unconfirmed.
- Interaction risk: confirmed failed attempts remain retryable; a crashed dispatch must not be presented as confirmed provider failure.
- External sources: none; independently discovered.

### B7 — Request-bound live-run navigation is misleading

- Invariant: while execution remains request-bound, the author must be told to keep the page open and navigation behavior must prove that policy.
- Evidence: `app/ideas/[ideaId]/idea-workspace-client.tsx:631-665` says the author “can” keep the page open; stage and application links remain active at `:436-473` and `app/app-nav.tsx:7-9`.
- Failure: the author navigates, reloads, uses back, or closes the tab during paid work and cannot tell whether execution continued or was interrupted.
- Missing regression: delayed no-network live execution combined with sidebar/stage navigation, reload, and browser back.
- Narrow fix: state that the page must remain open, guard internal navigation while active, and register a `beforeunload` warning.
- Interaction risk: a warning-only fix must not claim cancellation, durable queuing, or restart-safe continuation.
- External source: product auditor B1.

### B8 — Structured Principle can diverge from the durable capture

- Invariant: for a structured capture, Principle is the authoritative mutable source for future Board runs while prior snapshots remain immutable.
- Evidence: the client sends both old `rawNotes` and the edited `structuredIdeaBrief` at `app/ideas/[ideaId]/idea-workspace-client.tsx:508-520,561-578`; `src/lean/service.ts:830-835` gives `rawNotes` precedence.
- Failure: the new Principle is saved separately while the old underlying capture remains, creating conflicting retrieval and Board inputs.
- Missing regression: real browser payload through save/continue, followed by durable data, retrieval, and Board-snapshot assertions.
- Narrow fix: reject conflicting structured payloads and make Principle authoritative when the structured brief is present; omit stale raw notes from that client path.
- Interaction risk: preserve free-form capture behavior and never rewrite historical Board snapshots.
- External source: product auditor B4.

### B9 — First custom concept cannot be corrected before approval

- Invariant: the author can correct a proposed paid concept before approving generation.
- Evidence: `app/queue-client.tsx:2329-2351` offers approval/generation but no edit; version controls at `:2375-2417` require a rendered lead; `src/lean/service.ts:3335-3348` rejects edits to a `no_visual` custom brief.
- Failure: an incorrect first direction must either be approved or abandoned without a product-supported correction path.
- Missing regression: edit a recommended custom concept before approval and assert zero dispatch.
- Narrow fix: add a no-cost edit or dismiss-and-replace action limited to a `recommended` custom brief.
- Interaction risk: never mutate approved/rendered history or dispatch before explicit approval.
- External source: product auditor B3.

### B10 — Idea title is trusted inside the custom-image prompt

- Invariant: every author-controlled field influencing a model is bounded as untrusted data.
- Evidence: `src/visual/custom-image.ts:146` interpolates the title directly into trusted instructions; saved output and author direction are correctly bounded.
- Failure: an instruction-shaped title can redirect the image task from the trusted prompt region.
- Missing regression: hostile title in `customIllustrationPrompt()`.
- Narrow fix: put the title inside `createUntrustedContextBlock()` and reference it generically from trusted instructions.
- Interaction risk: prompt fingerprints and injection signals change; route, price, and cap authority must not.
- External source: Claude non-blocking item 1, elevated after direct verification.

### B11 — Invalid actual estimates can weaken the cumulative cap

- Invariant: every estimate used for authorization or cumulative accounting is finite and non-negative.
- Evidence: `src/editorial/grounded-run.ts:483-495` validates the pre-dispatch maximum, but `:501-506` accepts the post-response actual estimate without validation and adds it to committed cost.
- Failure: a negative or non-finite actual estimate can reduce or corrupt committed cost and allow later calls past the intended cap.
- Missing regression: valid positive reservation followed by a negative or `NaN` actual estimate from an injected provider.
- Narrow fix: validate the complete actual estimate before committing it; on invalid telemetry, fail the attempt and conservatively charge the reservation.
- Interaction risk: missing usage may remain supported, but must not become fabricated zero/negative accounting; persist the original attempt separately.
- External sources: none; independently discovered.

## External finding disposition

| Source and finding | Classification | Disposition | Result |
|---|---|---|---|
| Claude BLOCKER-1 and product B2: ignored visual route | Confirmed implementation defect | Merged and confirmed | B1 |
| Claude GAP-1 and Grok B1: persistence faults can leave `running` | Confirmed implementation defect | Merged and confirmed | B3 |
| Claude GAP-2 and Grok reset-test note | Missing direct evidence | Merged; direct inspection also found B4 | B4 |
| Claude non-blocking 1: untrusted image title | Confirmed implementation defect | Confirmed and elevated | B10 |
| Claude non-blocking 2: GET route lacks safe-error wrapper | Optional hardening | Confirmed as non-blocking | Backlog |
| Claude non-blocking 3: lexical reset containment | Confirmed implementation defect | Confirmed and elevated | B4 |
| Grok B2: source-attribute prompt escape | Confirmed implementation defect | Confirmed | B2 |
| Grok visual-root containment note | Optional hardening | Confirmed documented limitation | Backlog |
| Grok per-attempt reservation display note | Optional hardening | Confirmed | Milestone 9/backlog |
| Grok request-bound execution note | Incorrect interpretation | Queue absence is deliberate; warning defect is separate | B7 only |
| Product B1: navigation/reload during Board | Confirmed implementation defect | Confirmed; severity reduced from Critical to High | B7 |
| Product B3: cannot revise first custom concept | Confirmed implementation defect | Confirmed | B9 |
| Product B4: Principle/raw capture divergence | Confirmed implementation defect | Confirmed | B8 |
| Product disabled visual explanations | Optional hardening | Confirmed | Backlog |
| Product rendered-pixel QA gap | Optional hardening | Confirmed | Backlog |
| Product stale template-marker documentation | Stale or already fixed | Confirmed stale documentation | Documentation correction |

## Verified contradictions

1. The reports share a commit but not the same effective filesystem because the ignored visual route existed only in the working-tree superset. HEAD is authoritative.
2. Terminalization is a concrete defect, not only an evidence gap: the terminal update is visibly rolled back with the failed persistence transaction.
3. The accepted lexical limitation concerns ordinary visual-root containment, not the destructive reset command. Fresh-start requires real project-local containment.
4. Prompt body escaping does not prove source-attribute safety; the source serializer remains vulnerable.
5. The existing Principle service test omits `rawNotes`, while the real browser submits it. The green nearby test does not cover the product failure.
6. Missing durable background execution is deliberate scope. Misleading navigation behavior is the defect.

## Required remediation order

1. B1 — tracked application completeness and real custom-image endpoint.
2. B2 and B10 — all prompt-boundary corrections.
3. B11 — post-response cost-accounting validation.
4. B3 — run terminalization under persistence faults.
5. B5 and B6 — atomic paid-dispatch claims.
6. B4 — destructive reset realpath safety.
7. B8 — structured narrative source identity.
8. B9 — pre-approval custom-concept control.
9. B7 — truthful request-bound navigation behavior.
10. Complete no-provider gate and a fresh independent read-only audit.

The order deliberately closes repository, trust, finance, and concurrency boundaries before author-facing workflow changes. A remediation may be split into reviewer-readable commits, but no blocker is complete until its direct regression fails against the prior behavior and passes with the narrow correction.

## Optional hardening backlog

- Give the idea GET route consistent safe JSON error handling.
- Revisit realpath containment for ordinary visual asset reads and writes.
- Show each attempt's conservative reservation alongside its recorded estimate.
- Explain individual disabled visual actions.
- Add rendered screenshot or pixel QA for every deterministic visual grammar.
- Remove superseded template-marker statements from current status documentation.

## Validation and release policy

After all direct regressions pass, run the complete local no-provider gate:

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run db:validate`
5. `npm run security:secrets`
6. `npm run security:audit`
7. `npm run build`
8. `npm run test:e2e -- --reporter=line`
9. `git diff --check`
10. `git diff --cached --check`
11. Verify the exact tracked/staged application reproduces the tested application and excludes private/local material.

Do not authorize a live provider test until every integrated blocker is closed, all required direct regressions exist, this gate is green, and the complete patch receives a fresh independent read-only review.

## Audit limits

The audit did not inspect `.env` files, credentials, databases, WAL/SHM files, backups, BOK contents, voice-skill contents, Notebook contents, private content, provider request bodies, or unrelated untracked assets. The directly related ignored visual route was read because tracked code depends on it. No provider, network call, migration, reset, backup/restore, test suite, build, E2E run, secret scan, or dependency audit was executed during adjudication. The repository remained unchanged and tracked Git state remained clean.
