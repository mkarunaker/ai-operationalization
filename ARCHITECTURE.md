# AI Editorial Board Architecture

## Status

Proposed MVP architecture. This document is based exclusively on `AI_Editorial_Board_Spec.md`, which is the authoritative product specification.

## Architectural goals

- Preserve author ownership and human decision authority.
- Keep every agent role independent of model vendor and model name.
- Load the Book of Knowledge, voice skill, prompts, and agent instructions from the filesystem at runtime.
- Persist transactional history, indexed representations, model usage, costs, and outcomes in the database.
- Retrieve only relevant context and retain exact source traceability.
- Support partial completion when one reviewer fails.
- Run all normal tests without live model calls.
- Keep the MVP deployable as a modular monolith without preventing later service extraction.

## Recommended MVP stack

### Application

- Next.js App Router, React, and TypeScript for the UI and HTTP API.
- Server Components for read-heavy pages and route handlers for stable application APIs.
- An in-process job runner with persisted job state for indexing and multi-agent jobs; keep the job interface extractable if a separate worker is ever needed.
- Zod schemas for configuration, API inputs, prompt outputs, and normalized provider responses.
- A small accessible component system built from Tailwind CSS and source-owned UI components.

### Persistence and jobs

- A local SQLite database as the system of record.
- SQLite FTS5 for heading-aware keyword retrieval across the small BOK and application history.
- No embeddings or vector database in the MVP. Add them only if the content volume or retrieval quality demonstrates a need.
- Node's built-in `node:sqlite` module and explicit SQL migrations so schema and indexing behavior remain inspectable without a native dependency.
- A lightweight job runner that persists job and review states in SQLite, avoiding Docker, PostgreSQL, Redis, and a second runtime process.

### Authentication and testing

- Local-only single-user authentication with a locally configured passphrase and persistent session. Do not add OAuth or managed identity integration.
- Bind the application to the loopback interface by default so it is not exposed to the local network unintentionally.
- Vitest for unit, schema, service, and adapter-contract tests.
- Playwright for basic end-to-end flows.
- A deterministic mock model provider used by the standard test suite and local demo mode.

Exact package versions will be locked during Milestone 1. Package selection may change only through a documented architecture decision if compatibility testing reveals a material problem.

## Why a TypeScript modular monolith

The MVP does not justify a Next.js and FastAPI split. Keeping the UI, API, orchestration services, provider interfaces, and job runner in one TypeScript application reduces setup and operational overhead. Domain and application modules remain independent of Next.js, SQLite, job-runner, and vendor SDK details, so another database or separately deployed worker can be introduced later without rewriting the editorial workflow.

## System boundaries

```text
Browser
  → Next.js UI and route handlers
    → Application services
      → Domain model and workflow policies
      → Provider registry and model adapters
      → Content loading and retrieval services
      → Repositories and transaction manager
      → Persisted local job runner
        → Independent reviewer calls
        → Structured-output validation and repair
        → Synthesis after reviewer terminal states
    → Local SQLite database + FTS5

Configured read-only filesystem sources
  → EAIO_Canonical_Knowledge_Base.md
  → kk-spoken-voice/SKILL.md or resolved Markdown file
  → prompt and agent-instruction files
```

## Dependency rules

```text
UI and transport → application → domain
worker           → application → domain
adapters         → application ports
persistence      → domain repository ports
content indexing → content ports + persistence ports
```

- Domain modules must not import Next.js, queue, ORM, or model-vendor SDKs.
- Application services depend on interfaces for providers, repositories, jobs, clocks, and identifiers.
- Vendor SDKs and vendor-specific request behavior are permitted only in adapter modules.
- Filesystem and database implementations are replaceable adapters behind application ports.

## Primary runtime flows

### Conversational intake

1. Persist the raw idea and conversation message before any model call.
2. Invoke the configured low-cost Intake and Clarification role once to produce up to five focused questions.
3. Persist user answers, skipped questions, and best-judgment instructions.
4. Invoke the role again to produce a versioned, editable Content Intent Brief.
5. Require the user to select one of the three post-intake paths.

### Drafting paths

- Existing draft: preserve the submitted text as its own immutable draft version, retrieve context, then offer Editorial Board review.
- Working draft: retrieve relevant context, require an available voice-skill version, invoke the Initial Drafter, and save an explicitly AI-assisted draft version.
- Idea review: retrieve context, run independent Strategist and Skeptic reviews against the brief, and let the user hold, revise, discard, provide a draft, or request a working draft. The Editor is not invoked until usable prose exists.

### Editorial Board execution

1. Estimate cost and enforce the run budget before queueing work.
2. Create a review-run snapshot containing the draft version, role configurations, prompt versions, pricing records, and content-source versions.
3. Queue Strategist, Skeptic, and Editor independently.
4. Persist each result, usage record, retrieval record, and failure separately.
5. When all reviewers reach a terminal state, invoke the Synthesizer with all successful outputs and explicit failure metadata.
6. Preserve minority objections and partial-run state.
7. Persist normalized recommendations for user acceptance, partial acceptance, or rejection.

### Final drafting and publication

1. Require the current voice-skill version and user recommendation decisions.
2. Give the Final Drafter the original draft, working draft, approved decisions, rejected decisions, factual constraints, and cited context.
3. Save the output as a new draft version linked to its parent, model call, and voice-skill version.
4. Allow manual edits, comparison, and restoration without overwriting earlier versions.
5. Publish only through an explicit user action that creates a publication record.
6. Store later metrics, feedback, and retrospectives as user-entered history.

## Runtime content loading

### Book of Knowledge

- Read the file identified by `EAIO_BOK_PATH`; default to `./content/knowledge/EAIO_Canonical_Knowledge_Base.md`.
- Resolve and validate the path at runtime and open it read-only.
- Parse Markdown into heading-aware sections with stable source locations.
- Calculate a whole-file checksum and stable section checksums.
- Preserve the prior valid indexed version until a complete refresh succeeds.
- Upsert changed sections, retain unchanged FTS rows, and retire removed sections transactionally.
- Store document and section index metadata in SQLite while retaining the configured file as the durable source.

### Voice skill

- Read the path identified by `KK_VOICE_SKILL_PATH`; default to `~/.codex/skills/kk-spoken-voice`.
- Expand `~` using the current process user's home directory.
- Accept a direct Markdown file or resolve a directory in this order: `SKILL.md`, `skill.md`, `README.md`, then one top-level Markdown file.
- Reject ambiguous directories with multiple fallback Markdown candidates.
- Calculate a checksum-derived version identifier and persist usage metadata.
- Never copy or modify the source.
- If unavailable, keep intake and review operational while returning a specific drafting-blocked error.

### Refresh behavior

- `npm run content:index` performs explicit validation and incremental indexing.
- Application startup performs a non-destructive source/status validation and exposes the result to the Content Status page.
- A protected refresh action may enqueue the same indexing operation from the Content Status page.
- Local file watching is optional and deferred until explicit indexing is reliable.

## Retrieval design

- Use SQLite FTS5 BM25 ranking for exact and related-term retrieval.
- Boost heading matches and deterministic domain terms, remove duplicates, and apply small configurable limits.
- Retrieve published content and feedback through separate typed sources so their provenance cannot be confused with the Book of Knowledge.
- Return document ID, title, heading path, passage, source location, relevance score, method, and version for every passage.
- Link every passage sent to a model to its `model_call` through retrieval records.
- Allow the user to inspect and manually add or remove retrieved sections before an expensive review.
- Defer embeddings and hybrid score fusion. If FTS5 retrieval later proves inadequate, add an embedding interface and local vector implementation behind the existing retrieval port.

## Provider abstraction

The provider registry resolves a role's active model configuration into a normalized request. Provider adapters return a normalized response with text, optional structured data, usage counters, latency, provider request ID, finish reason, and raw usage metadata.

The first implementations will be:

1. Deterministic mock provider for development and tests.
2. OpenAI-compatible adapter supporting configurable endpoints.
3. A second native provider adapter selected in Milestone 1; Anthropic is the proposed default.

Unsupported parameters must be removed or translated inside the adapter. Domain and orchestration code must never branch on vendor name.

## Structured output and repair

- Each agent uses a versioned role schema under `/schemas/agent-outputs`.
- Validate the first response before it reaches downstream workflow logic.
- On validation failure, allow one repair call with the same model.
- Preserve the raw response and both call costs.
- If repair fails, mark the review partially structured rather than discarding it.

## Data ownership and version snapshots

- Filesystem: Book of Knowledge, voice skill, prompts, and agent instructions.
- SQLite: users, workspaces, ideas, intake messages, briefs, drafts, versions, role configuration, pricing, review runs, reviews, recommendations, model calls, retrieval records, publications, metrics, feedback, and retrospectives.
- Every model call snapshots the role, provider, model, prompt checksum/version, voice version when applicable, pricing record, retrieved chunks, tokens, latency, and outcome.
- Historical records continue to reference the versions used at execution time even after configuration changes.

## Security design

- Store only environment-variable or secrets-manager references to API keys, never plaintext keys in application tables.
- Enforce authorization at application-service and route boundaries.
- Apply CSRF protection where cookie-authenticated mutation routes require it.
- Validate and limit all user content and external-file reads.
- Restrict configured content loaders to explicit paths and read-only operations.
- Route content according to sensitivity and provider privacy policy before making a call.
- Sanitize model output before rendering and retain raw output only in controlled persistence fields.
- Audit provider, pricing, routing, privacy, and other sensitive configuration changes.

## Local runtime shape

The MVP runs entirely on the user's machine:

- One Next.js process for the UI, API, and persisted job runner.
- One local SQLite database file stored under a configurable application-data path.
- Direct read-only access to the configured BOK and voice-skill filesystem paths.

No hosting platform, container, Docker daemon, network database, filesystem mount, or OAuth provider is required. Database backup can begin as a safe copy of the SQLite file while no write transaction is active, with a documented application command added before MVP completion.

## Proposed repository structure

```text
/
├── app/
│   ├── (auth)/
│   ├── workspace/
│   ├── reviews/
│   ├── publications/
│   ├── analytics/
│   ├── settings/
│   ├── content-status/
│   └── api/
├── src/
│   ├── domain/
│   ├── application/
│   ├── ai/
│   │   ├── provider-interface/
│   │   ├── adapters/
│   │   │   ├── mock/
│   │   │   ├── openai-compatible/
│   │   │   └── anthropic/
│   │   ├── routing/
│   │   ├── structured-output/
│   │   └── usage/
│   ├── content/
│   │   ├── loaders/
│   │   ├── markdown/
│   │   ├── indexing/
│   │   └── retrieval/
│   ├── persistence/
│   │   ├── database/
│   │   └── repositories/
│   ├── jobs/
│   ├── auth/
│   └── security/
├── content/
│   └── knowledge/
│       └── EAIO_Canonical_Knowledge_Base.md
├── prompts/
│   ├── shared/
│   └── roles/
├── schemas/
│   └── agent-outputs/
├── migrations/
├── scripts/
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── integration/
│   └── e2e/
├── docs/
│   └── adr/
├── AI_Editorial_Board_Spec.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── IMPLEMENTATION_STATUS.md
├── PRODUCT_REQUIREMENTS.md
├── DATA_MODEL.md
├── MODEL_PROVIDER_INTERFACE.md
├── PROMPTING.md
├── SECURITY.md
├── DEVELOPMENT.md
├── TESTING.md
├── DECISIONS.md
├── CHANGELOG.md
├── .env.example
└── package.json
```

There will be no `/author` directory and no repository copy of `kk-spoken-voice`.

## Deferred decisions

- External web-search provider for on-demand Originality review.
- Automated metric ingestion and social publishing, both outside MVP scope.
- Fine-tuning, multi-user tenancy, autonomous routing, and separate retrieval services.
- Local file watching, unless explicit refresh proves too cumbersome during development.
- Embeddings or a local vector index, unless FTS5 retrieval quality proves inadequate.

## Local-only decisions

- OAuth and deployment identity are not required.
- Hosting and read-only mounts are not required.
- SQLite is the MVP database and FTS5 is the MVP retrieval engine.
- Docker and a host `psql` installation are not required.
- Embeddings, vector search, and hybrid score fusion are deferred.
- Startup performs quick path, checksum, schema, and last-index-status validation; explicit refresh performs parsing and indexing.
- Actual provider cost remains nullable. When a provider does not report billed cost, the application records a clearly labeled estimate from normalized usage and the dated pricing record.
- Section identity uses document version, heading path, sequence, and content checksum. A heading move is treated as retiring the old indexed section and adding a new one; historical retrieval records retain the exact prior version and passage snapshot.
