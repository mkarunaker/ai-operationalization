# Changelog

## Unreleased

### Post-release live-run reliability

- Made Initial and Final Drafter allowances scale from the exact saved word-range target, set both drafters and Proofreader to low reasoning, added bounded server-only Final Drafter and Proofreader overrides, and aligned preview, cost reservation, normal and repair requests, recovery, Advanced settings, and immutable provenance. Ordinary ranges retain proportionate reservations; an oversized route/range combination now names the hard-ceiling conflict before dispatch.
- Set the Synthesizer to low reasoning, raised its default output allowance to 1,600 tokens, and added a validated server-only 1,600-to-3,000 operator setting. Estimates, cost reservations, requests, structured repairs, Advanced settings, and immutable Board provenance use the same resolved value.
- Increased the bounded server-owned reviewer output allowance, set Luna reviewer reasoning to low, included the allowance in estimates and immutable provenance, and disclosed it on scoped retry controls so structured reviews have room to complete without weakening the run cap or automatic-retry policy.

### Post-release review and visual guidance

- Separated each original recommendation from its author decision, added a local editable 30–40-word visual-guidance starting point after exact-output draft review, and replaced generic blank custom-illustration previews for both articles and derived short posts with concepts based on each saved output's governing decision rather than its opening fragment.
- Clarified that approving a custom illustration concept is a free local save and that image generation remains a separate configured, explicitly priced request.
- Aligned Visual companion reading text with the surrounding Write surface and kept new-version approval and generation controls compact instead of stretching across the candidate card.

### Post-release source library

- Replaced future single-file BOK indexing with an explicitly selected local Markdown library while retiring upgraded legacy BOK records without deleting their files or historical indexed versions.
- Made source indexing an explicit owner action; Editorial Board runs and targeted reviewer retries use the current indexed state and never refresh files implicitly.
- Recorded every selected knowledge document version and checksum in the immutable Board snapshot and limited retrieval to selected library records.
- Exposed path-free inventory metadata in the library UI while keeping bounded passage excerpts behind an explicit local search query.

### Milestone 4 — actionable final judgment

- Added an optional local visual companion for a saved draft. It creates a calm, text-accurate SVG framework flow, stores the asset outside the draft text under the local data directory, records its link to the exact draft version, and provides caption, alt text, and download.
- Saved visual assets now use a safe title-based directory and readable version/timestamp filename (`visuals/<safe-title>/v<version>_<UTC timestamp>.svg`), rather than a new directory for each draft version.
- Replaced text-pattern inference of whether an initial recommendation was addressed with explicit saved author dispositions: Resolved, Revised, Superseded, or Still open.
- Publication now reuses the exact reviewed draft version when unchanged and records its Editorial Board run, final-review run, and acknowledged final voice-check result in local provenance.
- Replaced fixed 72% local draft-checklist values with Pass, Review, or Needs revision. Existing saved checklist memos receive a sensible label from their recorded recommendation; future memos persist the exact status.
- Reframed the Editorial Brief as a concise edit guide: keep, clarify, acknowledge, and evidence decisions; suggested changes and one clear Draft action now precede optional agent rationale.
- Moved one-reviewer reruns behind an explicit optional disclosure so successful Board output is not mistaken for a task to repeat.
- Required plain-prose publication drafts: generated output rejects Markdown formatting, the voice check flags it, and publication blocks it until removed.
- Added optional, exact before/after final-polish suggestions to a ready draft review, with a reason and an individual Apply action; suggestions do not reopen resolved editorial concerns.
- Kept the reviewed memo visible while suggested edits are being applied, clearly marking the unsaved draft as newer than that memo so several suggestions can be applied before one save.
- Clarified the final human-voice result: a low AI-pattern score now explicitly says that no revision is required, and low-severity findings are presented as optional observations.
- Corrected the live-run budget control so a preview loaded after the client view no longer leaves the run-again action disabled by a stale default cap; disabled controls now show their exact reason.
- Replaced the Develop-page status dropdown with explicit lifecycle actions: Park this idea and Return to Inbox. Normal workflow statuses remain system-managed.

### Milestone 3 — controlled live execution

- Added a ZenMux OpenAI-compatible Chat Completions adapter as the current live-test default. It requires a server-only `ZENMUX_API_KEY` and operator-selected provider-qualified model IDs; Anthropic and OpenAI remain explicit configuration options.
- Made all ZenMux model IDs and pricing assumptions runtime configuration, so changing provider catalogs do not require a source-code change.
- Added a server-only OpenAI Responses provider with tools disabled, response storage disabled, strict JSON schemas, bounded structured-output repair, and user-safe provider errors.
- Added role-independent low, medium, and high model-tier configuration with local operator-maintained pricing assumptions, low-cost default routing, and per-run projected-cost/budget enforcement before a provider request.
- Added a review-screen live-run preview that shows provider, model, estimated cost, pricing basis, configuration availability, and an editable run cap; deterministic runs are now explicitly a collapsed free test alternative.
- Persisted cached and reasoning token fields, estimated cost, latency, pricing basis, request IDs when supplied, and budget metadata for live calls without storing credentials.
- Added a medium-tier one-reviewer rerun. It records the user escalation reason, prior lower-cost model call, and projected escalation cost while preserving the original Board run and draft.

### Commit-preparation refinement — fast personal drafting path

- Added a direct **Create BOK-grounded draft** path for a fully described Inbox idea; optional clarification is now collapsed rather than a required step.
- Kept later development notes available without making them a second intake requirement.
- Added concise local working-title generation that skips capture metadata and avoids copying the full input as the title.
- Reset the local application database at user request after creating and verifying an ignored, owner-only backup; no BOK or voice-skill source was modified.
- Added mandatory agent-security guardrails and made their verification gate part of the active build roadmap.

### Milestone 1 — workflow integrity and honest simulation

- Repaired idea-detail mutation requests and synchronized title/status changes with content records.
- Added Parked/unpark workflow control and protected unsaved draft edits from stale review and voice-check claims.
- Preserved the initial editorial brief, surfaced the latest applicable draft review, and collapsed prior version-linked review memos.
- Labelled deterministic Board and starter-draft output as simulation; related BOK results are now clearly a non-applied search preview.
- Added integration and end-to-end coverage for queue changes, long review history, draft staleness, and publication records.

### Milestone 2 — grounded deterministic editorial path

- Added an ordered, source-grounded Board run: development snapshot, FTS BOK retrieval, independent reviews, synthesis, and a voice-guided working draft.
- Persisted BOK/voice/prompt/model/pricing provenance and retrieval ranks before displaying grounded passages.
- Added historical BOK-index preservation so source refreshes do not invalidate previously retrieved editorial evidence.
- Added grounded-run tests for source-sensitive output, reviewer failures, voice rules, and prompt-injection containment.

### Milestone 0 — contract freeze

- Accepted the lean local product contract through ADR 0003 and `BUILD_ROADMAP.md`.
- Normalized the five public editorial theme labels across the seed data, migrations, and accepted build prompt.
- Added forward-only normalization for existing local theme records while preserving idea associations.
- Reclassified the visible workflow as a persisted deterministic/mock prototype until grounding, voice application, and live routing are implemented.
- Added documented and verified local SQLite backup and restore-validation guidance.

## 0.1.0 — Milestone 1 foundation

- Added a local Next.js application scaffold.
- Added local authentication boundary, SQLite schema/migrations, provider contracts, mock provider, job state machine, prompts, schemas, tests, and foundational documentation.

## Local-only access decision

- Removed the login and session-secret requirement by explicit user decision. The app now opens directly on loopback port 3100.
