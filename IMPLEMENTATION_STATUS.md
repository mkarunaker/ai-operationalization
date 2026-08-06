# Implementation Status — Lean Refactor

## Current checkpoint

**Testable lean writing workflow complete; MVP completion work remains.**

`AI_Editorial_Board_Spec.md` remains unchanged. The approved lean direction is implemented through a testable workflow: queue-first capture, optional themes, simple priority, persistent navigation, dedicated idea and Editorial Board pages, up to three optional questions, BOK refresh/retrieval at editorial-run time, concise editorial brief, editable working drafts, final human-voice/AI-pattern review, and local publication records.

The filesystem-backed **Editorial Notebook** is complete: it has a persistent navigation entry, a local Markdown working copy, immutable timestamped snapshots on explicit save, owner-only file permissions, Git ignore protection, and an initial template based on the five public editorial themes.

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

## Remaining before a complete MVP

1. Add explicit research modes and research artifacts, including the application research provider/tool boundary and cited-source UI.
2. Replace the deterministic local mock with configurable live model adapters and transparent routing/cost/budget controls.
3. Add explicit LinkedIn-companion generation for an approved Medium/Substack canonical draft.
4. Add basic manual post-publication feedback capture and a documented local SQLite backup/export action.
5. Add Notebook version browse, restore, comparison, and “send candidate post to Inbox” actions.

## Known risks to manage

- Preserve existing local ideas while changing statuses and workflow fields.
- Keep all BOK, voice-skill, research-page, and user-drafted text untrusted at model/tool boundaries.
- Keep research provenance and dates visible; do not imply comprehensive market coverage.
- Keep live-provider credentials out of source control, dotfiles, and the database.
- Validate UI state using production builds as well as development mode to avoid hydration/regression issues.
