# Implementation Status — Lean Refactor

## Current checkpoint

**The required publication UX audit-gap checkpoint and its 2026-08-08 follow-up data-integrity remediation are complete. Milestones 0–5 are complete. The next active work is the Capture-to-Develop UX checkpoint; Milestone 6 has not begun. The Git staging/commit checkpoint remains deliberately open. `BUILD_ROADMAP.md` is the active plan and contains the proposed milestone target dates.**

### Current delivery snapshot — 2026-08-08

| Area | Current state | Evidence / next action |
|---|---|---|
| Product contract and queue | Complete | Milestones 0–1 remain the accepted lean single-user baseline. |
| Grounded Board and drafting | Complete | Milestone 2 deterministic provenance, BOK retrieval, voice boundaries, and injection containment remain covered. |
| Live routing and revision loop | Complete | Milestones 3–4 retain explicit cost caps, bounded repair, escalation records, versioned review, and advisory voice checks. |
| Publication formats and lifecycle | Complete | Milestone 5 plus this audit-gap checkpoint now cover LinkedIn-only and long-form-plus-LinkedIn exact-version workflows. |
| Publication UX audit-gap checkpoint | Complete | Details and validation evidence are recorded immediately below; an independent read-only audit or user acceptance is the next gate. |
| Capture-to-Develop UX checkpoint | Planned | Before Milestone 6: optional capture title, concise suggested title on Develop, and automatic navigation into the new idea. |
| Milestone 6 — research and evidence | Not started | Do not begin until the Capture-to-Develop UX checkpoint is complete and accepted. The proposed target completion is 2026-08-12 in `BUILD_ROADMAP.md`. |
| Git release preparation | Intentionally open | No files were staged, committed, or pushed during this checkpoint. |

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
- The current visual implementation is tied to the canonical/primary exact draft. Platform-specific visual variants remain Milestone 8 work.
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
- Milestone 5 was completed immediately after this checkpoint; Milestone 6 is now the next feature milestone.

### Milestone 5 — Publication formats and LinkedIn companions — 2026-08-07

- Completed the local publication-format vertical slice. LinkedIn-only retains the short standalone draft; Medium and Substack plans create a canonical long-form draft; Medium/Substack-plus-LinkedIn plans create that canonical article first.
- The author must explicitly approve the exact canonical draft version before a deterministic LinkedIn companion can be generated. The companion is a separate draft record linked to its canonical source, not a second rendering of the same text.
- A canonical edit saves a new canonical version and marks the earlier companion stale. A stale or unlinked companion cannot be published; the author must approve the current canonical version and generate a replacement.
- Publication accepts a selected exact draft version and platform, so canonical articles and LinkedIn companions can be recorded independently while retaining their relationship and version history.
- Migration 011 was applied after owner-only backup `data/backups/ai-editorial-board-remediation-20260808T041756142Z.sqlite` passed integrity and temporary restore-copy validation. Eleven migration files validate.
- Validation without provider calls: TypeScript, ESLint, 21 test files / 66 tests, production build, deterministic Playwright LinkedIn and long-form companion flows, secret-pattern scan, dependency audit (0 vulnerabilities), and diff checks all passed.

Milestone 5 is complete. Milestone 6 (research and evidence handling) is next and has not started.

`AI_Editorial_Board_Spec.md` remains unchanged. The accepted lean direction is in `LEAN_PRODUCT_SCOPE.md`, and `BUILD_ROADMAP.md` is the active milestone sequence. Queue capture, themes, drafts, draft versions, review-history persistence, a final explainable AI-pattern check, and publication records are implemented. The visible grounded Board and drafting path receives selected BOK passages and the configured voice skill. It can run deterministically for local testing or, when the local server has `OPENAI_API_KEY` and configured model IDs, run through the explicit finance-first OpenAI route with a conservative pre-execution estimate and cumulative budget cap.

### Independent completeness audit — 2026-08-07

- Verdict: usable local LinkedIn beta; not yet the roadmap-defined local personal MVP.
- Required before Milestone 5: protect every mutating route, fix recommendation-disposition hydration, make live preview/index checks read-only, align committed budget fallbacks, verify a current backup and restore, complete escalation learning, reconcile documentation, and review the exact Git staging set.
- Milestone 5 and the Milestone 9 release gate remain incomplete.
- The current narrow visual slice is not full Milestone 8. The agreed artifact path is `data/<title-name>/draft_<number>_<datetime>.svg`, with no directory per version.
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

## Active roadmap

Work only from `BUILD_ROADMAP.md`. The next implementation milestone is Milestone 5: publication formats and LinkedIn companions. The immediate next step is the agreed independent audit before beginning it.

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

---

## Post-audit remediation checkpoint — 2026-08-08

Status: **implemented; awaiting fresh independent read-only audit.** Milestone 6 has not started.

- Runtime database access now requires an existing initialized database and never invokes migration code. Schema changes are an explicit owner action through `npm run db:migrate`; the setup and development documentation require `npm run db:backup` first for meaningful existing data.
- The legacy `approve_canonical_draft` and `approve_linkedin_companion` API actions and standalone service functions were retired. Their former route names are explicitly rejected with a safe message; the atomic `createLinkedinCompanion` transaction remains the sole companion-creation path.
- New regressions cover no implicit runtime migration and rejection of obsolete approval actions without approval or companion records.

Validation passed before the owner-controlled migration step: `npm run typecheck`; `npm run lint`; `npm test` (22 files / 84 tests); `npm run db:validate` (13 files, validate-only); `npm run build`; `npm run test:e2e` (2 deterministic production-mode flows); `npm run security:secrets` (125 files); `npm run security:audit` (0 vulnerabilities); `git diff --check`; and `git diff --cached --check`. No provider was called.

After validation, the owner-controlled migration procedure was completed: `npm run db:backup` created and restore-validated `data/backups/ai-editorial-board-remediation-20260808T201602061Z.sqlite`, then `npm run db:migrate` applied migration 013 successfully. This backup remains ignored and owner-only. No BOK, voice skill, provider, or secret was accessed or changed.
