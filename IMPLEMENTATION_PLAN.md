# Implementation Plan — Lean Refactor Proposal

## Status

Milestone 1 is complete. Milestones 2 and 4 are substantially implemented as a testable local workflow. Milestones 3 and 5 have useful foundations but remain incomplete. The authoritative specification remains unchanged; the lean refactor is tracked in `LEAN_PRODUCT_SCOPE.md` and `REVISED_BUILD_PROMPT.md`.

## Delivery approach

The refactor is deliberately vertical: each milestone creates a usable slice while preserving local content through additive, reversible migrations. Before the first migration, create and verify a user-controlled SQLite backup. Keep the deterministic mock provider for repeatable tests; do not make live-provider credentials a prerequisite for queue and writing flow work.

## Milestone 1 — Queue-first foundation

**Status: Complete.**

**Objective:** Make the root experience a reliable local idea queue and remove the old dashboard/workspace gate from the normal workflow.

**Acceptance criteria:**

- `/` opens the queue directly on `127.0.0.1:3100`.
- A raw thought is saved immediately as `Inbox` with no required metadata or model call.
- Saved ideas can be reopened, edited, status-changed, moved by simple priority controls, and parked.
- Existing ideas remain readable after the migration.
- A verified SQLite backup/export path is documented before schema changes.
- Input limits, server-side validation, output escaping, and tests cover capture and reopen behavior.

**Expected components:** root/page routing, queue UI, idea repository/service, additive migration for queue status/priority, queue API routes, migration/backup documentation, unit/integration/e2e tests.

## Milestone 2 — Themes and lean development workspace

**Status: Substantially complete.** Themes, queue statuses, priority, dedicated idea workspace, optional clarification, publication-plan choice, and persistent navigation are implemented. Explicit saved-draft intake and final UI polish remain follow-up work.

**Objective:** Add optional organization and reduce development to the information that genuinely helps a post.

**Acceptance criteria:**

- Themes can be selected, added, removed, and left blank without blocking capture or development.
- An idea supports multiple themes and the editable starter themes are available.
- Selecting an idea shows original input, added notes, source links, optional existing draft, and publication plan.
- Clarification asks at most three material questions by default; a fourth needs an explicit essential-gap condition; “best judgment” is available.
- Defaults for audience, tone, posture, and style are applied without routine questioning.
- The old forced brief/path selection is no longer part of the normal flow.

**Expected components:** themes and idea-theme migrations/repositories, lean idea detail screen, question generation policy/service, publication-plan fields, tests for question cap/defaults/theme optionality.

## Milestone 2.5 — Editorial Notebook

**Status: Complete.**

**Objective:** Give KK a durable local working space for evolving theme notes, candidate posts, questions, and research reminders without treating conversational memory or the database as the source of truth.

**Acceptance criteria:**

- Editorial Notebook is a persistent left-navigation destination.
- The latest notebook is a local Markdown file, ignored by Git.
- An explicit save creates an immutable timestamped Markdown snapshot and atomically updates the latest working copy.
- The initial template contains the five approved public editorial themes and candidate post ideas.
- Notebook content remains distinct from the canonical, read-only BOK.
- Snapshot file permissions are owner-only and tested.

**Implemented components:** filesystem notebook service, notebook API, Markdown editor, snapshot metadata, isolated browser coverage, and unit coverage for initialization, snapshot creation, and file permissions.

## Milestone 3 — Evidence, research, and BOK context

**Status: Partially complete.** BOK/voice loading, FTS5 retrieval, source status, and board-time BOK refresh are implemented. Explicit research modes, cited research artifacts, and an application-research adapter remain.

**Objective:** Make idea development evidence-aware while retaining local, light retrieval.

**Acceptance criteria:**

- Relevant BOK sections are retrieved through the existing FTS5 index only when developing/reviewing an idea; full BOK text is never sent by default.
- BOK and voice skill remain external, read-only filesystem sources with visible status/version provenance.
- KK can add supplied research as notes, links, quotes, and evidence.
- Explicit application research supports a stated question and time range, preserves source URL/title/date, distinguishes evidence from interpretation, and warns about non-comprehensive coverage.
- Third-party research text is handled as untrusted input and cannot override system/agent instructions.
- No embeddings, vector infrastructure, automated trend stream, or automatic post generation is introduced.

**Expected components:** research artifact/source migrations and service, BOK context view, provider/tool research boundary, sanitization/provenance tests, content-loader integration tests.

## Milestone 4 — Editorial brief and drafting package

**Status: Substantially complete for local mock testing.** Dedicated Editorial Board page, independent reviewer records, concise editorial brief, editable draft, publication record, and final human-voice check are implemented. Live drafting, accepted-recommendation workflow, and LinkedIn companion generation remain.

**Objective:** Turn a developed idea into rigorous but low-friction editorial feedback and a user-owned working draft.

**Acceptance criteria:**

- Strategist, Skeptic, and Editor run independently; Synthesizer runs only after their output is available.
- Default UI presents the concise editorial brief and expandable detailed reviews, not a wall of agent output.
- The brief covers thesis, strengths, uncertainty, counterargument, evidence needs, changes, and next step.
- Draft generation uses selected BOK context and the external voice skill, preserves uncertainty, and prohibits invented facts/experience.
- LinkedIn-only generates a standalone short draft. Medium/Substack generates a canonical 3–4 minute draft. A LinkedIn companion is generated only by explicit request after canonical work is accepted.
- Drafts, recommendations, BOK/voice versions, and content relationships are persisted and reopen correctly.
- Mock-provider tests remain deterministic; provider abstractions remain vendor-neutral.

**Expected components:** board-service simplification, concise synthesis schema/prompt, draft service/UI, canonical-companion migration, role prompt revisions, review/draft integration and e2e tests.

## Milestone 5 — Models, publication, feedback, and release hardening

**Status: Partially complete.** Local publication records, deterministic model-call records, prompt-injection boundaries, validation, secret scan, dependency audit, and the final human-voice guardrail are implemented. Live provider routing, estimates/budgets, feedback capture, and backup/export remain.

**Objective:** Enable a safe personal publishing loop with transparent paid calls.

**Acceptance criteria:**

- Configurable non-secret role-to-tier/provider/model routing supports low-cost default selection and one-agent escalation.
- Every model call stores provider/model/role, tokens available from the provider, pricing assumptions, estimate/actual cost, latency, errors, and escalation rationale/usefulness.
- A budget cap is shown before a paid run and blocks automatic escalation above the cap.
- A published record stores final text, platform, URL, date, themes, linked original idea/drafts/reviews, and model usage.
- Manual basic feedback can be added later without blocking publication.
- Keychain/terminal credential setup is documented; keys are absent from source control and SQLite.
- Typecheck, lint, unit/integration/e2e tests, production build, migration validation, secret scan, dependency audit, and adversarial prompt-injection tests pass or have explicitly documented environment-only exceptions.

**Expected components:** routing configuration and provider adapters, cost services/UI, publication/feedback migrations and screens, release/backup documentation, security test suite and final regression tests.

## Explicit deferrals

OAuth, multi-user support, RBAC, cloud deployment, Docker, PostgreSQL, embeddings, pgvector, distributed workers, automatic publishing, LinkedIn scraping, automatic trend monitoring, fine-tuning, and a full analytics platform are not prerequisites for this MVP.
