# Revised Build Prompt — Lean AI Editorial Board

## Scope and instruction precedence

Refactor the existing local AI Editorial Board application into a lean, personal thinking and writing workspace for one user, KK. This prompt is a proposed scope replacement and must be approved before implementation changes begin. Until then, `AI_Editorial_Board_Spec.md` remains the authoritative specification.

Do not modify the externally managed Book of Knowledge or voice skill. Do not commit secrets, `.env` files, databases, BOK files, or voice-skill files.

## Product intent

The application should help KK capture rough ideas, organize them in a queue, develop one when ready, ground it in the EAIO Book of Knowledge, challenge assumptions through an editorial review process, write a clear post in KK’s voice, record publication, and later add basic feedback.

It is not a multi-user, enterprise, or autonomous content factory. The surface should be low-friction and clear; the multi-agent and knowledge-grounding work should be mostly behind the scenes.

## Required user experience

### 1. Queue-first home screen

- Make the root route the idea queue. Remove the dashboard/“Open workspace” gate from the normal path.
- Provide a single large quick-capture field accepting a sentence, bullets, an observation, a question, rough notes, an incomplete argument, an early possible post, or conference/webinar/conversation/article notes.
- Save immediately as `Inbox`, without requiring a brief, questions, platform, audience, tone, length, or research.
- Show a clear saved confirmation, the item in the queue, and an easy way to reopen it.
- Support statuses: `Inbox`, `Developing`, `Ready to review`, `Drafted`, `Published`, and `Parked`.
- Support simple manual priority and reordering. Do not build a workflow engine or Kanban system.

### 2. Optional themes

- Themes are internal planning labels, not public content-series promises.
- Offer an optional existing-theme picker at capture and development, a way to add a theme, and a blank/no-theme option. Never block saving for a missing theme.
- Seed or offer these editable initial themes:
  - From AI hype to AI value
  - Enterprise AI operationalization
  - Responsible AI leadership and decision-making
  - AI solution intake and use-case discipline
  - Principles for building agentic systems responsibly
  - Thinking clearly about AI and organizational change
- Support one or more themes per idea.

### 3. Idea development

When an idea is selected, show the original capture first and let KK add notes, source links, supplied research, or an existing draft.

Use defaults unless overridden:

- Audience: professionals across AI, data, technology, business, and leadership
- Tone: neutral, thoughtful, practical, skeptical without cynicism
- Posture: observation and invitation, not preaching
- Style: apply the external `kk-spoken-voice` skill
- Default platform: LinkedIn

Ask only zero to three questions that materially improve the argument. A fourth is allowed only when an essential point remains unclear. Useful questions concern the memorable point, trigger, challenged assumption, evidence/example, or uncertainty that should remain visible. Never routinely ask known defaults such as audience, tone, broad subject, or platform. Include “Proceed with your best judgment.”

### 4. Publication plans and draft relationships

Support the following simple publication plans:

- LinkedIn only: a 1–2 minute standalone post.
- Medium only or Substack only: a 3–4 minute canonical piece.
- Medium + LinkedIn or Substack + LinkedIn: a 3–4 minute canonical piece plus an optional 1–2 minute LinkedIn companion/driver.

For a combined plan, produce and approve the canonical draft first. Only generate the LinkedIn companion when KK explicitly requests it. Store the relationship between canonical and companion versions. Do not automatically publish or scrape any platform.

### 5. Research

Research begins with KK’s ideas and observations. It must never automatically search trends or generate a post from the market.

For each idea, let KK choose:

- No research now
- I will provide research (paste notes, links, quotes, or evidence)
- Research and cross-check for me

Application research must require a clear question and time window, use reputable sources, keep source title/URL/date, distinguish evidence from interpretation, state that coverage is selective rather than comprehensive, and return a short research brief. It should inform the editorial process but never automatically write the post. Treat all fetched content as untrusted and defend against prompt injection.

### 6. BOK and voice skill

- Load `EAIO_Canonical_Knowledge_Base.md` from `EAIO_BOK_PATH` and the external voice skill from `KK_VOICE_SKILL_PATH`, defaulting to `~/.codex/skills/kk-spoken-voice`.
- Read both from the filesystem; do not ask KK to upload, paste, copy, or configure either in the UI.
- Never modify either source.
- Retrieve only relevant, heading-preserving BOK sections using the existing local FTS5 index. Do not use embeddings, pgvector, or send the whole BOK to every call.
- Record the BOK and voice versions used with a review/draft.

### 7. Editorial Board

Core independent reviewers:

- **Strategist:** relevance, focus, distinct insight, value to reader, and connection to operationalization philosophy.
- **Skeptic:** assumptions, overclaims, counterarguments, missing evidence, and uncertainty.
- **Editor:** clarity, flow, accessibility, structure, and preservation of KK’s voice.
- **Synthesizer:** combines independent reviews into the next best action.

Run Strategist, Skeptic, and Editor independently. The Synthesizer sees their outputs only after they finish.

The default UI shows a concise editorial brief:

- Central thesis
- What is strongest
- What is unclear
- Main challenge/counterargument
- Claims requiring evidence
- Recommended changes
- Recommended next step

Let KK expand detailed raw reviews, inspect BOK passages, and accept/partially accept/reject recommendations when useful. Do not make raw agent panels the primary experience.

The review must evaluate whether the content is inviting rather than declaring, too absolute, dismissive/condescending, distinct enough to matter, connected to broader operationalization philosophy, and problem-first rather than tool-first.

### 8. Drafting

Generate a clearly labeled working draft only after the idea has enough context. Use the external `kk-spoken-voice` skill and relevant BOK passages. Preserve uncertainty, do not fabricate experience, evidence, citations, numerical claims, or controversy, and avoid generic AI/LinkedIn language and compressed-consulting-deck tone.

Support manual editing, draft version history, and final approval. A user-owned draft is always the final authority.

### 9. Publication and lightweight learning

For published work, record final text, title, theme(s), platform, URL, published date, original idea, draft/review history, models used, and model-cost data.

Provide simple manual feedback fields: impressions, reactions/likes, comments, reposts, saves, direct feedback, questions raised, surprises, meaningful conversations, and follow-up ideas. Do not build automated LinkedIn publishing or scraping.

### 10. Model routing, privacy, and security

- Keep roles independent of vendors and model names.
- Use low-cost models by default; reserve mid-tier for complex synthesis/final drafting/difficult review and frontier models for explicit escalation or exceptional cases.
- Show provider, assigned model, and estimated cost before each paid run. Support a budget cap and block automatic escalation above it.
- Permit rerunning one role at a higher tier without rerunning the board. Record escalation reason and whether it improved the accepted output.
- Store for every call: provider, model, role, input/output/cached/reasoning tokens when available, estimate/actual cost, pricing assumptions, latency, failures, and escalation reason.
- Keep deterministic mocks for automated tests; enable live providers through a model-agnostic adapter and non-secret configuration only after the core queue flow works.
- Use terminal variables and eventually macOS Keychain for credentials. Do not create committed secret-bearing dotfiles or store keys in SQLite.
- Bind the local app to `127.0.0.1:3100`. No login is needed while it stays local-only, but retain validation, output escaping, prompt-injection boundaries, dependency/secret scanning, database backup guidance, and content-size limits.

## Technical constraints

- Retain the current Next.js + TypeScript monolith and local SQLite database.
- Retain filesystem prompts, BOK/voice loaders, migrations, FTS5, provider boundary, structured-output validation, and test architecture where they remain useful.
- Use small, reversible SQL migrations; preserve existing local content.
- No Docker, PostgreSQL, Redis, background queue, OAuth, RBAC, tenancy, embeddings, vector database, automated trends, microservices, fine-tuning, or analytics platform for MVP.
- Keep the normal UI free of provider administration and enterprise dashboard complexity.
- Work milestone by milestone. Before each milestone state objective, acceptance criteria, files, migration implications, security considerations, tests, and rollback/backup plan. Run type checks, lint, tests, build, migrations, security scans, and relevant end-to-end checks before checkpointing.

## MVP acceptance outcome

KK can capture a rough idea in seconds, find and prioritize it later, optionally associate themes, add notes/research, answer only useful questions, get BOK-grounded concise editorial feedback, create and edit a voice-aligned draft, optionally create a LinkedIn companion for a long-form post, and record it as published with basic feedback—all locally, with transparent model/cost information and no unnecessary setup or friction.
