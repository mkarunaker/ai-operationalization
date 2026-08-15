# Implementation Status — Lean Refactor

## Delivery workflow for future changes

Use a short-lived branch and intent/risk-sized commits: a commit is appropriately sized when one reviewer can understand one intent and one safety argument, not when it meets a line-count target. Obtain an independent read-only agent review before opening one CI-backed pull request; the human owner makes the merge decision. Record the intent, risk, direct regression evidence, validation results, migration/compatibility implications, and known limitations in that PR handoff. See `BUILD_ROADMAP.md` for the full working pattern.

## Milestone 10 release gate — complete; Sol approved, 2026-08-14

Status: **complete — independently approved by Sol.** The repeat review found one remaining run-scoping gap in the direct fixture and retrieval projection. Both were corrected, the complete no-provider gate passed again, and Sol's final read-only review approved the complete 22-file diff with no remaining concrete blocker.

- Every state-changing route already used the shared JSON, loopback, `Sec-Fetch-Site`, and `Origin` boundary. The boundary now requires an Origin and compares it with the normalized actual `Host`, so `localhost`, `127.0.0.1`, and `[::1]` remain distinct even when they share a port. Direct Host-normalization coverage accepts a matching actual Host/Origin pair and rejects a conflicting loopback Origin; originless and every-route regressions prove a sibling local service cannot mutate the application by omitting or forging the browser origin.
- A normal server open reconciles only orphaned snapshot-backed request-bound live Editorial Board runs left `running` by a prior process. Reconciliation persists an ISO UTC `interrupted_at`, terminalizes the run as failed, and then serves timestamp-normalized read-only projections. The valid live-run regression includes an older eligible completed Board, a previously failed Skeptic, and matching run-scoped retrieval/provider telemetry; it proves the explicit interruption marker remains authoritative: idea detail and progress are incomplete/interrupted, no stage is running, and provenance is failed rather than completed. A matrix leaves targeted reviewer, final-draft, grounded-test, and already-terminal runs unchanged. The browser renders the same live provenance truth, while the existing navigation regression guards link, Back, reload, and unload paths during an active request.
- The secret scan now examines precisely the tracked worktree and all reachable Git revisions, reports paths only, and does not recurse into ignored private sources or untracked reference assets. It passed for **160 tracked files and 17 reachable revisions**.
- A new synthetic integration regression creates a temporary migrated SQLite database, invokes the real backup script, exercises its restore-copy integrity validation, and proves owner-only `0700` backup-directory and `0600` backup-file permissions. It neither opens nor copies the configured local database.
- The pre-audit authoring pass keeps free-form Develop focused and makes the narrative template an explicit opt-in; its fields have aligned sizes and regular-weight entry text. Board quality selection now matches the local form controls, route authority is disclosed at the bottom of the run setup, and the saved BOK backbone uses the same visual hierarchy as the suggested changes. Write groups output provenance/length and proofread findings more tightly. The draft editor now retains the latest typed text in a ref through save reconciliation; direct browser coverage proves that a saved short-post edit clears `Unsaved changes` and re-enables `Run draft review`.
- `Run draft review` remains one author action. Its editorial assessment is deterministic; only the explicitly disclosed low-tier proofread can call a configured provider. Material proofread dispositions remain mandatory because Finalize must distinguish a revised, accepted, dismissed, or still-open correction.
- The clean baseline now includes the explicit marker. The repository deliberately maintains one current schema rather than compatibility migrations; it was validated only on fresh temporary databases and was not applied to meaningful local data. The owner-controlled backup and fresh-start procedure remains required before rebuilding an existing local workspace.
- Command-derived validation passed against the final run-scoped implementation: `npm run typecheck`; `npm run lint`; `npm test` (**26 files / 182 tests**); `npm run db:validate` (**1 baseline migration, validate-only**); `npm run build`; `npm run test:e2e -- --reporter=line` (**48 deterministic production-mode browser flows on `127.0.0.1:3100`**); `npm run security:secrets` (**160 tracked files / 17 reachable revisions**); `npm run security:audit` (**0 vulnerabilities**); `git diff --check`; and `git diff --cached --check`. The browser runner emitted only the known `NO_COLOR`/`FORCE_COLOR` warning. The secret scan required permission only to create its local TSX IPC socket; it read tracked worktree files and reachable Git history only.
- The E2E suite uses its own temporary database, synthetic BOK/voice fixtures, blank provider credentials, and `EDITORIAL_TEST_DISABLE_PROVIDER_CALLS=1`. It never uses the local database or provider credentials.

Sol's final read-only audit verified the distinct immutable interruption snapshot, exact run-scoped retrieval/provider provenance, canonical interruption timestamps, full-Board-only reconciliation, Host/Origin boundary, browser truthfulness, tracked scope, and final gate evidence. Preserve the untracked local PDF, `archive/`, `content/`, and PNG assets. No live provider call, meaningful-data migration, staging update, commit, or push occurred before approval.

## Integrated audit remediation — required before Milestone 10, 2026-08-13

Status: **COMPLETE — independently approved; no live-provider test authorized.** Three independent reports were adjudicated against clean `main` at `b9c77fa3111036b5646337c2aca147b22dee758f`. The integrated audit confirmed eleven blockers spanning tracked application completeness, prompt boundaries, post-response cost validation, run terminalization, duplicate paid-dispatch concurrency, destructive reset containment, structured Principle identity, request-bound navigation truthfulness, and pre-approval custom-concept control.

Current checkpoint: B1–B11 remediation code and direct regressions are staged, including actual delayed-run Back/reload coverage, persisted invalid-pricing telemetry, and retrieval-provenance selection. `typecheck`, lint, unit/integration tests, baseline migration validation, production build, secret scan, dependency audit, and the complete deterministic Playwright suite (**44 passed**) are green. The repeat independent read-only review approved the complete 26-file staged patch with no concrete blockers.

Command-derived validation: `npm run typecheck`; `npm run lint`; `npm test` (**25 files / 166 tests**); `npm run db:validate` (**1 baseline migration**); `npm run build`; `npm run test:e2e` (**44 passed**); `npm run security:secrets` (**138 files**); `npm run security:audit` (**0 vulnerabilities**); `git diff --check`; and `git diff --cached --check`. No provider call or meaningful-data migration occurred.

The first fresh review returned `DO NOT APPROVE` for one remaining B8 creation-boundary gap: `POST /api/ideas` accepted conflicting `rawNotes` and structured `Principle`, so retrieval and the durable Board capture could diverge. The direct API regression at `tests/integration/grounded-editorial-run.test.ts:410` first observed the old `201` response, then passed after `src/lean/service.ts:77-82` rejected the conflict before persistence. The same regression creates a coherent structured idea through the real route, runs an original and revised Board, proves both immutable snapshots in order, and proves the newest retrieval record matches the revised authoritative Principle. The complete no-provider gate above was rerun after this correction; the repeat independent read-only audit approved B1–B11 with no concrete blocker. Milestone 9.5 is complete and stops before Milestone 10.

- Full audit and external-finding disposition: `docs/AUDIT_2026-08-13_INTEGRATED.md`
- Active remediation plan: `BUILD_ROADMAP.md`, **Milestone 9.5 — Integrated audit remediation and paid-run safety**
- Priority: close repository/trust/finance/terminalization/concurrency/reset boundaries first, then structured identity and author-facing UX.
- Required method: add one direct adversarial regression per blocker, observe the prior failure, make the narrowest correction, run the complete no-provider gate, and obtain a fresh independent read-only audit.
- Live-provider policy: no live provider test is authorized until every blocker is closed, all direct regressions exist, the complete local gate is green, and the resulting patch receives fresh independent approval.
- Optional hardening remains outside blocker scope unless a direct regression proves it is required.

This status supersedes older current-checkpoint language that implied the repository was ready to proceed directly to Milestone 10. Historical implementation and audit records remain evidence, not current approval.

## Deterministic draft readability remediation — 2026-08-13

Status: **complete — independently approved by Sol on 2026-08-13.** A manual production-mode product test exposed that the local `GroundedTestProvider` padded its short working draft by repeating the same six generic sentences. This is a zero-cost local fixture, not a live model or voice-quality claim, but it is reader-visible output and was corrected before any later model-routing work.

The fixture now emits one bounded set of distinct, readable sample sentences and treats the configured reader range as advisory rather than repeating prose to reach its minimum. The direct regression at `tests/integration/grounded-editorial-run.test.ts` uses a realistic customer-support operating-leader prompt, asserts every emitted sentence is unique, and proves the run ledger remains `$0.00`. It first failed against the old fixture (15 sentences, only 6 unique) and passes with the correction.

Command-derived validation after the correction: `npm run typecheck`; `npm run lint`; `npm test` (**25 files / 167 tests**); `npm run db:validate` (**1 baseline migration**); `npm run build`; `npm run test:e2e` (**44 passed**); `npm run security:secrets` (**138 files**); and `npm run security:audit` (**0 vulnerabilities**). No provider call, provider routing change, or meaningful-data migration occurred.

Sol's final read-only review found no concrete blocker: the change remains bounded to the deterministic fixture, its hard-zero cost ledger, and its direct regression; existing range-guidance, source-scaffolding, provenance, and browser expectations remain intact.

## Live quality profile and BOK evidence backbone — complete; Sol approved, 2026-08-13

The owner approved a strict **$0.75 maximum per live Board run** and requested a mature-content option. The active implementation moves the committed OpenAI route assumptions to Luna (low), Terra (medium), and Sol (high), exposes only two server-owned Board profiles, and requires the browser to display the exact planned route and upper-bound reservation before execution. Balanced uses Terra for Board judgment and the main draft; Frontier content uses Sol only for the main draft while the remaining Board stages remain on Luna. The cap is not a target, cannot be raised by a local environment setting, and applies before every request, including the one permitted same-route structured-output repair. No provider call is authorized during implementation or validation.

The route rejects browser-supplied provider/model/tier/pricing/output controls and any unknown profile before dispatch. A nonstandard OpenAI model ID also fails closed unless all three explicit per-million pricing inputs are configured, so it cannot silently inherit a different model’s rate. Independent review found two pre-dispatch disclosure gaps: the working-draft recovery preview could display the current default tier rather than the saved route, and a fast profile switch could leave an older preview visible. The remediation binds recovery disclosure to its persisted route and blocks a Board run until the visible preview confirms the selected profile. Sol's follow-up read-only review approved both corrections with no remaining concrete blocker.

Command-derived validation: `npm run typecheck`; `npm run lint`; `npm test` (**25 files / 175 tests**); `npm run db:validate` (**1 baseline migration**); `npm run build`; `npm run test:e2e` (**46 passed**); `npm run security:secrets` (**138 files**); `npm run security:audit` (**0 vulnerabilities**); and both Git diff checks. Direct no-network coverage verifies named-profile mapping, the $0.75 ceiling, explicit current pricing assumptions, injection rejection, cost reservation, malformed/refusal/truncation/repair states, terminalization, a saved Frontier recovery route, and the browser selector's stale-preview block. No provider call, migration application, or private source access occurred.

Owner decision saved 2026-08-13: model quality alone is insufficient. A BOK-grounded article must be built around one visible, selected BOK operating distinction, with its uncertainty boundary, rather than treating retrieval as passive context. The completed remediation adds a structured evidence backbone to synthesis; validates its canonical source key against the exact retrieved BOK set, restores the exact heading server-side before drafting, passes it through an untrusted model-to-model boundary, and renders it in the saved Editorial Brief before the author edits. No-network regressions reject an invented source key before Initial Drafter dispatch, preserve headings containing special characters, and show the saved backbone in the browser. Sol independently approved the completed change. No provider call is authorized for this remediation.

Owner follow-on saved 2026-08-13: a successful high-tier retry produced a coherent but overly generic working draft. The drafting-quality refinement requires the Initial Drafter to form a distinct authorial judgment from the incident, make the validated BOK distinction change the interpretation, and avoid replacing that judgment with a generic AI-concern list. Local validation passed: `npm run typecheck`; `npm run lint`; `npm test` (**25 files / 177 tests**); `npm run db:validate` (**1 baseline migration**); `npm run build`; `npm run test:e2e` (**46 passed**); `npm run security:secrets` (**138 files**); and `npm run security:audit` (**0 vulnerabilities**). No provider call was made. A user-initiated live draft and author judgment remain the required quality check.


## Structured idea-capture follow-on — in progress, 2026-08-12

- Capture now offers radio-button choice between free-form writing and a topic-neutral narrative template, with one shared working title plus an optional shared Reader setup. The template contains Situation, Assumption, Discovery, and Principle: a real fact, the belief under tension, the specific learning, and one plain takeaway. A structured capture uses its Principle as the underlying original capture, avoiding duplicate author entry, while free-form captures retain an editable Main idea field in Develop. The four fields are a free preflight boundary before a Board run; missing or generic fields return field-specific questions and the server independently rejects direct execution before provider dispatch. BOK retrieval uses the Principle; all four fields are untrusted, verbatim-eligible editorial source material. The clean fresh-start database retires managed themes and legacy template compatibility; authors can use ordinary `#tags` in their idea and notes.
- The brief is stored separately from ordinary author notes, rendered into the saved Board source only as bounded untrusted data, and is excluded from trusted role instructions. Initial drafting recognizes `[SPINE]`, `[notes]`, “Keep verbatim,” and “Not saying” as editorial markers; it cannot treat their content as instructions or invent facts/attributions.
- Direct regression coverage verifies persistence/clearing, prompt-boundary placement, protected wording visibility, and zero provider requests for an incomplete started brief. Full validation remains pending the combined current visual-quality and capture-template working tree.

## Milestone 7.1 handoff — independently approved by Sol, 2026-08-11

Status: **complete — independently approved by Sol.** The staged schema-complete audit patch includes `023_visual_asset_version_sequence.sql`. Sol's final read-only audit found no concrete 7.1 blocker and confirmed the saved-voice, visual-sequence, custom-direction, classified-recovery, and reader-facing safety invariants below.

- Initial Drafter recovery now reads the saved voice-version checksum and rechecks the current configured source before availability, estimation, or execution. If either checksum differs from the immutable saved Board checksum, recovery is unavailable and rejects pre-dispatch; the direct synthetic-source change regression proves no provider request occurs. Safe persisted categories distinguish output-limit and reader-prose-scaffolding failures, so the browser names the actual recovery boundary. Historical strict reader-range records remain readable for compatibility only.
- `023_visual_asset_version_sequence.sql` introduces an immutable visual asset sequence. Mutable palette/claim/label edits still increment only the brief-edit count. A Version 2 edited before approval remains Version 2 of 2 in the service and browser, while both assets remain distinct history. The additive, validate-only migration is staged with the current audit artifacts.
- Visual direction now uses positive supported-grammar mapping rather than an incomplete literal-object denylist. An unlisted bridge metaphor beside otherwise diagram-like prose remains a saved no-render custom-illustration concept with no approval/render action.
- Follow-up audit evidence now directly changes a traceable Version 2 claim alongside its forest palette and proves immutable asset version 2, advanced mutable brief revision, Version 2 of 2, and distinct Version 1/2 assets. The real hostile Initial Drafter fixture also persists `reader_prose_scaffolding_failed`; the browser exercise creates that deterministic local failure and reads its API projection, while mocking only retry availability. No browser payload supplies that category.
- The newest visual-version remediation makes a new asset path include the immutable visual version and brief identity, preventing same-millisecond V1/V2 collisions. A frozen-clock service regression asserts different IDs and paths, both files, and unchanged V1 contents after V2. Browser next/total numbering now uses complete immutable history: V1 followed by dismissed concept V2 and rendered V3 truthfully predicts V3 and displays Version 3 of 3.
- The adjacent initial-concept transition now intentionally dismisses a pending literal custom concept before an author-selected supported alternative receives the next immutable version. Direct service and browser flows prove V1 dismissed bridge concept → V2 decision-fork diagram → Version 2 of 2 with unique history and no actionable duplicate V1.
- The Initial Drafter recovery still uses an additive `initial_drafter_recovery_claims` table. After local reservation preflight and immediately before the provider call, an atomic unique claim is written for the saved Board run. A concurrent caller is rejected before dispatch; a cap rejection creates no claim; and the claim remains after the one recovery attempt so a third attempt cannot occur. The latched-provider regression proves one overlapping request dispatches, the other receives the safe one-retry rejection, preview is unavailable while the first is in flight, and exactly one recovery model call persists.
- `capturedFragments()` now examines every normalized contiguous 12-word capture window and retains every non-empty normalized token. Direct compliant-length adversarial fixtures use the previously skipped `slice(1, 13)` fragment containing `a` and `I` at the Initial Drafter, same-run derived-short, and scoped derived-short recovery save boundaries; all reject before a reader-facing output or relationship is saved.
- The fresh/upgrade migration regression now requires `022_initial_drafter_recovery_claim.sql` and `initial_drafter_recovery_claims`, alongside visual migrations `020`, `021`, and `023`. The four migrations and two 7.1 handoff documents are staged and appeared in `git diff HEAD` for Sol's final audit; no commit or push has occurred.
- Focused direct validation for the current audit blockers passed: `npm test -- --run tests/integration/lean-service.test.ts` (**1 file / 43 tests**); `npm run typecheck`; and `npm run lint`. The complete no-provider gate then passed again: `npm test` (**24 files / 136 tests**); `npm run db:validate` (**23 migrations, validate-only**); `npm run build`; `npm run test:e2e -- --reporter=line` (**32 deterministic production-mode browser flows**); `npm run security:secrets` (**132 source/documentation files**); `npm run security:audit` (**0 vulnerabilities**); `git diff --check`; and `git diff --cached --check`. Browser output contained only the known `NO_COLOR`/`FORCE_COLOR` warning. No provider call, meaningful-data migration, manual `.env` inspection, secret/private-source access, commit, or push occurred; only additive migration `023` was staged for the schema-complete audit patch.

- Milestone 7.1 closes bounded post-Milestone-7 authoring gaps without reopening the approved visual-brief contract. It preserves the immutable saved reader range as author-facing guidance on article, short-post, and recovery output; rejects internal capture/BOK scaffolding from reader-facing prose; retains free-form reader notes only inside bounded untrusted context; and preserves current Develop preferences separately from the saved Board contract.
- Manual live use exposed `initial_drafter: openai response reached its output limit`. The recovery now appears as a precise, separately metered `Retry working draft` control. It reuses the saved Board snapshot, selected retrieval records, synthesis, contract, and voice version; never reruns reviews/synthesis, alters the route or output limit, or removes the original failed attempt. Exactly one scoped recovery is permitted for that failed Board; after a second failure the retry control disappears and the author is told to start a new Board after a configuration-level route/allowance change. The saved route now records and compares provider, model, tier, pricing assumption, and the bounded Initial Drafter output allowance before both estimate and dispatch. Reviewer output-limit recovery remains separately linked, costed, and never replaces the full Board history.
- Live proofread failures retain application-authored classifications (`provider_failure`, `refusal`, `truncation`, `repair_exhausted`, `cap_rejected`, or `execution_failure`) rather than raw provider text. Write and Finalize name the safe reason and the exact combined-review retry. The no-op filter now removes only case/spacing-only confirmations: meaning-changing punctuation remains a material finding and keeps Finalize blocked until the author records a disposition.
- The existing 7.1 visual pass provides bounded author direction, an honest no-render custom-illustration concept when no supported diagram fits, versioned local lead-visual replacement with palette/template history, and a nearer Visual companion entry point. Dismissed custom concepts remain visible as read-only version history with no render/provider/cost action. New supporting-visual recommend/edit/approve/render actions are rejected by both route and service; historical supporting records remain readable only.
- Exact blocker-to-regression evidence is in [MILESTONE_7_1_BLOCKER_MATRIX.md](docs/MILESTONE_7_1_BLOCKER_MATRIX.md). The proposed read-only audit instructions are in [MILESTONE_7_1_SOL_AUDIT_PROMPT.md](docs/MILESTONE_7_1_SOL_AUDIT_PROMPT.md).
- Command-derived validation passed: `npm run typecheck`; `npm run lint`; `npm test` (**24 files / 136 tests**); `npm run db:validate` (**23 migrations, validate-only**); `npm run build`; `npm run test:e2e -- --reporter=line` (**32 deterministic production-mode browser flows**); `npm run security:secrets` (**132 source/documentation files**); `npm run security:audit` (**0 vulnerabilities**); `git diff --check`; and `git diff --cached --check`. Browser output included only the known `NO_COLOR`/`FORCE_COLOR` warning. The browser runner and scanner each needed approved local execution only to create their temporary TypeScript IPC socket.
- No provider call, meaningful-data migration, manual `.env` inspection, secret/private-source access, commit, or push occurred. The only staging action was additive migration `023` for the audit patch. Preserve the untracked local PDF, `archive/`, and PNG assets. The prior `no such column: color_scheme` observation is only a stale synthetic local SQLite schema missing migration `021`; normal app startup deliberately does not migrate it.
- Sol's final audit approved Milestone 7.1 with no blockers. It confirmed the custom-concept transition is atomic, V1/V2 asset paths remain separate at the same timestamp, complete history makes V3 of 3 truthful, changed claims leave immutable version order intact, and browser scaffolding guidance derives from a real persisted safe category. Sol was read-only and did not modify/stage files, run suites/migrations, call providers, or access private/untracked data.

## Pre-Milestone-10 Initial Drafter production-readiness remediation — 2026-08-11

Status: **complete — independently approved by Sol; ready for owner product testing.** A real local run exposed a valid Initial Drafter response reaching its 1,800-token allowance before a complete structured working draft could be validated. The remediation does not weaken the cost or recovery boundaries:

- The server-only Initial Drafter allowance now defaults to 4,000 tokens. An operator may set `EDITORIAL_INITIAL_DRAFTER_MAX_OUTPUT_TOKENS` to an integer from 2,000 through 5,000 before restarting and starting a new Board run. Invalid values fail closed before a live estimate or provider dispatch.
- The exact allowance participates in the conservative live estimate and reservation, is persisted in the immutable Board route manifest, and is replayed unchanged for the one permitted working-draft recovery. A later allowance change deliberately makes recovery unavailable rather than silently widening a saved paid action.
- After a retry request returns an error, the browser reloads only safe persisted state and distinguishes a recorded failed provider attempt from a true pre-dispatch rejection. A consumed retry claim alone is explicitly **unconfirmed**: it never falsely reports a provider failure or no dispatch. The projection reads only the latest saved failed Board run’s retry-attempt/claim state and exposes no provider bodies or private content.
- Direct no-network regressions prove the default and bounded operator override, a 4,500-token Board request plus identical saved recovery request, invalid-configuration rejection, the persisted-failure projection, the claim-without-telemetry projection, and both corresponding browser states. The existing one-retry, cost-preflight, terminal-state, route-drift, voice-drift, and failure-provenance regressions remain intact.
- Full validation passed: `npm run typecheck`; `npm run lint`; `npm test` (**24 files / 139 tests**); `npm run db:validate` (**23 migrations, validate-only**); `npm run build`; `npm run test:e2e -- --reporter=line` (**34 deterministic production-mode browser flows**); `npm run security:secrets` (**132 source/documentation files**); `npm run security:audit` (**0 vulnerabilities**); `git diff --check`; and `git diff --cached --check`. The browser runner and secret scan used approved local execution only for their temporary TypeScript IPC sockets.
- No provider was called, no meaningful-data migration was applied, and no database, backup, `.env.local`, credential, BOK, voice, Notebook, or provider request body was read. Preserve the untracked local PDF, `archive/`, and PNG assets.

Existing saved Board snapshots retain their saved allowance by design. A run whose one retry was already consumed remains terminal; use the new server policy only for a new Board run after restarting the app.

### Current owner-test remediation — reader-range guidance

Status: **in progress — full local validation passed; pending independent review.** Reader ranges remain immutable provenance for a Board run, but they are guidance rather than a save gate. A complete model response that is otherwise safe and structurally valid is saved even when its article, short post, or derived short post falls outside the saved range. The Board’s saved-run disclosure reports each current saved output’s word count and its recorded guidance, marking a variance as “Saved for author judgment,” never as a failed stage. It also now exposes a safe per-attempt cost and usage breakdown—role, route, terminal outcome, reported tokens, retry number, failure category, and recorded estimate—while making clear that a Board cap is a ceiling rather than a charge. The Write editor repeats non-blocking length guidance for a generated working draft. Reader-facing safety continues to reject explicit internal source/prompt labels and copied 12-word capture fragments, but no longer rejects ordinary phrases such as “the following themes”; the two safe rejection messages are distinct. Historical runs created under the retired strict rule remain visibly incomplete because no draft was saved; they explain that a new Board run is needed to use the new behavior. Output limits, provider failures, refusal, malformed structured output, source/capture-scaffolding exposure, voice-rule failure, and safe-save failures remain real classified failures with stage-specific recovery where available. Local evidence: typecheck, lint, 24 test files / 140 tests, 23 validate-only migrations, production build, 37 deterministic browser flows, a 132-file secret scan, dependency audit with zero vulnerabilities, and diff checks. No provider call or meaningful-data migration occurred.

### Product-test visual-quality follow-on — 2026-08-12

Status: **in progress — deterministic renderer hardening and the custom-image route are implemented; full release validation and independent review remain.** The local SVG renderer now preserves normal font metrics and truncates within conservative line budgets instead of stretching glyphs with SVG `textLength`. Diagram headings come only from the selected grammar; exact source claims appear once as explanatory detail, never as shortened duplicate headings. New briefs extract up to three distinct source-backed sentences; historical one-claim briefs retain clean grammar defaults for empty slots rather than duplicating one sentence in every panel. Write/Finalize preview scale is smaller while download remains the full 1080px PNG rendition. Fine-tuning a deterministic diagram is now an optional disclosure, not a list of required author questions.

- A literal **Custom illustration** is now an explicit author choice. It cannot silently select a deterministic diagram merely because the text contains words such as “path” or “contrast.” The app presents a concise article-grounded concept, then requires a separate approval and configured fixed image price before one image generation. Its request is bounded untrusted content, has no template picker and no supplied prompt fragments, refuses a missing/invalid/over-cap route before dispatch, records every dispatch/completion/failure separately, and saves an immutable PNG under the existing local visual root. Generated images are served only by database asset ID, never a browser-supplied path. The current fixed price and model remain explicit local environment configuration until Milestone 9 moves those non-secret choices into Settings.
- Custom direction is truly optional: migration `025_custom_visual_intent.sql` records custom intent independently of its free-text direction. A blank-direction custom request remains immediately visible with its article-grounded concept and approval control instead of becoming an invisible generic no-visual record.
- Product-test writing feedback now informs the trusted Initial Drafter instruction: genuine framework articles use clean plain-text section signposts, generous paragraph breaks, and a recap transition after the final point, without accepting Markdown headings or lists. Custom-image instructions now make people optional but require inclusive gender presentation, age, and skin-tone variation whenever a group scene is appropriate; they explicitly reject stereotypes, tokenism, and gender-coded roles.
- First-time visual authoring now shows all four deterministic grammars before creating a brief. One article-grounded option is visibly suggested, each choice states the relationship it would show, and no set of four assets or paid requests is created. A separate custom-illustration choice sits below the templates; selecting any option prepares exactly one brief, which still requires explicit approval before its free deterministic render or separately priced custom-image request.
- Focused local evidence: `npm run typecheck`; `npm run lint`; visual unit/service tests (**2 files / 55 tests**); complete unit/integration suite (**24 files / 145 tests**); migration validation (**24 files**); production build; and targeted deterministic browser flows for custom direction and version history. No provider call, meaningful-data migration, private-source read, or image-generation request occurred.

### Next planned recovery ergonomics — local per-attempt overrides

The next planned item, after the owner’s end-to-end product test, is a safe author-facing recovery choice rather than a code or environment-file edit. It is deliberately scoped to one new attempt and never changes Settings or historical provenance:

- A cap increase retries only the blocked stage after a new conservative reservation; a pre-dispatch cap rejection never consumes a retry claim.
- An explicit output-allowance increase regenerates only the failed draft stage from the immutable saved Board snapshot. It creates a separately versioned attempt with its own route, allowance, cap, reservation, telemetry, and outcome; completed reviewers and synthesis are not rerun.
- Changes to reader contract, captured/source material, or editorial reasoning require a new Board run. “Regenerate working draft from this saved Board” remains separate from a full Board rerun.
- The UI must offer dependency-safe named actions, not arbitrary stage checkboxes. A Settings change remains a future default only; a recovery override is local to its one attempt.

## Milestone 6.2 handoff — 2026-08-09

Status: **complete — independently approved by Sol on 2026-08-09.** Milestone 5.1 is likewise complete and independently approved.

### Post-approval UX closure — approved by independent Sol read-only audit on 2026-08-10

- This bounded pass keeps Milestone 6.2’s reader-first, exact-version, and local-only guarantees intact while simplifying Capture, Develop, Editorial Board, Write, Finalize, and the shared shell before Milestone 7.
- It adds: a smaller capture title treatment with a thought-capture editor aligned to Save; compact theme addition; confirmed queue-level deletion for unpublished ideas only; compact original-capture disclosure; a compact Develop Park/delete pairing; clear separate reader/output sections with a standard bounded audience-note input and wide-screen output/range alignment; visibly separated Develop sections and compact stacked research-choice radios with numbered evidence groups; a compact saved Board run status; matched non-overflowing Write editor cards with their review action beside each exact output and model/cost disclosure beside—not inside—the control; restored Knowledge-sources navigation; wider normal workspace columns; and a safe aggregate per-idea usage ledger.
- Visual preview and export now share the exact escaped deterministic SVG source; the user sees that asset in Write and downloads a local PNG rendition, with Refresh beside Download. Generated SVG artifacts now live under the ignored configured `visuals/` directory, not beside the SQLite application-data file, using readable title prefixes capped at 20 characters plus collision-resistant per-idea suffixes. All four visual-shape choices share one desktop row, and every SVG template now contains text in fixed panels with bounded line wrapping plus per-line physical `textLength` constraints; decision paths terminate at their outcome panels rather than dangling beside them. Finalize renders that visual smaller, has a clearly styled Return-to-Write control, and uses one dynamic publication-record layout for pending and recorded article/derived-short outputs. Its disabled-state guidance is concise but retains each exact server-enforced review, proofread, material-finding, and article-first gate; recorded outputs show only delivery channel, URL or its absence, and publication date.
- The ledger is deliberately limited to persisted model-attempt count, total tokens, and recorded estimated cost. It labels deterministic runs as local `$0.00` and cost as an estimate, never an invoice; it exposes no prompts, sources, raw provider data, credentials, or private text.
- Future configuration is deliberately deferred to planned Milestone 9. It will create one safe Settings surface for theme taxonomy, non-secret model/cost policy, source-readiness metadata, and validated local defaults. It will not expose credentials, source contents, provider request bodies, or retroactively mutate an immutable saved Board contract; the release gate is consequently Milestone 10.
- The UX audit map and direct regression requirements are appended to `BUILD_ROADMAP.md` and `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`. Local validation passed: `npm run typecheck`; `npm run lint`; `npm test -- --run` (24 files / 91 tests); `npm run db:validate` (18 files, validate-only); `npm run build`; `npm run test:e2e -- --reporter=line` (16 deterministic production-mode flows); `npm run security:secrets` (132 source/documentation files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`.
- Tests used temporary databases and synthetic BOK/voice fixtures with external provider calls disabled. No migration was applied to meaningful data; no `.env` file, secret, BOK, voice, private source, or provider request body was accessed. Sol’s final read-only audit approved this bounded closure with no blockers. Its only noted limitation is that visual-root containment is lexical and has no symlink-escape fixture; no concrete violated invariant was found under the configured local-root trust model.

- Sol's 2026-08-09 read-only audit found two narrow contract gaps: scoped derived-short estimation/recovery used mutable Develop preferences instead of the saved Board contract, and targeted reviewer reruns omitted the trusted reader/output contract. Both regressions were added first and failed against the audited code. `loadImmutableReaderContract()` now reads the strict saved manifest, derives the scoped estimate/recovery request and reviewer-rerun system prompt from it, and never substitutes later mutable preferences.
- User testing also exposed an expected empty-index state as repeated server-console errors that hid the entire Board setup. `liveRunPreview()` now reports local BOK/voice readiness without throwing; the Board panel stays visible and truthfully disables both live and deterministic Board actions until the required source is ready. This has direct integration and browser coverage.
- The latest Sol findings are remediated with direct regressions: a manually saved pre-Board draft now yields a zero-cost scoped preview rather than loading nonexistent provenance; `hasSavedBoardReaderContract()` also keeps targeted-rerun and derived-refresh controls unavailable until an immutable Board contract exists. Migration 018 now proves every legacy paired, long, short, and null/default branch for both ideas and run snapshots, while mixed legacy/current payloads are rejected without changing the saved generic contract. The paired-output Finalize regression selects `medium` for the article and `substack` for its derived short post, records both after the article-first gate, and verifies exact persisted output/channel pairs.
- The final remediation binds proofreader request construction and its two-attempt reservation to the strict saved Board reader contract. The adversarial regression changes Develop after the Board and proves estimate and dispatch retain executive / 1,234–1,567 / 321–357 while the original injection-shaped note stays only in escaped untrusted context. `updateIdea()` validates the complete merged shape/preferences state before a transaction; direct service and route tests cover shape-only rejection, preferences-only derivation, mismatches, rollback, and coherent acceptance. The blocker matrix was rechecked against every 6.2 acceptance criterion and names a direct regression for each boundary.
- The final audit follow-up makes live proofreader availability require the saved Board manifest as well as a configured route. A manual pre-Board draft now reports zero proofreader estimates and unavailable routing; a live-required request for it is rejected before provider dispatch. The immutable-contract execution regression deliberately omits the test-only `readerContract` input, proving the persisted manifest loader supplies the original trusted values. Both missing and invalid saved-contract explanations are preserved by the local mutation sanitizer and its unit regression.

- Active authoring now uses only the reader/output contract: `short`, `long`, or `long_with_derived_short`, with generic saved formats `short`, `article`, and `derived_short`. A delivery `channel` is selected only while recording an exact already-approved output in Finalize. Legacy platform plans and names remain only as immutable migration-history compatibility data.
- `migrations/018_reader_first_distribution_neutral.sql` is additive. Its direct migration regression covers a fresh database plus a populated synthetic legacy database and asserts preservation of publication provenance, performance, feedback, and retrospective dependent rows. The earlier migrations were not changed.
- The user authorized resetting the known synthetic local database. A verified owner-only backup was made; the former synthetic database was moved recoverably to the backup directory; then the new empty local database received migrations 001–018. No meaningful database or private content was opened or inspected, and no BOK/voice indexing was run.
- The blocker-to-regression matrix is in `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`. It names the exact implementation boundaries, test names, adversarial reader-note/range fixtures, persisted-data assertions, browser states, and proofreader terminal-outcome coverage. It is the required review map; green aggregate counts alone are not evidence.
- Command-derived local validation passed after this remediation: `npm run typecheck`; `npm run lint`; `npm test -- --run` (24 files / 84 tests); `npm run db:validate` (18 migrations, validate-only); `npm run build`; `npm run test:e2e` (11 deterministic production-mode flows); `npm run security:secrets` (132 source/documentation files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`.
- Tests used temporary databases and synthetic BOK/voice fixtures. No provider was configured or called. No `.env` file, secret, BOK, voice, private source, or provider request body was accessed. No files were staged, committed, or pushed.
- Deliberate limitation: channel selection records local publication history only; external publishing integration remains out of scope. The newly empty local database was not populated by private-source indexing.
- Sol's final read-only audit approved Milestone 6.2 with no blockers. It confirmed manual pre-Board proofread unavailability, production manifest loading, actionable saved-contract route errors, and the direct evidence listed in `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`. No audit-side files, migrations, providers, environment/private sources, staging, commits, or pushes occurred.

## Milestone 5.1 handoff — 2026-08-09

Status: **complete — independently approved by Sol on 2026-08-09.**

## Audit interruption checkpoint — 2026-08-09

**The three additional narrow audit gaps were remediated, the complete local gate passed, and Sol independently approved Milestone 5.1.**

- The worktree is intentionally uncommitted and unstaged. At this checkpoint, `git diff --stat` reports 28 changed tracked files; this is a shared dirty tree, so do not reset, clean, stage, commit, or discard unrelated changes.
- The latest completed local gate is command-derived: typecheck, lint, 24 test files / 130 tests, 17 validate-only migrations, production build, nine deterministic production-mode Playwright flows, 132-file secret scan, zero-vulnerability dependency audit, and both unstaged and cached diff checks all passed. No migration was applied and no provider was called.
- Re-entry procedure after interruption or an audit verdict: read this handoff and `docs/MILESTONE_5_1_SOL_BLOCKER_MATRIX.md`; map only a concrete finding to its invariant; first add a direct adversarial regression that fails against the current behavior; then make the narrowest implementation change and rerun the full local gate before another audit. Do not treat a green aggregate count as evidence.
- Continue to avoid `.env` files, credentials, meaningful local data, backups, BOK, voice, Notebook, or provider request bodies. Do not call providers, stage, commit, or push.

- Sol did not approve the earlier Milestone 5.1 implementation. The active remediation now additionally covers untrusted audience-note containment, immutable reader-contract provenance, scoped-recovery ranges, proofreader repair schema, and direct browser/service boundary coverage.
- Before a repeat audit, follow the new audit-remediation validation protocol in `docs/AGENT_SECURITY_GUARDRAILS.md`: direct boundary-to-browser regressions for each finding, injected no-network live-path outcomes, explicit compatibility branches, command-derived evidence, and a current-diff requirement-to-test review.
- Added, but did **not** apply, `migrations/017_reader_first_output_contract.sql`. It is additive and introduces optional audience fields, reader-first output preferences, legacy-plan compatibility backfill, and exact-review finding dispositions.
- No local database migration, provider call, environment-file access, BOK/voice modification, staging, commit, or push occurred for this start.
- Reader-first preferences now persist an optional audience profile/note and short, long, or paired output selection with editable bounded ranges. The legacy publication plan remains intact as compatibility data; current selections map to the existing exact-version formats and relationship rules.
- The existing per-output review action now records a separate exact-version proofread/clarity role. With a configured live route it uses the explicit low-tier provider route, reserves its cap before dispatch, persists a distinct provider attempt, and keeps the deterministic fixture for no-network tests. Material findings remain plain-text suggestions, require an explicit author decision, and are enforced again in `publishIdea()`; optional findings never block Finalize. New saved output versions naturally require a new review because every review is keyed to one immutable draft version.
- Current command-derived evidence: `npm run typecheck`, `npm run lint`, `npm test` (24 files / 130 tests), `npm run db:validate` (17 validate-only migrations), `npm run build`, `npm run test:e2e` (9 deterministic production-mode flows), `npm run security:secrets` (132 files), `npm run security:audit` (0 vulnerabilities), and both `git diff --check` and `git diff --cached --check` all passed.
- The no-network live-proofread matrix covers success, cap rejection before dispatch, provider failure, refusal, truncation, malformed-output repair, repair exhaustion, persisted per-attempt telemetry, terminal failed state, and reload eligibility. The server and Finalize independently require a completed exact-version proofread and resolved material findings.
- This final pass adds one shared scoped-LinkedIn request constructor for estimation and recovery; explicit persisted proofread status (`completed`, `failed`, or `not_run`) for truthful Finalize feedback; server rejection of caller-supplied proofreader route/pricing fields; and a shared two-attempt byte-based proofreader reservation estimate. The audit matrix names the adversarial fixtures and exact direct regressions.
- Latest remediation makes `readerContract` a strict minimal manifest object and rejects malformed persisted contracts; computes and renders proofreader reservation by exact output; suppresses live-model/cost disclosure when the route is unavailable; resolves the proofreader adapter, route, pricing, and cap entirely inside the production boundary while retaining a test-only injection seam; and persists attempted provider/model identity separately from response-reported identity. Direct no-network regressions prove a matching-metadata malicious adapter is ignored, cap rejection is independent, incoherent/no-output manifests are rejected, and a mismatched response model remains response-only telemetry.
- Do not apply migration 017 to meaningful local data without the existing owner-only backup and restore verification. Do not begin a later milestone before the Milestone 5.1 independent audit passes.

## Milestone 7 start — 2026-08-10

- Milestone 6.2’s post-approval UX closure is committed and pushed as `b4d01e7`; the independent Sol audit approved it with no blockers. The untracked local PDF, archive, and PNG assets remain outside the commit.
- Milestone 7 begins with `docs/MILESTONE_7_BLOCKER_MATRIX.md`: the visual-brief contract, author-approval lifecycle, exact-output provenance, claim validation, placement limits, and direct failing regressions are defined before implementation. The approved configured `visuals/` root supersedes the stale database-adjacent visual-path wording in the original roadmap.
- The first Milestone 7 implementation remains deterministic and local-only. No image-generation provider, private source, or meaningful local-data migration will be used; any later generative-image capability requires a separate server-owned route and independent audit.

### Milestone 7 visual-brief checkpoint — complete and independently approved by Sol, 2026-08-10

- `019_visual_brief_approval.sql` is additive and validate-only. It persists an exact saved-output visual brief, reader/output snapshot, author direction, traceable claims, labels, caption, alt text, placement, approval state, revision, and an optional rendered-asset link. It has not been applied to meaningful local data.
- The author begins with an automatic recommendation and no visual type selected. A text-only output can receive `no_visual`; an explicit explanatory-shape choice may request a visual. The author can state what the visual should help the reader see, edit bounded brief fields, approve the exact revision, then render a local deterministic SVG. Refresh remains limited to the same exact rendered brief.
- The service enforces one lead plus two supporting approved assets per exact output. Each asset remains below the configured ignored visual root, with the existing readable title-prefix, exact draft-number, timestamp, path-containment, and owner-only protections. No chart/data grammar or image provider exists in this checkpoint.
- Cost is shown truthfully as `$0.00 local` for the deterministic renderer. The roadmap records `gpt-image-2` only as a future optional illustration candidate; no route, credential, provider request, or price configuration exists or was called in this work.
- The first audit’s five bounded lifecycle defects are remediated: the route strips the action envelope before strict service parsing; rendering/refresh take template and every variable text element only from the approved brief; `<desc>` and `aria-label` use approved caption/alt text in the saved SVG itself; supporting and derived-short output lifecycles are independently projected into Write; placement edits recheck one-lead/two-support limits atomically; and `vertical_path` is now the canonical persisted author identifier while legacy rendered assets retain their own compatibility read path.
- Direct regressions added before remediation cover the real route envelope, malicious post-approval template injection, approved claim/direction/caption/alt fidelity, atomic placement mutation, vertical-path persistence/reload/rendering, immutable reader-contract provenance after later Develop changes, and exact derived-short targeting. The browser flow proves an article lead, a supporting asset, and a separate derived-short asset can each be approved and rendered without changing the approved grammar.
- Earlier local validation is superseded by the fourth-audit remediation results below.
- No `.env` file, secret, BOK, voice, Notebook, private source, database, backup, provider request body, provider, staging, commit, or push was accessed or changed. Tests used only temporary synthetic databases and synthetic source fixtures.

#### Second independent-audit remediation — 2026-08-10

- The current audit found four bounded failures. The derived-short Write surface now has its own shape selector and a no-visual escape path; every deterministic approval/render path shows `$0.00 local` beside its control; visual placement limits are enforced by the writer transaction and database index/triggers; and visual operations check publication state only for their exact output, so an unpublished current derived short remains available after its article has been recorded.
- Direct regressions were added before implementation: `local visual asset storage > enforces lead and supporting limits in the database even when a caller bypasses the service count`, `local visual asset storage > allows an unpublished derived-short visual lifecycle after its article has been recorded`, Playwright `lets an author replace a derived-short no-visual recommendation with its own selected shape`, and Playwright `keeps a saved derived short post independently editable and reviewable after article publication`.
- The direct regressions were observed failing before implementation, then passed: focused `lean-service` plus migration validation (2 files / 34 tests) and the targeted deterministic browser lifecycle. That second-remediation gate is superseded by the third-remediation evidence below.

#### Third independent-audit remediation — 2026-08-10

- The third audit found three bounded defects: refresh controls did not carry the deterministic cost next to their action, a supporting-only record could be projected as a lead, and migration 019 still allowed `maturity_path` in new visual-brief rows. Refresh rows now disclose `$0.00 local`; supporting recommendation requires an active lead brief and supporting rendering requires its rendered lead asset; the detail projection exposes only an actual lead as `visualCompanion` while retaining any legacy support only in the supporting collection; and migration 019 permits only `vertical_path` as a stored vertical grammar.
- Direct regressions added before remediation failed as expected: Playwright `keeps approved visual grammar immutable while exposing article support and derived-short visual lifecycles` received `Refresh this visualDownload PNG` with no cost; `local visual asset storage > requires a lead visual brief before a supporting brief can be requested`, `never projects a stored supporting-only asset as the lead visual`, and `rejects the legacy maturity_path value in visual-brief persistence` all failed; migration-schema inspection also found the forbidden value. The additional direct `requires the rendered lead asset before a supporting asset can render` regression proves the asset-level ordering guard.
- The third-remediation command evidence is superseded by the fourth remediation below.

#### Fourth independent-audit remediation — 2026-08-10

- The fourth audit found one compatibility defect: migration 019 intentionally leaves pre-Milestone-7 assets with `visual_brief_id = NULL`, but the lead-brief projection then hid them. The detail loader now has a deliberately narrow null-link fallback for an actual legacy primary asset. It never falls back to a modern supporting asset, and it never grants a legacy asset current brief authority. Write and Finalize retain the asset as a read-only downloadable record; they do not offer a broken refresh action without an approved linked brief.
- Direct regressions were added before remediation and failed as expected: `local visual asset storage > retains a pre-brief visual through the real detail route for Write and Finalize` initially received no `visualCompanion`; the populated migration regression now creates the asset before 019 runs and proves its retained null link and fields; and Playwright `keeps a legacy unlinked visual readable in Write and Finalize` proves the client renders the compatibility record without a refresh control in both stages.
- Command-derived local validation after this remediation passed: `npm run typecheck`; `npm run lint`; `npm test -- --run` (24 files / 110 tests); `npm run db:validate` (19 migration files, validate-only); `npm run build`; `npm run test:e2e -- --reporter=list` (19 deterministic production-mode flows); `npm run security:secrets` (132 source/documentation files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`. The scanner’s temporary `tsx` IPC was sandbox-blocked and then rerun unchanged through approved local execution. No provider was called and no meaningful local database migration was applied.

- Sol independently approved the complete Milestone 7 current diff after its fourth read-only remediation audit. The approval includes exact-output visual briefs, immutable reader contracts, local-only cost disclosure, SVG/PNG fidelity and physical text containment, lead/support cardinality and legacy compatibility, derived-short independence, Finalize preservation, safe local routes, and no-provider guarantees. The audit did not run suites, migrations, providers, or inspect private sources.

### Next milestone — 7.1 authoring and visual-revision hardening

- Manual use after Milestone 7 approval identified bounded follow-up work: the generated long draft may not visibly honor its selected word range; reader-facing prose must not leak truncated capture/reference scaffolding; proofread and reviewer failures need a clearer exact recovery path; and an author needs non-destructive lead-visual revisions. Supporting-visual authoring is deferred; the active flow will focus on one versioned lead visual per exact output.
- Milestone 7.1 is planned in `BUILD_ROADMAP.md` and its pre-change regression matrix is [MILESTONE_7_1_BLOCKER_MATRIX.md](docs/MILESTONE_7_1_BLOCKER_MATRIX.md). It is a new, independently audited hardening milestone; it does not alter Milestone 7’s approved disposition.

## Current checkpoint

**Milestones 0–5, the publication UX closure work, Capture-to-Develop, and the historical manual-first research capability are complete. Milestones 5.1, 6.2, and 7 are independently approved. Milestone 7.1 is next. `BUILD_ROADMAP.md` is the active plan. At the end of validation, no Git staging, commit, or push had occurred.**

### Current delivery snapshot — 2026-08-08

| Area | Current state | Evidence / next action |
|---|---|---|
| Product contract and queue | Complete | Milestones 0–1 remain the accepted lean single-user baseline. |
| Grounded Board and drafting | Complete | Milestone 2 deterministic provenance, BOK retrieval, voice boundaries, and injection containment remain covered. |
| Live routing and revision loop | Complete | Milestones 3–4 retain explicit cost caps, bounded repair, escalation records, versioned review, and advisory voice checks. |
| Publication formats and lifecycle | Complete | Milestone 5 plus this audit-gap checkpoint now cover LinkedIn-only and long-form-plus-LinkedIn exact-version workflows. |
| Publication UX audit-gap checkpoint | Complete | Details and validation evidence are recorded immediately below; an independent read-only audit or user acceptance is the next gate. |
| Capture-to-Develop UX checkpoint | Complete | Optional title, generated fallback title, direct transition to Develop, and regression coverage are complete. |
| Milestone 6 — research and evidence | Complete | Manual evidence, separate interpretation, source records, epistemic labels, injection signals, and explicit zero-cost local research briefs are test-ready. |
| Board and companion truthfulness closure | Complete | Run-status truth, exact companion-stage identity, scoped recovery route/cost, run-scoped provenance, editor refresh, visual disclosure, and provider-disabled Playwright are implemented. |
| Milestone 5.1 — reader-first output contract | Complete — Sol approved | Audience and long/short format contract; integrated exact-version proofread, conservative reservation, and direct boundary/browser regressions passed independent Sol read-only audit. |
| Milestone 7 — visual companions | Complete — Sol approved | Sol approved the local deterministic visual-brief lifecycle, exact-output assets, and Finalize preservation after four remediation audits. |
| Git release preparation | Intentionally open | No files were staged, committed, or pushed during this checkpoint. |

### Board and companion truthfulness closure — implementation complete, audit pending

- Board review completeness is now distinct from output-pair completeness. A successful LinkedIn recovery resolves only the Final Drafter output; any failed Strategist, Skeptic, Editor, or Synthesizer remains visible and keeps the Board incomplete.
- A stale LinkedIn companion refresh uses the configured low-cost Final Drafter route. A medium-tier action is visibly an author-selected escalation, records its reason, and is not used by an ordinary refresh. Both estimates use the saved canonical article, indexed voice reference, Final Drafter instruction, and 1,200-token output allowance rather than reviewer defaults.
- Displayed grounding provenance is now scoped by immutable `reviewRunId`; a later targeted companion recovery is recorded separately. Saved Board selection now uses the most recently completed eligible full run regardless of live versus deterministic mode.
- Workspace state resets the controlled companion editor after a scoped recovery only when it has no unsaved author edits. The Write screen labels the current SVG as a mutable draft asset; immutable visual revision history and publication linkage remain future visual work.
- Deterministic Playwright startup uses a temporary database and synthetic sources and explicitly blanks OpenAI, Anthropic, and ZenMux credentials.
- A failed full Board run is now selected and displayed after reload rather than falling back to an older completed run. Synthesizer failure is an explicit saved run failure and prevents a LinkedIn recovery from presenting the Board as complete.
- Retry and stale-refresh actions are locked to the configured low-cost Final Drafter route in both the route handler and service. Medium is available only through the explicit escalation action with a required, persisted reason.
- Failed scoped recovery is retained as separate history against the canonical source, even before a companion draft exists. The status surface reports that later failed attempt rather than only the original Board failure.
- New deterministic regressions cover Synthesizer failure persistence, mixed Board/companion truthfulness, failed-recovery reload history, low-versus-medium route enforcement, the actual 1,200-token LinkedIn estimate contract, and controlled companion-editor reset behavior.
- The roadmap now records this closure checkpoint ahead of **Milestone 5.1 — Reader-first output contract and integrated quality gate**. The lean scope retains the historical two-draft concern and documents the approved same-run dual-output decision as superseding timing.

### Closure follow-up remediation — 2026-08-09

- A persisted LinkedIn stage now represents only the exact child companion related to the displayed Board run’s generated canonical draft. If synthesis stops before drafting, the article and LinkedIn stages are explicitly `not_run`; an older companion cannot make that run look complete after reload.
- The exported scoped-recovery execution boundary enforces the same policy as the route: refresh and retry are low tier only; medium is valid only for an explicit escalation with a non-empty author reason. Successful escalation persists its recovery kind, tier, and reason for reload-safe provenance.
- The LinkedIn estimate regression now proves the saved canonical article, synthetic indexed voice reference, trusted Final Drafter instruction, 1,200-token output allowance, and bounded two-attempt reservation each contribute to the result.
- A deterministic browser regression exercises the actual controlled editor: a clean recovery response appears immediately, while a delayed action response received after the author begins typing leaves that wording untouched.
- Deterministic Playwright both blanks configured provider credentials and sets `EDITORIAL_TEST_DISABLE_PROVIDER_CALLS=1`; provider adapters reject any accidental live execution path during the browser suite.

Validation after the 2026-08-09 final remediation: TypeScript, ESLint, 24 test files / 111 tests, 16 validate-only migrations, production build, five isolated deterministic Playwright workflows, a 131-file secret scan, dependency audit with 0 vulnerabilities, and both Git diff checks passed. Tests used temporary databases and synthetic BOK/voice fixtures. No provider was called; no environment file, meaningful local database, backup, BOK, or voice skill was manually inspected, modified, or staged. The sandbox blocked `tsx` temporary IPC sockets, so validate-only migrations, production build, security scan, dependency audit, and browser E2E were rerun through approved local execution. Next action: one narrow independent Sol audit of this closure diff before starting Milestone 5.1.

### Final closure remediation — 2026-08-09

- In-flight action responses reconcile against ref-backed current companion state, so wording typed after a request starts is retained.
- The saved Board summary now marks both article and LinkedIn drafting `not_run` if Synthesizer failed before drafting; deterministic and live request failures terminalize their in-page progress from the persisted failure where available.
- The production recovery execution boundary validates the configured Final Drafter provider, model, pricing assumption, and maximum cap. Arbitrary injected routes exist only in a test-runtime seam. Medium work requires an explicit `escalation` kind and a non-empty reason.
- LinkedIn estimates are labeled conservative reservations because their input sizing uses character-derived token bounds.

This remains an implementation disposition pending one fresh independent audit before Milestone 5.1.

### Run-truthfulness remediation — 2026-08-09

- Terminal Board stages now use exact persisted role attempts. If every reviewer fails, Synthesizer, article drafting, and LinkedIn drafting are all rendered as `not_run`, rather than waiting or completed.
- The historical Board companion identity is scoped to the exact Board run through its persisted model-call metadata. A later scoped recovery or author edit cannot replace the companion identity recorded for the original run.
- Scoped recovery has a distinct progress identity. A successful recovery is labeled as a LinkedIn recovery rather than a completed Board; a persisted provider failure is distinct from a route, policy, configuration, or cap rejection before provider dispatch. Only the former records failure provenance.
- The scoped LinkedIn estimate now includes the same fixed request framing/schema allowance as its execution reservation.
- New integration and deterministic browser coverage exercise all-reviewer failure, run-scoped companion identity after author editing, actual scoped recovery progress, and pre-dispatch rejection without fabricated provenance.

Validation after this run-truthfulness remediation: TypeScript, ESLint, 24 test files / 112 tests, 16 validate-only migrations, production build, seven isolated deterministic Playwright workflows, a 131-file secret scan, dependency audit with 0 vulnerabilities, and both Git diff checks passed. Tests used temporary databases and synthetic BOK/voice fixtures. No provider was called; no environment file, meaningful local database, backup, BOK, or voice skill was manually inspected, modified, or staged.

This remains an implementation disposition pending one fresh independent audit before Milestone 5.1.

### Capture-to-Develop and Milestone 6 checkpoint — completed 2026-08-08

- Inbox capture now accepts an optional author title. If blank, the existing concise local title suggestion remains the saved title. Saving opens the new idea directly in Develop, where the title remains easy to edit and persists across reload.
- Develop now includes optional **Research and evidence**. Author-provided evidence is stored separately from interpretation, with bounded source title, HTTP(S) URL, publication date, excerpt, and epistemic label fields.
- The explicit **Prepare research brief** action records a zero-cost local planning brief, question, time window, tool identity, and injection signals. It clearly states that it does not browse the web, assert market awareness, or add sources automatically.
- Source excerpts and evidence summaries cross the existing untrusted-content boundary. Instruction-like source material is recorded as a signal; it is displayed as text, never executed or treated as a command. `javascript:` URLs are rejected.
- Migration 014 was applied only after owner-only backup and restore verification: `data/backups/ai-editorial-board-remediation-20260808T232103608Z.sqlite`.

Validation: TypeScript and ESLint passed; 22 test files / 86 tests passed; 14 migrations validated; production build passed; two deterministic Playwright flows passed; secret scan and dependency audit passed with no findings; `git diff --check` passed. No live model provider was called.

Remaining limitation: this milestone intentionally provides manual research and a bounded local research-planning action. It does not fetch the web or claim to cross-check current market information until the owner selects and configures an explicit external research connector.

### Planned Milestone 6 follow-on — approved visual brief

- The next bounded addition is a visual-brief selection step: recommend no visual or one appropriate explanatory grammar, let the author edit the message, claims, labels, caption, and alt text, then require explicit approval before rendering.
- Initial selection will be transparent and local-first. A low-cost model may later offer an explicitly requested, advisory visual brief bounded to the saved draft and approved BOK/research claims. No image-generation tool is required for this step.
- Deterministic diagrams remain the default for factual frameworks. Character illustrations and other generative imagery are deferred to optional Milestone 7 work.

### Post-checkpoint writing polish — 2026-08-08

- **Complete — dual-output model drafting:** a selected Medium/Substack plus LinkedIn plan now creates both outputs in the same Editorial Board run. The Initial Drafting Agent produces the 3–4 minute canonical article; the low-cost Final Drafting Agent produces a source-linked standalone 160–240-word LinkedIn post. Its separate model call, version relationship, and provenance are recorded, and the live upper-bound estimate includes all six planned calls. The old local-template creation control and API action are unavailable in the normal flow; historic incomplete pairs direct the author to rerun the Board.

Validation: TypeScript, ESLint, 23 test files / 94 tests, 16 migrations validated without applying them, production build, and two deterministic Playwright flows passed. Secret scan covered 126 source/documentation files; dependency audit found 0 vulnerabilities; `git diff --check` passed. No external model provider was called.

- **Final-drafter reliability repair:** generated publication text is now deterministically normalized for the explicitly prohibited em dash before the final voice check and exact-version persistence. The UI and provenance now preserve safe, actionable execution categories for provider request rejection, refusal, output limits, missing output, invalid structured output after the bounded repair, publication-format or voice-rule failure, safe-save failure, and unknown local execution failure. Every category states the preserved work and next action; raw provider bodies, prompts, credentials, and filesystem details remain withheld. The normalizer is deliberately limited to punctuation; it does not add claims, generate content, or call a model. Regression coverage proves a dual-output run completes and persists an em-dash-free LinkedIn companion when the synthetic final drafter returns an otherwise valid response with that punctuation, and that a safe detailed final-drafter failure reaches the route boundary.

Local validation after this repair: TypeScript, ESLint, 23 test files / 97 tests, production build, and `git diff --check` passed. No external provider was called.

- **Scoped recovery:** an incomplete dual-output Board run now presents its final-drafter failure directly under the Editorial Board run status, above the brief. The recovery action retries only the missing LinkedIn post from the exact saved canonical article. It has a separate low-tier route, displayed estimate, per-run cap, exact model-call provenance, and one immediate transaction for draft, approval, and relationship persistence. It cannot rerun completed reviewers, synthesis, or the canonical drafter, and it cannot overwrite a current companion.
- **Execution diagnostics and retained status:** `src/editorial/grounded-run.ts` now writes a redacted, structured `failureDiagnostic` into failed model-call provenance: failure code, provider/model route, safe HTTP/provider category where available, raw-error-storage flag, and a correlation fingerprint. `app/queue-client.tsx` renders the most recent persisted final-drafter failure rather than an older Board memo and reconstructs the saved stage summary after a reload. No raw provider response, prompt, credential, private source text, or filesystem detail is stored or displayed.
- **Final-drafter output limit correction:** the low-cost final drafter’s bounded output allowance is 1,200 tokens, up from 700. This still targets a 160–240-word LinkedIn post, but reserves enough room for the provider’s structured response and managed reasoning budget. The existing cumulative cap and displayed estimate apply to the larger bounded request; no other Board role changed.
- **Final-drafter request correction:** both the normal dual-output path and its scoped retry explicitly request `low` reasoning effort for the final drafter. This is recorded in the request contract and covered by the grounded run test. It prevents a short, structured adaptation from spending its bounded output budget on unnecessary deep reasoning.
- **Final-drafter repair-schema correction:** the bounded structured-output repair now treats `final_drafter` as publication output (`role`, `body`, `factual_gaps`, and `voice_rules_applied`), not reviewer output. A regression simulates a malformed first LinkedIn response, verifies the one bounded repair receives the correct shape, and persists the repaired companion. This fixes a deterministic repair-path defect discovered during live validation.

Audit traceability for this stabilization work: `tests/integration/grounded-editorial-run.test.ts` covers punctuation normalization, lowercase-provider safe failure handling, and one-call companion recovery; `tests/unit/local-request.test.ts` covers preservation of safe recovery guidance at the route boundary. The final full audit must verify the displayed retry estimate, exact canonical-source identity, durable failure diagnostics, reload behavior, and no raw-error leakage.

Approved follow-on — governed recovery: allow one automatic technical retry inside the already approved cap, then require an explicit human decision based on the safe diagnostic. The author can choose a bounded token increase or one-role next-tier escalation; no successful stage reruns and no frontier escalation occur automatically. This is planned after the current final-drafter stabilization test and must receive route/service/browser regressions before being enabled.

Approved routing follow-on — model independence: configure the Synthesizer independently from the reviewer majority and Final Drafter independently from Synthesizer where provider/model availability and the run cap permit. This supplements, rather than replaces, source-grounding and evidence-boundary checks. The live run plan will disclose any same-provider fallback.

- LinkedIn companion reviews now pair each open item with a plain-language **Suggested next edit**. Optional companion polish uses the same current-versus-suggested comparison and explicit apply control as the primary draft.
- Companion typography now uses the same body scale and supporting-text scale as the primary Write surface.
- The local Skeptic checklist now distinguishes an actual missing safeguard from an optional improvement: no boundary and no illustrative support is **Needs revision**; either one alone is **Review**; both are **Pass**. Its text now says exactly which signal is missing.
- Draft and LinkedIn review surfaces now use a neutral reading background. Individual outcomes use compact colored text labels: green **Pass**, amber advisory **Review**, and a restrained attention color for **Needs revision**. A ready overall review no longer looks like every individual check passed.
- Visual companion selection is local and author-controlled: **Decision fork**, **Contrast**, or **Simple flow**. The app does not make a model call or invent claims. For activity-versus-maturity content, contrast is the automatic fallback; an author can explicitly choose the decision fork when the post itself supports the managed-versus-unmanaged argument. Migration 016 adds these saved template identities while preserving existing visual records and paths; it requires the normal owner-only backup then explicit `db:migrate` step before use with the local database.
- Validation passed: TypeScript, ESLint, focused unit/integration tests (24 tests), deterministic Playwright (2 flows), and `git diff --check`. No provider was called.

### Follow-up exact-version remediation — completed 2026-08-08

- Publication now requires an exact current draft ID, stored format, platform, and byte-for-byte matching text. Finalize cannot create or edit a draft, and `publishIdea()` contains no draft-creation fallback.
- Draft review and final voice checks resolve the exact current saved draft and validate its stored format against the publication plan. A stale/unlinked companion is rejected.
- The generic draft-save path rejects `linkedin_companion`; companions can be saved only through the relationship-preserving companion action.
- Publication, publication provenance, and idea status are committed atomically. A forced provenance failure regression proves that all writes roll back together.
- Queue movement rejects a published selected idea. Moving an unpublished idea changes only that idea's priority, so an adjacent published record remains untouched.
- Live Board and targeted live-review wrappers check the published-workflow lock before model configuration or provider construction.
- The dual-output browser flow now proves that, after canonical publication, the unpublished companion can still be edited, saved, reviewed, voice-checked, and published independently.

Follow-up local-only validation:

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 21 files / 78 tests passed
- `npm run db:validate` — 12 migrations validated; none applied
- `npm run build` — passed
- `npm run test:e2e` — 2 deterministic browser flows passed
- `npm run security:secrets` — 122 source and documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `git diff --check` — passed

### Publication UX audit-gap checkpoint — completed 2026-08-08

- **Dual-output sequencing:** the canonical article cannot be recorded as published until a current LinkedIn companion exists. The companion remains independently editable, reviewable, voice-checkable, and publishable until its own record is created.
- **Published-history locks:** a central service assertion blocks development changes and all Board reruns after any publication. Exact-output service assertions block editing, saving, review, voice checks, visual creation or refresh, and duplicate publication for a published version. The UI reflects those locks, including title and queue-priority controls.
- **Exact-version voice check:** `/api/voice-check` now requires the local request boundary plus the current idea ID, draft version ID, and format. It cannot check an older or published output.
- **Execution clarity:** the free deterministic action is explicitly labelled **$0.00 · no provider call** and states that it does not use or validate the live-run budget cap. Live-run warnings are labelled as live-provider-only.
- **Terminology:** active stage/navigation language reads **Develop → Editorial Board → Write → Finalize**; saved draft artifacts retain the word “draft” where it is accurate.
- **Content-index resilience:** the local BOK index now safely reuses a prior section identity when a previously indexed source version is restored. This was found by the malicious-retrieved-BOK regression and prevents a restored source from leaving the current index unavailable.

Validation completed without any provider call or environment-file access:

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 21 files / 75 tests passed
- `npm run db:validate` — 12 migrations validated (validate-only; no migration applied)
- `npm run build` — passed
- `npm run test:e2e` — 2 deterministic browser flows passed: LinkedIn-only and Medium-plus-LinkedIn independent finalization
- `npm run security:secrets` — 122 source and documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `git diff --check` — passed

Decisions and remaining limitations:

- Recommendation dispositions and escalation assessments are immutable once any output has been published; they are treated as part of the published workflow history rather than editable retrospective annotations.
- The coarse `ideas.status` still becomes `published` after the first record. Dual-output progress is intentionally derived from immutable version-linked publication records (`1 of 2 published`, then `2 of 2 published`).
- The current visual implementation is tied to the canonical/primary exact draft. Platform-specific visual variants remain Milestone 7 work.
- No BOK, voice skill, local database, backups, environment file, secret, user-owned PDF, image, archive, or unrelated working-tree file was modified by this checkpoint.

### Historical publication UX follow-up audit — originally open 2026-08-07

- Verdict: remediation is still required before Milestone 6.
- A dual-output plan can be stranded if the canonical article is published through direct Finalize navigation before a current LinkedIn companion is prepared; Write then disables companion creation because the primary article is published.
- Published-output locks are not consistently enforced below the idea route. Direct service calls can still run Board/reviewer workflows or mutate development/status metadata after publication.
- Targeted reviewer reruns and optional polish actions remain active in parts of the published UI. Recommendation-disposition and escalation-assessment behavior after publication needs an explicit retrospective-annotation decision.
- The final voice-check block is client-side; the pure local endpoint is not exact-version aware.
- The free deterministic test is functionally separate from live execution, but its placement beneath live budget warnings can make the warning appear applicable to the free test.
- Existing exact-version publication, format/platform matching, stale-companion rejection, read-only Finalize previews, prompt boundaries, and the full-size LinkedIn editor were confirmed as strengths.
- The required fixes, acceptance criteria, and regression suite are now recorded in `BUILD_ROADMAP.md` under **Required publication UX audit-gap checkpoint — before Milestone 6**.
- No application code, local data, BOK content, voice skill, environment file, or secret was changed during the audit or this documentation handoff.

### Follow-on writing and publication locks — 2026-08-07

- The LinkedIn companion now has a full-size, typography-aligned writing surface with the same clear saved-version behavior as the primary article editor.
- A publication record now locks that exact output in the UI and local service: editing, saving, draft review, human-voice checks, visual creation or refresh, duplicate publication, and any Editorial Board rerun are blocked. Published text, review history, and provenance remain viewable.
- The lock is output-specific in a dual-output plan: an unpublished companion remains independently publishable until it receives its own publication record.
- Validation without provider calls: `npm run typecheck`, `npm test -- --run tests/integration/lean-service.test.ts` (11 tests), `npm run lint`, and `npm run test:e2e -- --reporter=line` (2 browser paths) passed.

### Publication UX remediation checkpoint — 2026-08-07

- The persistent idea workflow now reads **Develop → Editorial Board → Write → Finalize**. It retains the existing URL structure for compatibility while replacing the misleading Draft and Publish labels.
- Write is the only content-authoring surface. For a long-form-plus-LinkedIn plan it shows the canonical Medium/Substack article first, then its LinkedIn companion, with separate saved-version, review, and stale-state feedback.
- The explicit action **Create LinkedIn version from Article vN** both records the exact canonical source confirmation and creates the companion. It is not a publication approval gate.
- Each output has an exact-version final draft review. Canonical edits stale a linked companion; companion edits invalidate only companion-specific checks.
- Finalize contains read-only previews, separately scoped human-voice checks, and separately scoped publication records. It has no text editor or content-generation action. The visual remains read-only in Finalize and is created or refreshed in Write.
- The client now sends exact draft version, draft format, body, and fixed platform for every publication record. The service rejects platform/output mismatches and stale or non-current drafts.
- Recording one output leaves the other independently visible and publishable; the Finalize stage shows `1 of 2 published` or `2 of 2 published` from the stored version-linked records.
- The deterministic test provider now normalizes retrieved Markdown before using it in a plain-prose test draft, avoiding a false structured-output failure when BOK passages contain formatting.

Validation without provider calls:

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test -- --run` — 21 files / 69 tests passed
- `npm run db:validate` — 12 migrations validated
- `npm run build` — passed
- `npm run test:e2e` — 2 deterministic browser paths passed: LinkedIn-only and Medium-plus-LinkedIn finalization
- `npm run security:secrets` — 122 source and documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `git diff --check` — passed

Remaining limitations / technical debt:

- The human-voice check is intentionally local, pre-publication state. It is re-run after a reload until the publication record persists its acknowledged result as provenance.
- The internal `ideas.status` becomes `published` after the first recorded output. The Finalize stage therefore uses version-linked publication records, rather than that coarse status, to show dual-output progress.
- Medium/Substack-plus-LinkedIn has full browser coverage. The matching Substack relationship and independent record path is covered in the service suite; a separate Substack browser test remains optional redundancy.

### Required audit remediation checkpoint — 2026-08-07

- Every state-changing API route applies loopback, JSON content-type, origin, and cross-site request protection, with regression coverage.
- Idea reads and live-run previews now use a read-only database path; normal page load and preview do not refresh or index BOK or voice-skill content.
- Final-review recommendation dispositions survive reload and remain visible in the user-facing review.
- Committed run-budget fallbacks are USD 0.05 normal and USD 0.25 maximum.
- Migrations 009 (reviewer escalation outcomes) and 010 (fresh local workspace seed) were applied only after verified, owner-only SQLite backups and restore-copy checks. Ten migration files now validate.
- A single reviewer can be explicitly escalated and compared with its lower-cost output. The user can record whether the result was accepted, influenced the draft, and materially improved it; high-tier reruns require explicit confirmation and no automatic escalation occurs.
- Visual artifacts and downloads use `data/<title-name>/draft_<number>_<datetime>.svg`.
- Validation without provider calls passed: TypeScript, ESLint, 21 test files / 64 tests, migration validation, production build, deterministic Playwright, secret-pattern scan, dependency audit (0 vulnerabilities), and `git diff --check`.
- No BOK or voice-skill source was modified. No environment file or key was opened, printed, created, or changed. No model provider was called.

### Remaining release-gate work

- Do not treat this as a complete release gate: additional hostile-content coverage, permission/history scanning, backup rollback exercise, production-mode browser verification on port 3100, and exact staging-set review remain Milestone 9 work.
- Historical note (2026-08-07): Milestone 5 was completed immediately after this checkpoint; at that time, Milestone 6 was the next feature milestone. This statement is superseded by the current Milestone 5.1 gate at the top of this document and in `BUILD_ROADMAP.md`.

### Milestone 5 — Publication formats and LinkedIn companions — 2026-08-07

- Completed the local publication-format vertical slice. LinkedIn-only retains the short standalone draft; Medium and Substack plans create a canonical long-form draft; Medium/Substack-plus-LinkedIn plans create that canonical article first.
- The author must explicitly approve the exact canonical draft version before a deterministic LinkedIn companion can be generated. The companion is a separate draft record linked to its canonical source, not a second rendering of the same text.
- A canonical edit saves a new canonical version and marks the earlier companion stale. A stale or unlinked companion cannot be published; the author must approve the current canonical version and generate a replacement.
- Publication accepts a selected exact draft version and platform, so canonical articles and LinkedIn companions can be recorded independently while retaining their relationship and version history.
- Migration 011 was applied after owner-only backup `data/backups/ai-editorial-board-remediation-20260808T041756142Z.sqlite` passed integrity and temporary restore-copy validation. Eleven migration files validate.
- Validation without provider calls: TypeScript, ESLint, 21 test files / 66 tests, production build, deterministic Playwright LinkedIn and long-form companion flows, secret-pattern scan, dependency audit (0 vulnerabilities), and diff checks all passed.

Historical note (2026-08-07): Milestone 5 was complete and Milestone 6 (research and evidence handling) had not started. This statement is retained as evidence and is superseded by the current Milestone 5.1 gate.

`AI_Editorial_Board_Spec.md` remains unchanged. The accepted lean direction is in `LEAN_PRODUCT_SCOPE.md`, and `BUILD_ROADMAP.md` is the active milestone sequence. Queue capture, themes, drafts, draft versions, review-history persistence, a final explainable AI-pattern check, and publication records are implemented. The visible grounded Board and drafting path receives selected BOK passages and the configured voice skill. It can run deterministically for local testing or, when the local server has `OPENAI_API_KEY` and configured model IDs, run through the explicit finance-first OpenAI route with a conservative pre-execution estimate and cumulative budget cap.

### Independent completeness audit — 2026-08-07

- Verdict: usable local LinkedIn beta; not yet the roadmap-defined local personal MVP.
- Required before Milestone 5: protect every mutating route, fix recommendation-disposition hydration, make live preview/index checks read-only, align committed budget fallbacks, verify a current backup and restore, complete escalation learning, reconcile documentation, and review the exact Git staging set.
- Milestone 5 and the Milestone 9 release gate remain incomplete.
- The current narrow visual slice is not full Milestone 7. The agreed artifact path is `data/<title-name>/draft_<number>_<datetime>.svg`, with no directory per version.
- This audit did not read environment files, modify application code or data, touch the BOK or voice skill, or call an external provider.
- All dated provider-routing and verification entries later in this document are historical implementation evidence. When they conflict with this checkpoint, this checkpoint and `AUDIT_2026-08-07.md` are authoritative.

### Live execution safety and finance checkpoint — 2026-08-07

- The committed provider policy is OpenAI for all three capability tiers. Model identity remains runtime configuration: low `gpt-5-nano`, medium `gpt-5.6-luna`, and high `gpt-5.4-mini` are the recommended values. Anthropic and ZenMux adapters remain available but are not automatic fallbacks.
- GPT-5 nano remains the low tier for future simple intake, title, and classification work. Strategist, Skeptic, Editor, Synthesizer, and Initial/Final Drafting use medium-tier GPT-5.6 Luna after live evidence showed nano exhausting its reviewer output allowance on reasoning without producing validated JSON. High remains restricted to an explicitly confirmed, reason-recorded single-reviewer escalation.
- The normal default cap is USD 0.05 and the server maximum is USD 0.25. Every actual request, including the one bounded structured-output repair, is checked against remaining cumulative budget before dispatch.
- OpenAI reasoning-token detail is tracked but not billed twice because provider output-token usage already includes reasoning tokens.
- Every attempt persists its actual provider, model, tier, request ID when available, token usage, latency, estimated cost, retry state, safe failure category, and reserved maximum. Failed drafting and synthesis paths terminate the run instead of leaving it marked running.
- All model inputs, including BOK passages, voice guidance, user text, reviewer output, and repair material, cross explicit untrusted-content boundaries. Provider requests expose no tools, use no browser credentials, and disable response storage where supported.
- The primary idea-detail mutation route requires local loopback JSON requests and rejects browser-reported cross-site requests. The independent audit found that the remaining state-changing routes still require equivalent protection. UI progress labels describe planned execution stages, not hidden reasoning or fabricated live events.
- Root `AGENTS.md` now makes these build and validation controls mandatory for every coding model working in the repository.

Validation completed without any external model call:

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 19 files and 48 tests passed
- `npm run build` — passed
- `npm run test:e2e` — passed the full deterministic browser flow, including hostile HTML, CSS, script, and `javascript:` payload containment
- Focused routing and cumulative-budget tests — 5 tests passed after the final tier assignment
- `git diff --check` — passed

First bounded OpenAI smoke-test finding and remediation:

- The provider completed the initial requests, but the raw REST adapter read only the SDK convenience field `output_text`. Actual Responses API content arrived in message items under the `output` array, so valid responses were incorrectly classified as empty.
- The failed run terminated correctly and did not present editorial output as successful. Attempt records identified the actual OpenAI models and retained conservative cost reservations without storing prompts or credentials.
- The adapter now extracts `output_text` content from raw response message items, retains compatibility with the convenience field, and recognizes explicit refusal items. Safe user-facing errors now include empty-output and refusal categories without exposing provider payloads.
- Regression tests use the raw Responses API shape. Focused provider/routing/request-safety tests, TypeScript, lint, and a production build pass after the correction. No additional provider call was made during remediation.

Second bounded OpenAI smoke-test finding and remediation:

- Raw response extraction succeeded. GPT-5.6 Luna synthesis and drafting completed with recorded usage, while all three GPT-5 nano reviews were incorrectly rejected after response receipt.
- OpenAI resolved the configured nano alias to a dated snapshot identifier. The route guard then compared the provider-reported snapshot string with the requested alias and interrupted cost accounting before usage and local structured-output validation could be persisted.
- Authorization and pricing now use the exact server-selected request model/provider/tier. The provider-reported resolved model is retained separately in provenance, so snapshot resolution cannot change or bypass routing policy.
- A regression test proves that a resolved snapshot identifier is preserved while both conservative and actual estimates remain tied to the configured alias. Seventeen focused provider, budget, and grounded-run tests, TypeScript, lint, and the production build pass. No additional provider call was made during remediation.

Third bounded OpenAI smoke-test finding and finance decision:

- With snapshot handling corrected, all three GPT-5 nano reviewers reached the 896-token output boundary using those tokens as reasoning and returned no final structured review. Each attempt cost about USD 0.00037. Luna synthesis and drafting completed for about USD 0.0015 combined, but correctly disclosed that no reviewer analysis was available.
- Nano is therefore a false economy for the Board contract. It remains configured for future bounded intake/classification work, while the three reviewers now join synthesis and drafting on GPT-5.6 Luna. Based on observed usage, the expected complete Board remains around half a cent and well below the USD 0.05 default cap.
- A full run now stops before synthesis and drafting if zero reviewers produce validated output. One or two successful reviewers may still produce explicitly partial output; zero successful reviewers can no longer create a polished but unreviewed draft.
- The normal live-run path no longer overrides the Strategist back to low tier. Twenty-three focused routing, budget, grounded-run, and service tests, TypeScript, lint, and the production build pass. No additional provider call was made during remediation.

The filesystem-backed **Editorial Notebook** is complete: it has a persistent navigation entry, a local Markdown working copy, immutable timestamped snapshots on explicit save, owner-only file permissions, Git ignore protection, and an initial template based on the five public editorial themes.

### Stage-focused idea workspace — 2026-08-07

- The former long review page is split into four URL-backed stages inside the persistent application shell: Develop, Editorial Board, Write, and Finalize. The legacy `/review` URL redirects to the Board stage.
- A compact stage navigator retains idea context and shows review, draft-version, and publication readiness indicators. Only one stage’s working surface is visible at a time.
- The Board stage contains the run control, concise editorial brief, optional reviewer details, and compact run provenance. Model assignments, pricing assumptions, deterministic testing, BOK passages, checksums, token usage, cost, and latency remain available through progressive disclosure rather than occupying the writing flow.
- The Draft stage contains the editor, latest draft review, a compact editorial-brief reference, and collapsed version-linked history. Historical reviews no longer appear inline as if they applied to the current draft.
- The Finalize stage contains the saved-draft preview, final voice-pattern check, and publication record. Publication controls no longer appear on the Board or Write stage.
- A zero-reviewer live failure now stops before synthesis and drafting. Historical partial drafts remain preserved but display an explicit incomplete-review warning.
- Live runs expose real persisted operational stage status through local polling: context preparation, each reviewer, synthesis, drafting, and provenance. The UI explicitly distinguishes these events from private model reasoning.
- No schema migration or data reset was required. BOK and voice-skill source files were not modified.

Validation at this checkpoint:

- TypeScript — passed
- ESLint — passed
- Full unit/integration suite — 19 files and 50 tests passed
- Production-like Playwright workflow — passed across Develop, Board, Write, Finalize, final voice check, publication, hostile-text containment, and provenance disclosure
- Production build — passed with all four idea-stage routes
- Six migration files — validated
- Secret-pattern scan — 115 source and documentation files passed
- Dependency audit — 0 known vulnerabilities
- `git diff --check` — passed
- The in-app browser was unavailable in this session, so a separate manual visual-spacing pass remains for the user test checkpoint; no visual inspection is claimed.

### Provider-routing refinement — 2026-08-07

- The committed, non-secret policy in `src/config/model-routing.ts` routes low-tier editorial work to ZenMux, the working draft to medium-tier ZenMux, and high-tier escalation to direct Anthropic. Roles remain independent from vendors and model identifiers.
- `.env.local` is the local, Git-ignored configuration template. It contains blank key fields and model-ID fields only; it was not committed and contains no credential value. `ZENMUX_API_KEY`, `ZENMUX_LOW_MODEL`, and `ZENMUX_MEDIUM_MODEL` are sufficient for a normal live Board run. `ANTHROPIC_API_KEY` and `ANTHROPIC_HIGH_MODEL` are needed only before selecting a high-tier rerun.
- The live-run preflight now lists every planned role/provider/model. The Board dispatches each call to its selected provider server-side, with no enabled tools, browser-side key exposure, or automatic high-tier escalation.
- Focused validation passed: TypeScript, lint, 14 provider/routing/grounded-run tests, and the production build. No live request was made.

### Live-provider verification pause — 2026-08-07

- Live testing is paused by user decision until an independent read-only verification pass is complete. No further provider calls should be made during that pass.
- Direct minimal smoke checks established that the configured ZenMux free GLM endpoint and Anthropic Haiku 4.5 key/model can accept their respective basic requests. Those checks contained fixed text only and did not send an idea, BOK passage, voice skill, or secret.
- The normal live Board was changed to use direct Anthropic Haiku for low and medium tiers, with direct Anthropic Sonnet 4.5 reserved for high-tier escalation. The active terminal environment had previously overridden `.env.local` model values; local configuration now requires clearing stale exported model variables before server restart.
- Anthropic’s native structured-output schema rejects numeric `minimum`/`maximum` constraints. The outbound schema was corrected while local Zod confidence validation remains intact. The attempted `maxItems` output bound was rejected by Anthropic and was reverted.
- A new live run accepted the revised Anthropic schema but hit the configured response output limit during reviewer generation. Output-limit handling and the review-output contract need independent review before retrying.
- Failure persistence was corrected so future failed live calls record their actual attempted provider/model rather than a misleading `grounded-test` fallback. Existing historical failed rows remain unchanged.
- The visible “Running the live Editorial Board” panel currently reports request state and planned workflow only; it is not real per-agent streaming progress. Relocating it under the run control and adding honest stage events remain pending.

## Commit-preparation checkpoint — 2026-08-06

- The personal-workspace fast path is implemented: an Inbox capture can contain the full post idea, bullets, examples, links, and point of view; after opening it, the user can choose **Develop this idea** then **Create BOK-grounded draft** without answering clarification questions.
- Clarification questions remain available behind a collapsed, optional section. The later “Add what you know” area remains available for supplementary notes, but does not block drafting.
- New captures receive a concise local working-title suggestion. It ignores common capture metadata such as `Theme:` and `Platform:` and never uses the full capture body as the title; the user can edit it at any time.
- The active SQLite database was reset at the user’s request. It passes `PRAGMA integrity_check`, has 0 ideas and 0 publications, and has 6 applied migrations. The ignored, owner-only pre-clean backup is `data/backups/ai-editorial-board-pre-clean-20260806T164500.sqlite` (integrity `ok`; 5 ideas and 1 publication at backup time).
- The commit candidate stages only reviewed application code, migrations, tests, and project documentation. It explicitly excludes the user PDF, `archive/`, image asset, all local data/backups, BOK, voice skill, notebook content, secrets, and environment files. No commit or push has occurred yet.
- `docs/AGENT_SECURITY_GUARDRAILS.md` is the mandatory control set for future agent execution. `BUILD_ROADMAP.md` now requires it to be read and its injection, rendering, credential, provider, and evaluation gates to be met before any agent/provider/retrieval/research/rendering milestone can close.

### Commit-preparation validation

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — superseded by Milestone 3 validation below
- `npm run db:validate` — 6 migration files validated
- `npm run content:index` — BOK ready at `8279ba5bc0ad` with 41 sections; voice skill ready at `2fc0216ee211`; both read-only source locations unchanged
- `npm run security:secrets` — 98 source/documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `npm run build` — passed
- `npm run test:e2e` — passed the fast Inbox-to-grounded-draft path, draft review, voice-pattern check, and local publication record
- `git diff --cached --check` — passed

## Milestone 2 evidence

- The visible Editorial Board action now runs one ordered path: immutable development snapshot, selected BOK retrieval, independent Strategist/Skeptic/Editor reviews, Synthesizer, then Initial Drafting Agent.
- Added migration 006, which records execution mode and immutable editorial-run snapshots containing capture, notes, clarification answers, themes, publication plan, BOK version/checksum, voice version/checksum, prompt manifest, and generated-draft link.
- Each selected BOK section is stored with FTS relevance score and rank in `retrieval_records` before it appears in the provenance UI.
- The configured filesystem voice skill is loaded into the drafting instruction set and its exact version is attached to the generated draft and model-call record.
- The user interface now distinguishes a grounded deterministic test run from the earlier simulation and exposes selected passages, source versions, role/model assignments, and $0 pricing basis in an expandable panel.
- BOK refresh now preserves historically retrieved sections for immutable provenance while indexing and retrieving only the current source version.
- Independent reviewer failures are persisted, provided to the Synthesizer as explicit failures, and displayed as failures rather than being represented as successful output.
- The deterministic provider exists only for safe, repeatable local tests. It receives the bounded, source-grounded inputs and produces no paid calls; live provider routing remains deferred.

### Milestone 2 validation

- `npm run typecheck` and `npm run lint` — passed
- `npm test` — 13 files and 23 tests passed
- Grounded integration coverage verifies retrieval provenance, BOK/clarification-sensitive output, voice-skill inclusion, no-em-dash draft output, completed-review synthesis input, explicit partial failure, and prompt-injection containment.
- `npm run db:migrate` — applied `006_grounded_editorial_runs.sql` after verified backup; active database integrity is `ok`, with six migrations and the existing idea preserved.
- `npm run db:validate` — six migration files validated
- `npm run content:index` — BOK ready at version `8279ba5bc0ad`, 41 current sections; voice ready at version `2fc0216ee211`
- `npm run security:secrets` — 98 source/documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `npm run build` and `npm run test:e2e` — passed

## Milestone 1 evidence

- Repaired the workspace request contract: title saves, queue movement, and other detail actions now post the intended request body.
- Added a usable status selector for Inbox, Developing, Ready to review, Drafted, and Parked; title and status updates remain synchronized with the underlying content item.
- Preserved the first editorial brief as the initial baseline. The newest review for the current draft stays actionable, while earlier reviews are collapsed behind a prior-review count.
- Review runs remain immutable and are tied to the exact draft version assessed. Unsaved draft changes now visibly invalidate the displayed draft review and final voice-pattern check until the next saved version.
- Replaced inaccurate UI claims with explicit labels: the Board and its starter draft are deterministic simulation/test output, and related BOK passages are shown only as a search preview that the simulation did not use. The static simulated draft no longer uses an em dash.
- No migration was required. Existing local data remains compatible; no BOK or voice-skill source was modified.

### Milestone 1 validation

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 12 files and 18 tests passed, including ten version-linked simulated draft-review passes
- `npm run db:validate` — five migration files validated
- `npm run content:index` — BOK and voice skill ready; no source file changes
- `npm run security:secrets` — 95 source/documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `npm run build` — passed
- `npm run test:e2e` — passed capture, title edit, Parked/unpark, queue movement, simulated Board, draft saves, stale-review state, review history, voice-pattern check, and publication record

## Milestone 0 evidence

- ADR 0003 records the accepted lean local product contract and document precedence.
- The normalized theme vocabulary is: See through the AI hype; Understand the operationalization gap; Improve leadership judgment; Select the right work; Build, adopt, and operate with principles.
- Forward-only migration 005 updated the two existing local theme labels without removing any idea associations.
- `docs/LOCAL_BACKUP.md` documents a SQLite-consistent backup and safe restore process.
- `data/backups/ai-editorial-board-m0-20260806T132000.sqlite` passes `PRAGMA integrity_check`, contains six ideas and two publications, and has owner-only permissions. A separate restore-validation copy passed the same integrity and record-count checks.
- `docs/MILESTONE_0_INVENTORY.md` records commit candidates and local-only exclusions. No files are staged.

## Local test-data reset

After the Milestone 0 checkpoint, the active local database was replaced with a newly migrated empty database at `data/ai-editorial-board.sqlite`. It passes `PRAGMA integrity_check` and contains zero ideas, publications, and themes until the application first initializes its canonical starter themes. The pre-reset state remains recoverable in the ignored local backups `ai-editorial-board-pre-reset-20260806T133000.sqlite` and `ai-editorial-board-pre-reset-active-20260806T133000.sqlite`.

## Existing implementation available for reuse

- Local Next.js + TypeScript application bound to `127.0.0.1:3100`.
- SQLite database, SQL migrations, and repository/service boundaries.
- External, read-only BOK and `kk-spoken-voice` loaders with checksums and status information.
- Markdown heading parsing and SQLite FTS5 retrieval, so no embeddings are needed for MVP.
- Model provider interface and deterministic mock provider for tests.
- Prompt-injection boundary, structured-output validation/repair, input validation, secret scan, dependency audit scripts, and baseline tests.
- Draft/review/model-call persistence tables that can be reused or adapted through additive migrations.
- A final human-voice check that flags explainable AI-like writing patterns without claiming authorship; publication requires a check of the current draft.

## Existing implementation to refactor or hide

- Root dashboard and “Open workspace” route.
- Five-question, Content Intent Brief-first intake flow.
- Required branching workflow selection before normal editorial work.
- Default presentation of raw agent output.
- Enterprise-oriented configuration, analytics, and multi-user assumptions in the older scope.

## Historical roadmap snapshot — 2026-08-06 (superseded)

At the time this historical record was written, the planned next implementation milestone was Milestone 5: publication formats and LinkedIn companions. It is retained as implementation evidence only. The current active plan and gated next item are stated at the top of this document and in `BUILD_ROADMAP.md`.

### Milestone 3 evidence — 2026-08-06

- Provider keys are treated only as local server environment values. Their presence may be checked, but their values are never printed, stored, sent to the browser, added to SQLite, or committed. No paid provider request is made during implementation or validation.
- `src/ai/openai-provider.ts` is a server-only Responses API adapter. It sends no tools, disables provider response storage, uses strict JSON schema responses, and exposes only a safe error category/status to the UI.
- `src/ai/model-routing.ts` makes the low tier the default for all normal Board/draft roles; medium and high are configurable only by environment model/cost assumptions. The local assumptions are not provider invoices.
- ZenMux is the current live-test default by explicit user choice. Its OpenAI-compatible Chat Completions adapter uses `ZENMUX_API_KEY`, requires provider-qualified runtime model IDs rather than hard-coded catalog values, supplies no enabled tools, and persists normalized token/request telemetry. Unit tests verify request shape, fenced JSON parsing, and credential-safe errors. Direct Anthropic and OpenAI remain explicit configuration options.
- The live preview calculates a read-only preflight estimate from the relevant bounded BOK context. A run whose projection exceeds its cap fails before any provider request. Tests prove this block.
- A medium-tier Strategist, Skeptic, or Editor rerun is independently persisted and leaves the initial Board/draft intact. Its escalation reason, prior lower-cost model call, and projected escalation cost are recorded.

### Milestone 3 validation

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — 15 files and 30 tests passed, including live budget blocking, strict Responses request construction, safe provider error handling, and one-reviewer escalation preservation.
- `npm run db:validate` — six migration files validated
- `npm run content:index` — BOK ready at `8279ba5bc0ad` with 41 sections; voice ready at `2fc0216ee211`; source locations were read only and unchanged
- `npm run security:secrets` — 103 source/documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `npm run build` — passed
- `npm run test:e2e` — passed in production-like local browser flow; it verifies security response headers and the free deterministic path, without making a paid provider call
- `git diff --check` — passed

### Milestone 3 remaining limits / technical debt

- Actual billed cost is intentionally `NULL` until a provider supplies invoice-grade cost data; displayed and persisted values are operator-maintained estimates.
- The UI supports an explicit medium-tier one-reviewer rerun. High-tier reruns and accepted-output-improvement disposition are deferred to Milestone 4, where revision comparison is being built.
- Live execution has adapter-level tests but no paid integration test. A user-triggered run with the local key is the first live smoke test and should be watched for provider model availability/configuration errors.
- Browser hostile-text coverage currently relies on React plain-text rendering, CSP response headers, secret scan, and existing prompt-boundary tests; dedicated HTML/CSS/URL e2e cases remain a security-test expansion before research or rich Markdown is introduced.

### Resume note — live credential check

- Direct OpenAI live testing reached `429 credit_balance_exhausted`; Platform billing is separate from a ChatGPT subscription. ZenMux is now the preferred low-cost test route.
- No key value, response body, prompt content, or billable generation was recorded during implementation. Resume by setting a ZenMux key and model configuration through a secure terminal prompt in the same terminal that starts `npm run dev`, then retesting the live Board.

## Milestone 4 revision-readiness checkpoint — 2026-08-07

- A first local-only visual-companion slice is available in Write for framework-worthy posts. User approval is required through `Create visual companion`; it renders a deterministic, text-accurate SVG, saves it beneath the local database directory as `data/<safe-title>/draft_<number>_<datetime>.svg`, and records the metadata, caption, alt text, and exact draft version in SQLite. This is an intentionally bounded subset of future Milestone 8: it does not yet evaluate whether a post should receive a visual, provide editing, cite research claims individually, or call an image-generation provider.
- The local final draft checklist no longer displays its fixed confidence percentage. It reports `Pass`, `Review`, or `Needs revision`; the concise `Still open` section remains the source of concrete required edits.
- The Editorial Brief now separates the required decision path from supporting evidence. It presents four readable edit signals, a compact suggested-change panel, and one `Continue to Write` action. Detailed agent material is explicitly optional rationale; individual reviewer reruns are an opt-in escalation rather than an apparent requirement.
- Generated and published drafts now use a plain-prose contract for LinkedIn, Medium, and Substack. Markdown headings, lists, quotes, emphasis, code fences, and Markdown links are rejected from model output, flagged in the voice check, and blocked at publication until removed.
- A ready draft review now supplies at most three optional final-polish suggestions. Each suggestion preserves the exact current wording, proposes a replacement, explains the editorial reason, and can be applied independently.
- Applying a suggestion marks the draft unsaved and keeps the prior memo visible as stale, allowing several optional edits to be applied before saving one new version. Saving continues to create an immutable new draft version; prior review memos remain attached to the versions they evaluated.
- Low human-voice scores are explicitly non-blocking. A low result says `no revision required`; its findings are optional observations rather than another mandatory editorial loop.
- The live Editorial Board run-again control now derives its initial cap from the asynchronously loaded preview instead of retaining a stale `$0.50` client default. When disabled, it states whether the cause is an active run, unavailable provider route, invalid cap, maximum-cap violation, or an insufficient upper-bound reservation.
- The Develop page no longer exposes a general status dropdown. It has one explicit pause action, `Park this idea`; a parked item has one recovery action, `Return to Inbox`. All progression statuses remain workflow-managed.
- Original Board recommendations can now be explicitly recorded as `Resolved`, `Revised`, `Superseded`, or `Still open`. The application never claims a local checklist inferred that disposition from matching words in a draft.
- Publication reuses the current exact draft version when its text is unchanged, and stores the associated Editorial Board run, exact final-draft review when available, and the acknowledged final voice-check result in `publication_provenance`.
- No external provider call was made for this checkpoint. No BOK or voice-skill source was modified.

### Milestone 4 checkpoint validation

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test -- --run` — 19 files and 54 tests passed
- `npm run db:validate` — 8 migration files validated
- `npm run build` — passed
- `npm run test:e2e` — passed the complete local capture-to-publication browser flow with no provider calls
- `npm run security:secrets` — 118 source and documentation files passed
- `npm run security:audit` — 0 dependency vulnerabilities

### Current testing note

- Existing final-review memos remain immutable and therefore do not retroactively gain final-polish suggestions. Run the free local draft review once on the current saved draft after restarting the updated app to create an enhanced memo.

## Historical remaining-work list

1. Add explicit research modes and research artifacts, including the application research provider/tool boundary and cited-source UI.
2. Replace the deterministic local mock with configurable live model adapters and transparent routing/cost/budget controls.
3. Add explicit LinkedIn-companion generation for an approved Medium/Substack canonical draft.
4. Add basic manual post-publication feedback capture and a documented local SQLite backup/export action.
5. Add Notebook version browse, restore, comparison, and “send candidate post to Inbox” actions.
6. Expand the visual companion into a Board-recommended, editable visual brief with source-claim provenance, research/chart boundaries, and an optional approved image-generation provider where illustration genuinely adds value.

## Known risks to manage

- Preserve existing local ideas while changing statuses and workflow fields.
- Keep all BOK, voice-skill, research-page, and user-drafted text untrusted at model/tool boundaries.
- Keep research provenance and dates visible; do not imply comprehensive market coverage.
- Keep live-provider credentials out of source control, dotfiles, and the database.
- Validate UI state using production builds as well as development mode to avoid hydration/regression issues.

---

## Final pre–Milestone 6 closure checkpoint — 2026-08-08

Status: **implemented; awaiting independent read-only audit.** Milestone 6 has not started.

| Invariant / audit finding | Implementation | Regression evidence | Result / limitation |
|---|---|---|---|
| Exact-version publication and no duplicate record | `src/lean/service.ts` `publishIdea`; migration 013 unique draft index | `tests/integration/lean-service.test.ts` exact ID/text/format/platform/duplicate cases | Enforced in service and database migration; migration was not applied to local data. |
| Canonical-first companion sequencing | `publishIdea`; `app/queue-client.tsx` Finalize gating | Service companion-first rejection and dual-output Playwright flow | Companion publish is blocked until its exact canonical source is recorded; LinkedIn-only remains independent. |
| Dependency-aware immutability | `saveEditedDraft`, `runFinalDraftReview`, `checkExactDraftVoice`, companion save path | Service and browser post-canonical companion editing/publishing cases | Canonical changes are locked after any publication; the current unpublished companion remains usable after canonical publication. |
| Historical companion-first safety | `publicationIntegrityWarning`, `assertPublicationHistoryConsistent` | Historical raw-record fixture in service test | Inconsistent history is retained, displayed, and blocked from unsafe mutation; recovery is a new idea/revision. |
| Companion relationship identity | `assertCurrentCompanionRelationship`, `companionSource`; migration 013 single parent index | Generic-save, stale, unlinked, and cross-idea service/route tests | Format, source, content item, currentness, and parent cardinality are enforced. |
| Atomic companion and publication writes | Immediate transactions in create/edit/publish services | Forced approval, companion-draft, relationship, and provenance failures | No orphan approval, draft, relationship, publication, provenance, or status update remains after forced failure. |
| Published-workflow and queue locks | service-level workflow/exact-output guards; queue client disabled controls | Direct service/route tests and published UI browser test | All ordinary mutation routes lock after publication; narrow current-unpublished-companion exception remains. |
| Finalize clarity and source isolation | output-specific Finalize forms and voice checks; `playwright.config.ts` synthetic fixtures | Production-mode deterministic Playwright | Finalize is content read-only; companion action is disabled until canonical publication. Automated E2E startup explicitly indexes only synthetic sources. |

Validation passed: `npm run typecheck`; `npm run lint`; `npm test` (21 files / 82 tests); `npm run db:validate` (13 files, validate-only); `npm run build`; `npm run test:e2e` (2 deterministic production-mode flows); `npm run security:secrets` (124 files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`.

Private source contents and secrets were not manually inspected, exposed, copied, or modified. Automated tests used synthetic BOK and voice fixtures; no external provider was called. No migration was applied to meaningful local data. This closure pass did not stage, commit, push, or reset files; pre-existing staged and unrelated working-tree changes remain preserved.

Remaining technical debt: the new integrity migration requires the established owner-only backup and verification procedure before use against a meaningful existing local database; research, feedback, and full visual workflows remain future milestones.

## Approved post–Milestone 6 enhancements

1. **Queue-row deletion for unpublished ideas.** Add a compact trash control at the right edge of each queue row so an Inbox, Developing, Drafted, or Parked idea can be deleted without first opening its workspace. The action must require an explicit confirmation that identifies the idea, use the existing service/API deletion safeguards, remove all associated local workflow records atomically, and remain unavailable for published ideas. Published history is preserved.

## Live LinkedIn companion reliability follow-on — 2026-08-08

- Fixed the OpenAI structured-output routing defect that sent `final_drafter` calls the editorial-review schema. Final drafting now uses the narrow `final_draft` schema (`role`, `body`) in the OpenAI and shared provider-schema path; bounded repair expects the same shape.
- A successful scoped LinkedIn retry is now treated as recovery of the original run’s historical final-drafter failure. The old failed call remains visible in provenance, but the current Board status reloads as complete when a current, non-stale companion exists for the canonical article.
- Write-stage readiness now distinguishes unsaved article edits, unsaved LinkedIn edits, a missing companion, and a genuinely stale companion. A successful Board run or LinkedIn save resets the companion editor’s local dirty state, so a newly saved matched pair can proceed to Finalize without a misleading stale-output warning.
- The dual-output resolver now prefers a companion explicitly linked to the current canonical article over an unrelated historical companion. This prevents an older stale record from hiding a newly generated matched pair; when no matching companion exists, the latest historical companion remains visibly stale rather than being silently rewritten.
- When a canonical article is intentionally revised, Write now offers an explicit, separately costed **Refresh LinkedIn from Article vN** action. It calls only the final drafter against the saved article, preserves the Board brief and canonical output, and requires the user to initiate the paid call. Identical article saves are no-ops, preventing accidental version churn and avoidable companion staleness.
- Editorial Board now retains a compact saved stage summary after reload for completed as well as incomplete runs. When a later canonical edit makes an originally completed LinkedIn output stale, the summary says so explicitly rather than implying the Board itself failed.
- Approved next quality gate: integrate a low-cost, structured Proofread and clarity role into the existing **Run draft review** action in Write, rather than adding a second proofreading button. The combined review will be required for each exact saved output before Finalize; the author must resolve or explicitly dismiss material spelling, grammar, punctuation, and clarity findings. It will never modify text automatically or replace author judgment. This work is not yet implemented; Sol will audit the interaction design before it is built.
- The same combined check will be included in **Run LinkedIn review** for the exact saved companion version. Article and LinkedIn review/proofread states remain independent.
- Approved follow-on: platform delivery profiles for LinkedIn, Medium, and Substack. The current implementation distinguishes formats and length but does not yet provide a full platform-audience prompt/review contract. Profiles will adapt delivery while retaining a common, evidence-grounded thesis and the authoritative kk-spoken-voice style.

## Approved cosmetic consistency backlog

1. **Original capture typography.** `View original idea` and the auto-expanded Original Capture on Develop must use one shared body-text scale, line-height, spacing, and disclosure styling. They already read the same durable `ideas.raw_notes` record; this is a presentation consistency change only. Develop remains expanded by default, while Board, Write, and Finalize may keep the source collapsed.
- `npm run start:detail` now logs one redacted operational record for every persisted model attempt, completed or failed: role, provider/model, task, retry count, output allowance, cost estimate, provider request/status metadata, latency, usage, local JSON-parse state, and safe failure classification. It excludes credentials, prompts, generated text, raw provider bodies, filesystem paths, BOK/voice contents, and untrusted inputs.
- Bounded repair is now explicit in detail mode. A locally rejected structured response is logged as `execution attempt rejected`; a succeeding repair logs `bounded repair recovered` with `bounded_same_route_structured_output_repair` and assertions that provider, model, and tier did not change. This is a controlled same-route formatting repair, not automatic escalation. A Sol audit must validate the one-repair limit, cost accounting, persisted provenance, and explicit human approval before any later retry, token increase, or role escalation.
- Evidence: `tests/unit/openai-provider.test.ts` and `tests/integration/grounded-editorial-run.test.ts` (27 tests), `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. No external provider was called during implementation validation.

---

## Post-audit remediation checkpoint — 2026-08-08

Status: **implemented; awaiting fresh independent read-only audit.** Milestone 6 has not started.

- Runtime database access now requires an existing initialized database and never invokes migration code. Schema changes are an explicit owner action through `npm run db:migrate`; the setup and development documentation require `npm run db:backup` first for meaningful existing data.
- The legacy `approve_canonical_draft` and `approve_linkedin_companion` API actions and standalone service functions were retired. Their former route names are explicitly rejected with a safe message; the atomic `createLinkedinCompanion` transaction remains the sole companion-creation path.
- New regressions cover no implicit runtime migration and rejection of obsolete approval actions without approval or companion records.

Validation passed before the owner-controlled migration step: `npm run typecheck`; `npm run lint`; `npm test` (22 files / 84 tests); `npm run db:validate` (13 files, validate-only); `npm run build`; `npm run test:e2e` (2 deterministic production-mode flows); `npm run security:secrets` (125 files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`. No provider was called.

After validation, the owner-controlled migration procedure was completed: `npm run db:backup` created and restore-validated `data/backups/ai-editorial-board-remediation-20260808T201602061Z.sqlite`, then `npm run db:migrate` applied migration 013 successfully. This backup remains ignored and owner-only. No BOK, voice skill, provider, or secret was accessed or changed.
