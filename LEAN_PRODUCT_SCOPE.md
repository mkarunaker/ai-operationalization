# Lean Product Scope — AI Editorial Board

## Status and authority

This is the accepted lean product direction, approved by KK on 2026-08-06. `BUILD_ROADMAP.md` is the execution sequence. `AI_Editorial_Board_Spec.md` remains the source for requirements not superseded by this lean direction; it is not modified by this document.

## Product intent

AI Editorial Board is a local, single-user thinking and writing workspace. It helps KK capture ideas quickly, develop one when ready, ground it in the EAIO Book of Knowledge (BOK), challenge it through a compact editorial process, and publish a clear piece in KK's voice.

The visible experience must be lightweight. The retrieval, independent review, evidence checks, model routing, cost tracking, and prompt-injection controls remain rigorous but stay out of the way unless KK needs to inspect or control them.

## Agreed product decisions

- It is a personal local application, not a commercial or multi-user platform.
- The home page is an idea queue, not a dashboard that requires opening a workspace.
- Saving an idea is immediate. Detailed metadata is optional and never blocks capture.
- Ideas can be manually reprioritized and use one simple status: `Inbox`, `Developing`, `Ready to review`, `Drafted`, `Published`, or `Parked`.
- Themes are optional planning labels, not public content-series commitments. Capture offers an optional existing-theme picker, a way to add a theme, and a blank/general-AI choice.
- The author chooses a reader contract and one output shape: a short post, an article, or an article with a derived short post.
- The article and derived short post are separate exact versions. A derived short post is created only when the selected output shape includes it and stays tied to one exact article version.
- Delivery channel is selected only in Finalize, when recording an already-approved exact output. It does not shape capture, drafting, review, model routing, or provenance.
- Default audience: professionals across AI, data, technology, business, and leadership; tone: neutral, thoughtful, practical, skeptical without cynicism; posture: observation and invitation; style: `kk-spoken-voice`.
- Development asks zero to three materially useful clarification questions by default. A fourth is permitted only when an essential gap remains. “Proceed with your best judgment” skips them.
- Research is explicit: no research, KK-supplied research, or application research and cross-checking. It supports thinking and must not fabricate authority or automatically write the post.
- The core board is Strategist, Skeptic, Editor, and Synthesizer. Raw reviews are expandable, while a concise editorial brief is the default.
- Low-cost model tiers are the default. Vendor and model assignments stay configurable and model-agnostic. Every call records usage, pricing assumptions, latency, cost, and escalation reason.
- The BOK and voice skill remain read-only external filesystem sources. Do not copy, upload, or modify either source.

### Superseding reader-first distribution decision — 2026-08-09

Milestone 6.2 supersedes the active authoring use of platform publication plans. Capture through Write now chooses a reader contract and one output shape: a short post, an article, or an article with a derived short post. LinkedIn, Medium, and Substack are distribution channels selected only when recording an already-approved exact output in Finalize. They must not shape the Board thesis, reader contract, drafting, review, proofread, generic output format, relationship, or model route. Existing migration history remains immutable, but platform-first fields and names become inactive compatibility artifacts rather than active product behavior.

## Proposed end-to-end workflow

```text
Quick capture on idea queue
→ immediately saved as Inbox (optional theme and priority)
→ manually choose an idea when ready
→ add notes, source links, or a draft; choose reader contract and output shape
→ choose research: none / provide it / research and cross-check
→ answer up to three useful questions, or proceed with best judgment
→ retrieve relevant BOK sections (not the complete BOK)
→ run Strategist, Skeptic, and Editor independently
→ Synthesizer produces concise editorial brief
→ inspect or act on recommendations; expand raw reviews only if wanted
→ generate a short post or article in kk-spoken-voice
→ when the output shape includes it, generate a separately metered derived short post from that exact article in the same Board run
→ edit, approve, and record the actual delivery channel only in Finalize
→ later add simple engagement and qualitative feedback
```

## Lean architecture

```text
Next.js + TypeScript local monolith (loopback binding only)
  ├─ Queue and writing workspace UI
  ├─ Route handlers / application services
  ├─ SQLite database and SQL migrations
  ├─ SQLite FTS5 BOK retrieval (no embeddings for MVP)
  ├─ Filesystem readers: BOK, voice skill, prompts, agent instructions
  ├─ Provider abstraction with non-secret routing configuration
  └─ In-process, user-triggered runs; no worker, microservice, or job broker
```

The database is local. API credentials are never stored in source, the database, or committed dotfiles; use terminal environment variables initially and the macOS Keychain when the provider layer is enabled. The application remains bound to `127.0.0.1:3100`.

### Retrieval and research

SQLite FTS5 is sufficient for the current personal BOK and content volume. It returns the small set of heading-preserving source passages relevant to an idea. Embeddings, a vector database, score fusion, and indexing workers are deferred until FTS retrieval demonstrably fails.

Application research is a provider/tool capability, not an autonomous feed. A run must specify a time range and research question, use reputable sources, store source URL/title/date and a short evidence-versus-interpretation summary, and clearly show that coverage is selective rather than comprehensive. No social scraping, automated publishing, or trend harvesting is in scope.

## Simplified data model

| Area | Lean MVP records |
| --- | --- |
| Queue | `ideas`: raw input, title, status, manual priority/order, optional notes, timestamps, reader/output contract |
| Organization | `themes` and `idea_themes` many-to-many relation; theme is optional |
| Development | clarification questions/answers, “best judgment” choice, selected BOK passages |
| Research | research mode, KK-supplied notes/links, application research briefs, cited sources, evidence/interpretation labels |
| Editorial work | draft versions, one board run, independent reviews, synthesizer brief, recommendation decisions |
| Publication | article/derived-short relationship, delivery channel, title, final text, URL, published date |
| Learning | manual metrics, qualitative feedback, follow-up ideas |
| Operations | provider/model/role, tokens, cached/reasoning tokens when supplied, price assumptions, estimated/actual cost, latency, failures, escalation reason and usefulness |

The existing broader tables may remain as compatible internal storage during the transition. The MVP must not require projects, users, tenants, elaborate briefs, analytics, or retrospectives in its day-to-day screens.

## Current implementation assessment

| Decision | Current work | Lean direction |
| --- | --- | --- |
| Keep | Next.js local app, SQLite migrations, loopback-only local access | Retain |
| Keep | Filesystem BOK and voice-skill loaders, checksums, read-only status | Retain; do not touch source files |
| Keep | Markdown section parsing and SQLite FTS5 retrieval | Retain; use only on development/review runs |
| Keep | Provider interface, structured-output validation, model-call records | Retain and reconnect to configurable live providers later |
| Keep | Prompt-injection boundary and input validation | Retain and test at every model/tool boundary |
| Simplify | Five-question intake and formal Content Intent Brief | Quick save, then 0–3 useful questions and a small editable development summary |
| Simplify | Three workflow paths and workspace gate | One recommended path from queue to draft; advanced choices hidden or removed |
| Simplify | Per-agent default UI panels | Concise editorial brief first; detailed reviews expandable |
| Simplify | Dashboard/"Open workspace" landing | Queue becomes the root route |
| Add | Themes, priority/reordering, reader/output relationship | New thin migrations and queue UI |
| Add | Explicit user-provided versus application research | Research artifacts and cited source records |
| Defer | OAuth, RBAC, tenancy, cloud hosting, Docker, PostgreSQL, pgvector, embeddings, queues | Not needed for local MVP |
| Defer | Full analytics, automated publishing, social scraping, automated trends, fine-tuning | Not needed to publish next week |
| Remove from normal UX | BOK/voice uploads, provider administration screens, enterprise dashboard KPIs | Sources stay filesystem-managed; advanced configuration is file/Keychain based initially |

## Technical mentor critique and guardrails

1. **Keep the idea queue trustworthy.** Immediate save needs a visible confirmation and a simple way to reopen and edit every idea. Never make an AI call just to capture a thought.
2. **Separate evidence from opinion.** The system must label KK’s observation, supplied evidence, BOK context, and external research separately. That protects author ownership and prevents a polished draft from seeming more substantiated than it is.
3. **Avoid a two-draft tax.** A derived short post exists only when the author selected the paired output shape, and it must remain tied to the exact article version that produced it.
4. **Research needs provenance before breadth.** A small cited brief with dates and source links is more useful and safer than an uncited claim of broad market awareness. Web research introduces cost, rate limits, changing results, and prompt-injection exposure from third-party pages; sanitize and treat all fetched text as untrusted.
5. **Use models as reviewers, not authority.** The concise brief should make uncertainty, missing evidence, and disagreement visible. It must never silently convert weak research into confident claims.
6. **Do not over-engineer reordering.** A manual numeric priority plus simple move-up/move-down actions is more robust than drag-and-drop, algorithms, or a Kanban engine for the first usable release.
7. **Local does not mean no security.** Loopback-only binding, no committed keys, server-side validation, output escaping, dependency/secret scans, database backups, and prompt-injection defenses remain required. Full authentication is unnecessary for a single-user Mac if the service is not exposed beyond localhost.
8. **Preserve a simple backup path.** Provide documented SQLite backup/export before migrations and before the first real content is entered. This matters more now than analytics.

## Open implementation choices, with recommended defaults

| Choice | Recommended default | Why |
| --- | --- | --- |
| Research transport | Explicit, provider-backed web research adapter with a manual-paste fallback | Enables current research need without blocking on a bespoke crawler |
| Delivery channel | User records the actual channel only in Finalize | Avoids letting distribution shape the reader contract or editorial work |
| General AI theme | Leave blank by default; offer “General AI” as a selectable theme | Avoids turning optional classification into friction |
| Ordering | Numeric priority and move controls | Small, testable, reliable |
| Live-model rollout | Keep deterministic mock for tests; enable one provider at a time after queue flow works | Separates UX refactor from credential/provider debugging |
