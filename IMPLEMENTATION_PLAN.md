# AI Editorial Board Implementation Plan

## Authority and working agreement

`AI_Editorial_Board_Spec.md` is the sole authoritative application specification. `archive/AI_Editorial_Board_Spec.md` must not be used for implementation unless the user explicitly requests a version comparison.

Implementation proceeds one milestone at a time. At each checkpoint:

1. Restate the milestone objective and acceptance criteria.
2. Identify files and components to be created or changed.
3. Implement only that milestone.
4. Run the relevant tests, type checks, linting, migrations, and validations.
5. Verify the result against the authoritative specification.
6. Update `IMPLEMENTATION_STATUS.md` with evidence, gaps, and technical debt.
7. Stop before starting the next major milestone.

## Product flow to preserve

```text
Conversational idea input
→ Intake and Clarification Agent
→ Up to five focused questions
→ Editable Content Intent Brief
→ User selects one path
  1. Preserve and review an existing draft
  2. Retrieve context and create a working draft with kk-spoken-voice
  3. Retrieve context and review the idea with independent Strategist and Skeptic
→ Usable draft
→ Independent Strategist, Skeptic, and Editor reviews
→ Synthesizer
→ User recommendation decisions
→ Final Drafter using kk-spoken-voice
→ User editing and explicit approval
→ Publication record
→ Metrics, feedback, and retrospective
```

## Agent classification

### Intake and drafting agents

1. Intake and Clarification Agent
2. Initial Drafting Agent
3. Final Drafting Agent

### Core Editorial Board

4. Strategist
5. Skeptic
6. Editor
7. Synthesizer

### Optional agent

8. Originality and Landscape Reviewer

## Milestone 1: Foundation and model-independent skeleton

### Objective

Create a runnable, documented, secure foundation with a complete relational schema, explicit domain boundaries, provider contracts, versioned prompt structure, a deterministic mock provider, and a database-backed job skeleton. No live model provider calls or end-user editorial workflow are required yet.

### Planned files and components

- Project configuration: `package.json`, lockfile, TypeScript, Next.js, lint, formatting, Vitest, and Playwright configuration.
- Local infrastructure: configurable SQLite database path, FTS5 capability validation, and database environment examples. Docker is not required.
- Application shell: root layout, direct local dashboard, health/readiness endpoint, and persisted in-process job-state foundation.
- Domain modules: entity identifiers, shared status types, errors, role catalog, and repository/application ports.
- Persistence: schema definitions, migrations, indexes, transaction boundary, and repository contracts for all Section 13 entities.
- Provider layer: normalized request/response types, provider interface, provider registry contract, error taxonomy, usage normalization, and deterministic mock adapter.
- Job layer: review-run and agent-job states with pending, running, completed, partially completed, and failed semantics.
- Prompt and schema layout: all shared and role prompt files plus initial JSON/Zod output schemas.
- Required documentation: product requirements, data model, provider interface, prompting, security, development, testing, decisions, changelog, and an initial ADR for the modular monolith.
- Synthetic seed fixtures labeled as synthetic and containing no invented professional history.

### Acceptance criteria

- A developer can install dependencies and start the application using documented commands.
- A local SQLite database can be created and all migrations apply to an empty database without Docker or a host database server.
- The schema represents every required Section 13 entity, including intake history, brief versions, draft lineage, model pricing, call usage, retrieval records, publication data, feedback, and retrospectives.
- Database constraints, relational indexes, and FTS5 indexes cover core foreign keys, unique versions, active role configuration, review status, and retrieval queries.
- The web shell exposes direct loopback-only local access and a health/readiness response without any credentials or secrets.
- All eight stable roles exist as role data or typed seed definitions without any vendor/model binding.
- Application and domain code compile without importing vendor SDKs.
- The normalized provider interface covers structured output, reasoning effort, token categories, latency, provider IDs, and raw usage.
- The deterministic mock adapter satisfies provider contract tests and enables tests without API keys.
- Prompt files exist for every role and shared policy; the external voice skill is not copied into the repository.
- Job-state tests prove that one failed reviewer does not invalidate successful reviewer results.
- The app binds to loopback by default and documents that it must not be network-exposed without reintroducing authentication.
- Security headers, owner-only SQLite file permissions, secret-pattern scanning, dependency advisory scanning, and prompt-injection boundary tests pass.
- Untrusted input is never merged into a trusted role prompt or permitted to control tools, configuration, budgets, or provider selection.
- `npm run lint`, `npm run typecheck`, `npm test`, and migration validation pass.
- Documentation explains local setup, architecture boundaries, testing without keys, and known shortcuts.

### Explicit non-goals

- No BOK parsing, FTS indexing, or Content Status UI.
- No live provider adapters.
- No conversational intake UI or agent execution.
- No drafting, Editorial Board orchestration, publication, or analytics UI.

## Milestone 2: Runtime content loading and traceable retrieval

### Objective

Load, validate, version, incrementally index, retrieve, and inspect the configured BOK and voice skill without copying or modifying their authoritative filesystem sources.

### Acceptance criteria

- `EAIO_BOK_PATH` resolves the canonical Markdown file at runtime.
- `KK_VOICE_SKILL_PATH` supports a direct file or the specified directory-resolution order with `~` expansion.
- Missing voice skill blocks drafting capabilities only; intake and review capability status remains available.
- Whole-file and section checksums detect changes; unchanged sections are skipped.
- A failed refresh preserves the prior valid index.
- `npm run content:index` reports validation, changed, skipped, retired, and failed items clearly.
- FTS5 retrieval with heading boosts returns passages with complete provenance.
- Every model-context passage can be linked to a model call.
- The read-only Content Status page and protected refresh action work without upload/edit controls.
- Parser, checksum, incremental-index, failure-preservation, retrieval, and status API tests pass.

## Milestone 3: Conversational intake and content workspace

### Objective

Implement idea capture, clarification, Content Intent Brief creation and editing, draft/version persistence, and related-content lookup.

### Acceptance criteria

- The first application screen asks **What are you thinking about?**
- Bullets, rough notes, incomplete thoughts, transcripts, links, and existing drafts are accepted without mandatory metadata.
- The Intake role asks at most five focused questions in one generation call where practical.
- Questions already answered by input or retrievable sources are excluded.
- Skip and **Use your best judgment** are persisted.
- A structured, editable, versioned Content Intent Brief is produced.
- Conversation history and original input remain inspectable.
- Draft versions are immutable and linked through parent/version metadata.
- Intake and workspace API, schema, service, and end-to-end tests pass using the mock provider.

### Planned checkpoint scope

- Professional conversational workspace UI with an accessible local-first design system.
- Persistent idea and intake-message services backed by the existing SQLite schema.
- A deterministic mock Intake and Clarification Agent that asks no more than five focused questions.
- Editable, versioned Content Intent Brief UI and API, with explicit **Skip** and **Use your best judgment** choices persisted in the intake history.
- Existing-draft capture and the three post-brief path choices as persisted selections; no live model provider call is required.

## Milestone 4: Three paths and Editorial Board orchestration

### Objective

Implement all three post-intake choices, independent reviewers, structured outputs and repair, partial failure, synthesis, and recommendation decisions.

### Acceptance criteria

- Existing-draft text is preserved as submitted.
- Working-draft creation retrieves context and requires a valid voice-skill version.
- Idea review runs only independent Strategist and Skeptic before prose exists.
- Editor execution is rejected until a usable draft exists.
- Strategist, Skeptic, and Editor cannot see one another's outputs before completion.
- One structured-output repair is attempted and its cost recorded; raw failed output is preserved.
- Reviewer failure yields partial completion without deleting successful results.
- Synthesizer sees terminal reviewer results and failure metadata and preserves material minority opinions.
- Users can accept, partially accept, or reject each recommendation with notes.
- Review UI displays role, model, prompt version, confidence, tokens, latency, cost, ratings, and retrieved context.
- Orchestration, independence, partial-failure, repair, schema, and end-to-end tests pass.

## Milestone 5: Constrained final drafting and version comparison

### Objective

Create final drafts from explicit user decisions while enforcing voice, factual, and rejected-change constraints.

### Acceptance criteria

- Final drafting is unavailable without a valid external voice-skill version.
- The Final Drafter receives the original and working drafts, approved and rejected recommendations, factual constraints, and cited context.
- Rejected recommendations are not silently reintroduced.
- Every generated draft stores its parent, prompt/model call, and voice-skill version.
- Users can manually edit, compare, and restore versions without destructive overwrites.
- No content is marked published without explicit user action.
- Constraint, lineage, comparison, restoration, and end-to-end tests pass.

## Milestone 6: Provider adapters and cost governance

### Objective

Add two production-capable adapters, per-role configuration, historical pricing, call-level usage accounting, estimates, spending caps, escalation, and comparison.

### Acceptance criteria

- OpenAI-compatible and one second native adapter satisfy the same contract suite.
- Provider-specific parameters and errors remain inside adapters.
- Roles can be reassigned without editorial workflow changes.
- Every call records all available token categories, pricing record, estimates, actual cost when supplied, latency, retries, and result status.
- Editorial Board cost is estimated before execution.
- Run budgets stop or request approval before exceeding configured limits.
- One role can be rerun or compared with a different model without duplicating unrelated calls.
- Cost views aggregate by role, run, post, provider, model, and time.
- Adapter, pricing, estimate, cap, escalation, and comparison tests pass without requiring live calls in the standard suite.

## Milestone 7: Publication, feedback, and learning loop

### Objective

Persist explicit publication records, manual performance history, qualitative feedback, retrospectives, and evidence-based basic analytics.

### Acceptance criteria

- A chosen draft version can be explicitly marked published with platform, URL, date, text, and lineage.
- Multiple manual metric snapshots can be recorded over time.
- Comments, direct feedback, objections, questions, outcomes, and user interpretations can be stored.
- A retrospective captures what worked, what did not, unexpected feedback, follow-ups, and strategic value.
- Analytics distinguish engagement from strategic value and avoid unsupported causal claims.
- Published items can seed follow-up ideas and reveal repeated themes without blocking deliberate repetition.
- Publication, snapshot, feedback, retrospective, and analytics tests pass.

## Milestone 8: MVP hardening and release verification

### Objective

Close cross-cutting security, privacy, operational, accessibility, documentation, and Definition of Done gaps.

### Acceptance criteria

- Authentication, authorization, CSRF, rate limits, input limits, sanitization, secret handling, and sensitive configuration auditing are verified.
- Sensitivity classification prevents disallowed provider routing.
- Dependency and secret scans pass or have documented accepted findings.
- Database backup and restore steps are documented and exercised locally.
- Standard tests make no live model calls.
- Unit, contract, integration, API, migration, and core Playwright suites pass.
- All 25 MVP scope items and every Section 26 Definition of Done item have linked verification evidence.
- Local startup, filesystem-path, SQLite backup, and recovery requirements are documented.
- Remaining technical debt and deferred decisions are explicit.

## Dependencies and decisions required

### Confirmed local MVP decisions

- TypeScript modular monolith with Next.js and an in-process persisted job runner.
- SQLite with FTS5 from Milestone 1.
- No embeddings or vector database unless later retrieval evidence justifies them.
- Node built-in SQLite with explicit SQL migrations.
- No Docker, PostgreSQL, Redis, OAuth, hosting platform, or external filesystem mounting.
- Local loopback-only access with no login by explicit user decision.
- OpenAI-compatible plus Anthropic as the first production adapters.
- Polling for job status in the initial UI; streaming can be added behind the optional provider stream interface.

### Remaining ambiguity or risk

- The external web-search capability for on-demand Originality review is not selected and can be deferred beyond the core MVP.
- Vendor token-usage fields and actual-cost reporting are inconsistent; adapters must tolerate missing values.
- SQLite driver and ORM compatibility with the installed Node.js version must be verified before locking dependencies.
- FTS5 tokenization and heading boosts need deterministic fixtures, but no vector-score fusion is required.
- Startup must remain quick: validate paths, checksums, schema, and last-index status; perform parsing and indexing through explicit refresh jobs.
- Authentication must support simple local development without weakening deployed security.
- The no-login local design must never be exposed to other machines on the network.
- Provider API calls still send selected private context off-machine when the user enables a cloud provider; local storage alone does not make model execution local.
- Prompt injection is a standing security threat. Every model call must preserve a trusted instruction boundary, label all retrieved/user-provided material as untrusted data, detect common attack signals, prohibit untrusted tool/configuration instructions, and surface suspicious context for user review.

### Resolved technical questions

- Stable section identity means recognizing a BOK section after a heading is renamed or moved. For this small corpus, a move is treated as an old section retiring and a new section being added. Historical retrieval records keep the old version and passage, so no complex identity-matching algorithm or dedicated ADR is needed initially.
- Hybrid retrieval score fusion means combining keyword-search and embedding-search rankings. Because the MVP uses only FTS5 keyword retrieval, there are no competing scores to tune.
- Actual billed cost is optional. When it is unavailable, the application stores a labeled estimate based on reported tokens and the dated price configuration; it never presents the estimate as an actual bill.
- Docker is not required. The application uses a local SQLite file.

None of these issues blocks Milestone 1 because the proposed choices are reversible and can be recorded as ADRs.
