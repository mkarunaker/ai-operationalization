# AI Editorial Board — Build Roadmap

## Purpose

This roadmap converts the approved lean product direction and the 2026-08-06 alignment audit into bounded implementation milestones. The product is a local, single-user thinking and writing workspace. The first reliable release must take one rough idea through a genuinely BOK-grounded editorial review into a voice-aligned LinkedIn draft with visible provenance and cost.

Work one milestone at a time. Stop at every checkpoint. Do not begin the next milestone until the current milestone's acceptance criteria, tests, status update, and user review are complete.

## Source-of-truth order

Until Milestone 0 resolves the documentation conflict, use this precedence:

1. Explicit user decisions in the current build conversation
2. This roadmap and the approved lean direction in `LEAN_PRODUCT_SCOPE.md`
3. `AI_Editorial_Board_Spec.md` for requirements not superseded by the lean direction
4. `IMPLEMENTATION_PLAN.md` and `IMPLEMENTATION_STATUS.md` as historical implementation records, not proof that a feature works

The Book of Knowledge and voice skill are authoritative content sources:

- BOK: configured `EAIO_Canonical_Knowledge_Base.md`
- Voice: configured `~/.codex/skills/kk-spoken-voice`

Do not modify either source during application milestones unless the user explicitly authorizes a content change.

The independent 2026-08-07 completeness audit is recorded in `AUDIT_2026-08-07.md`. Its required remediation checkpoint takes precedence over beginning Milestone 5.

## Delivery tracking

`BUILD_ROADMAP.md` is the single active delivery plan. `IMPLEMENTATION_STATUS.md` records checkpoint evidence and the next action; `AUDIT_2026-08-07.md` preserves dated independent-audit evidence and dispositions. These are intentionally distinct so that an old audit finding cannot be mistaken for the current build state.

The dates below are planning targets, not promises: each milestone still stops for its acceptance criteria, local validation, and a user checkpoint. A scope change or a failed audit moves later targets rather than silently compressing quality work.

| Phase | Status on 2026-08-08 | Target completion | Exit condition |
|---|---|---:|---|
| Foundation: Milestones 0–2 | Complete | 2026-08-07 | Lean contract, queue, grounded deterministic writing path |
| Controlled execution: Milestones 3–4 | Complete | 2026-08-07 | Cost-controlled live path, revision loop, provenance |
| Publication: Milestone 5 + publication UX audit-gap checkpoint | Complete | 2026-08-08 | LinkedIn-only and canonical-plus-companion flows, immutable published outputs |
| Capture-to-Develop UX checkpoint | Planned | Before Milestone 6 | Optional author title at capture, concise suggested title on Develop, and automatic transition into the new idea |
| Research and evidence: Milestone 6 | Planned | 2026-08-12 | Manual-first evidence workflow, explicit application research, citations, injection tests |
| Learning loop: Milestone 7 | Planned | 2026-08-14 | Manual feedback, follow-up ideas, Notebook history and explicit Notebook-to-Inbox flow |
| Full visual companions: Milestone 8 | Planned | 2026-08-16 | Approved, traceable, platform-aware visuals beyond the current narrow deterministic SVG slice |
| Local personal MVP release gate: Milestone 9 | Planned | 2026-08-19 | Security, recovery, production-mode validation, and honest technical-debt handoff |

The next active item is the Capture-to-Develop UX checkpoint. Milestone 6 may begin only after that checkpoint and the completed publication UX checkpoint have been independently reviewed or accepted by the user. No future-milestone work is implied by these planning dates.

## Non-negotiable working rules

- Before changing any agent execution, provider adapter, prompt, retrieval source, research capability, or rich-content renderer, read and apply `docs/AGENT_SECURITY_GUARDRAILS.md`. Its security verification gate is required evidence for the milestone checkpoint.
- Preserve the local SQLite database and existing user content.
- Create and verify a recoverable database backup before schema or data migrations.
- Never commit API keys, environment files, Keychain data, database files, BOK content, Notebook content, or private source material.
- Bind the application to `127.0.0.1:3100`.
- Treat user notes, BOK text, research pages, and retrieved content as untrusted model input.
- Never claim that BOK, voice, research, or a reviewer influenced an output unless immutable provenance proves it.
- Keep deterministic providers for automated tests, but label simulated output clearly in the UI.
- Use low-cost models by default. Estimate cost before paid execution and enforce the run budget cap.
- Run type checks, lint, tests, migrations, production build, secret scan, dependency audit, and relevant end-to-end tests at each checkpoint.

---

## Milestone 0 — Freeze the lean product contract

### Objective

Establish one unambiguous product contract and vocabulary before further feature work.

### Scope

- Record the lean single-user direction as approved.
- Mark the old dashboard, five-question intake, and three-path workflow as legacy.
- Preserve `AI_Editorial_Board_Spec.md`; do not rewrite it during this milestone.
- Normalize the canonical public theme names everywhere:
  1. See through the AI hype
  2. Understand the operationalization gap
  3. Improve leadership judgment
  4. Select the right work
  5. Build, adopt, and operate with principles
- Treat the proposed content map as editorial working material, not canonical BOK content.
- Name its system-design sequence `B1–B6` so it does not collide with canonical BOK principles P1–P8.
- Resolve stale or contradictory README, architecture, plan, and status statements.
- Inventory current tracked, untracked, ignored, and generated files before committing anything.
- Back up the current SQLite database and verify that the backup opens.

### Acceptance criteria

- One short decision record states the active product scope and document precedence.
- BOK, Notebook template, database seed themes, migrations, and UI use the same five exact theme names.
- No document describes mock editorial intelligence as complete production behavior.
- Legacy routes and services are clearly labelled; removal is deferred until their useful pieces are migrated.
- Database backup and restore instructions are documented and tested on a copy.
- No BOK, voice, database, Notebook, secrets, archive, or user reference assets are staged for Git.

### Checkpoint report

Report the authoritative documents, normalized terms, backup path and verification, contradictions resolved, remaining legacy surfaces, and test results. Stop.

---

## Milestone 1 — Repair the lean workflow and make it honest

### Objective

Make the existing queue and workspace reliable before connecting live editorial intelligence.

### Scope

- Fix the request-function contract affecting title editing and queue movement.
- Add or verify usable status actions, including Parked.
- Keep queue layout stable for zero, one, or many filtered ideas.
- Preserve original capture, notes, themes, status, priority, and publication plan.
- Keep the initial editorial brief expandable, the most recent review actionable, and prior reviews collapsed behind a count.
- Ensure every review memo is tied to the exact draft version it assessed.
- Rename inaccurate UI claims such as “BOK context used” until provenance exists.
- Clearly identify deterministic board and draft output as simulation/test output.
- Ensure editing a draft invalidates checks or recommendations tied to an older version.

### Acceptance criteria

- Title edit, move up/down, status changes, theme changes, notes, save/reopen, and Parked work through the UI.
- Zero-, one-, and multi-item filters share identical top alignment.
- Review history remains immutable and version-linked across at least ten simulated review passes.
- No current screen implies that mock reviewers used BOK or voice instructions.
- End-to-end tests cover capture, development, title edit, reorder, park/unpark, board simulation, draft edit, review history, and publication record.
- Existing user data remains readable after migrations.

### Checkpoint report

List repaired behaviors, migration impact, mock disclosures, automated and manual test results, and remaining limitations. Stop.

---

## Milestone 2 — Build one genuinely grounded LinkedIn vertical slice

### Objective

Deliver the first trustworthy path: rough idea → BOK-grounded Board → synthesis → voice-aligned LinkedIn draft.

### Required execution order

```text
Capture and development snapshot
→ retrieve relevant BOK sections
→ independent Strategist, Skeptic, and Editor reviews
→ Synthesizer receives completed reviewer outputs
→ concise editorial brief
→ Initial Drafting Agent creates the working draft
→ user edits and saves a version
```

### Scope

- Create one orchestration path used by the visible lean UI.
- Reuse or consolidate the stronger provider, prompt, structured-output, and retrieval foundations currently bypassed by `src/lean/service.ts`.
- Freeze a development snapshot containing the original idea, notes, clarification answers, selected themes, publication plan, and source versions.
- Retrieve only relevant BOK sections; do not send the full BOK.
- Persist each selected section and retrieval score in `retrieval_records` before displaying it as used.
- Apply a strict trust boundary around user and retrieved text.
- Run reviewers independently; they must not receive one another's output.
- Feed successful reviews and explicit failures to the Synthesizer.
- Generate the draft only after synthesis.
- Load and apply the configured voice skill to drafting.
- Persist immutable prompt, BOK, voice, provider, model, and pricing versions with the run and resulting draft.
- Use structured output validation and bounded repair attempts.

### Acceptance criteria

- Changing clarification answers or relevant BOK context can materially change the review and draft in deterministic tests.
- Every displayed BOK passage has a matching retrieval record tied to that run.
- The exact BOK and voice versions used are visible in expandable provenance.
- The generated draft contains no em dashes and passes explicit voice rules.
- The Synthesizer demonstrably receives all completed reviewer outputs.
- Failed or partial reviewers are visible and cannot be silently represented as successful.
- The working draft is created after the editorial brief, not before it.
- LinkedIn-only output follows the configured reader, tone, posture, and approximate 1–2 minute length.
- Prompt-injection test cases cannot alter system instructions, request secrets, or authorize tools/actions.

### Checkpoint report

Show one complete test case with idea snapshot, BOK provenance, role/model assignments, concise brief, working draft, voice version, usage/cost record, and injection-test results. Stop.

---

## Milestone 3 — Live low-cost models, routing, budgets, and escalation

### Objective

Replace the visible simulation with controlled live execution while retaining deterministic tests.

### Scope

- Enable one live provider first; add others only after the provider contract is proven.
- Keep roles independent of vendors and concrete model names.
- Configure low, medium, and high capability tiers by role.
- Display role, provider, model, pricing basis, token estimate, and projected cost before execution.
- Enforce a per-run budget cap.
- Prevent automatic escalation when projected cost exceeds the cap.
- Record the reason for every escalation.
- Allow one reviewer to be rerun without rerunning the entire Board.
- Preserve all prior runs and compare the accepted result with the lower-cost result.
- Store input, output, cached, and reasoning tokens when available; latency; estimated and actual cost; pricing assumptions; failures; request IDs; and escalation reason.

### Acceptance criteria

- The default path uses low-cost configured models.
- Missing credentials produce a clear local configuration message without exposing secret values.
- A budget-exceeding run is blocked before any paid call.
- One-role escalation works and does not overwrite or rerun unrelated reviews.
- Provider/model use and cost are visible for every call.
- Simulation and live modes are visually unmistakable.
- No key is stored in Git, SQLite, logs, browser storage, or client-rendered data.

### Checkpoint report

Provide successful low-cost and blocked-budget examples, one-role escalation evidence, cost telemetry, credential-safety checks, and provider limitations. Stop.

---

## Milestone 4 — Editorial revision loop and publication readiness

### Objective

Support repeated human editing and targeted editorial review without clutter or lost history.

### Scope

- Preserve the original editorial brief as the idea-level baseline.
- Show the newest draft review open by default.
- Show draft version and prior-review count.
- Keep prior review memos expandable and tied to immutable draft versions.
- Classify each original recommendation as resolved, still open, revised, or superseded; never silently remove it.
- Allow targeted Strategist, Skeptic, or Editor reruns.
- Keep “ready to publish” advisory; it must not act as an automated approval gate.
- Run the explainable human-voice pattern check against the exact current version.
- Require the user to make the final publication decision.

### Acceptance criteria

- Ten revision/review cycles remain navigable without showing ten full reviews at once.
- Editing after review clearly marks the prior review as belonging to an older version.
- Targeted reviewer reruns are persisted separately.
- Recommendation status is based on reviewer output or explicit user disposition, not brittle regex inference.
- Publishing stores the exact reviewed/approved text and associated provenance.

### Checkpoint report

Demonstrate a multi-version review history, targeted rerun, stale-review state, final voice check, and publication record. Stop.

---

## Required audit remediation checkpoint — before Milestone 5

### Objective

Correct the completeness, security, cost-default, data-safety, and repository-state findings in `AUDIT_2026-08-07.md` before expanding the product surface.

### Acceptance criteria

- Every state-changing route enforces the same local loopback, JSON content-type, origin, and cross-site protections.
- A recommendation disposition saved after final review remains visible after reload.
- Loading an idea or live-run estimate does not refresh or index filesystem content.
- Committed budget fallbacks match the documented USD 0.05 default and USD 0.25 maximum.
- A current owner-only database backup passes integrity and restore checks before migrations are applied to meaningful data.
- Escalation acceptance, influence, and material improvement can be recorded without automatically escalating or rerunning the Board.
- Current status documentation no longer presents superseded provider policy as active.
- Typecheck, lint, unit/integration tests, migrations, production build, deterministic end-to-end tests, secret scan, dependency audit, and diff checks pass without provider calls.
- The exact Git staging set reproduces the tested application and excludes all user content, databases, backups, credentials, and environment files.

### Checkpoint report

Report every audit finding as fixed, deferred with explicit approval, or still open. Include validation evidence and the reviewed staging inventory. Stop before Milestone 5.

---

## Milestone 5 — Publication formats and LinkedIn companions

### Objective

Support the user's real publishing choices without creating unnecessary branching during intake.

### Scope

- LinkedIn only: approximately 1–2 minute read.
- Medium or Substack canonical article: approximately 3–4 minute read.
- Optional LinkedIn companion created only when the user explicitly selects a long-form plus LinkedIn plan.
- Generate the long-form canonical draft first.
- Generate the LinkedIn companion from the exact user-approved canonical version.
- Store the canonical/companion relationship and separate version histories.
- Preserve platform-appropriate structure without forcing one template.

### Acceptance criteria

- Each publication plan produces materially different, appropriate output.
- A companion cannot be generated from an unapproved or stale long-form draft.
- Editing the canonical article marks an existing companion stale.
- Both outputs remain grounded in the same approved claims and provenance.
- Publication records support LinkedIn, Medium, and Substack independently.

### Checkpoint evidence — 2026-08-07

- Migration 011 adds explicit draft formats and immutable canonical-approval records without rewriting existing drafts.
- LinkedIn-only plans create a standalone 1–2 minute draft. Medium, Substack, and their companion plans create the canonical 3–4 minute article first.
- A LinkedIn companion can be created only from the exact approved canonical draft version. It is stored as a separate draft, linked to its source version, and blocked from publication when stale or unlinked.
- Editing the canonical article creates a new canonical version and makes earlier companion versions visibly stale; approving the new version and generating a replacement is an explicit user action.
- Local integration and deterministic browser coverage demonstrate LinkedIn-only, long-form-plus-companion, approval, stale state, and publication safety without a provider call.

### Checkpoint report

Demonstrate LinkedIn-only and long-form-plus-companion examples with version relationships and stale-state handling. Stop.

---

## Required publication UX audit-gap checkpoint — before Milestone 6

### Objective

Close the lifecycle and published-output gaps identified by the 2026-08-07 read-only follow-up audit. Do not begin Milestone 6 until this checkpoint passes.

### Required work

1. Prevent a dual-output plan from becoming stranded when the canonical article is published before a current LinkedIn companion has been prepared. Prefer blocking that premature publication so both outputs are prepared in Write and remain independently publishable in Finalize.
2. Centralize published-workflow assertions in the service layer. Direct service calls, API routes, and UI controls must enforce the same exact-output policy for Board runs, reviewer reruns, development changes, draft edits, reviews, voice checks, visuals, and duplicate publication.
3. Disable every content-changing post-publication control, including targeted reviewer reruns and optional polish actions. Decide and document whether recommendation dispositions and escalation assessments remain editable as retrospective annotations.
4. Make the publication-linked voice-check boundary exact-version aware, or explicitly narrow the policy if the pure local text checker is intentionally retained as a version-independent utility.
5. Separate live-run budget warnings from the free deterministic test. The deterministic action must visibly state `$0.00` and `no provider call` and must never appear to require a live budget increase.
6. Replace remaining user-facing `Draft` stage language with `Write` where it refers to navigation rather than a saved draft artifact.
7. Reconcile current documentation by adding dated follow-up dispositions while retaining historical audit evidence.

### Acceptance criteria

- A Medium/Substack-plus-LinkedIn plan cannot reach a UI state where publishing the article prevents completion of the planned companion.
- A current unpublished companion remains independently reviewable, voice-checkable, and publishable after the canonical article receives its publication record.
- Published exact versions are immutable through UI, API, and direct service calls.
- No active content-changing control is shown for a published exact version.
- Exact draft ID, format, platform, text, review, voice-check acknowledgement, visual, and publication provenance remain aligned.
- A stale or mismatched companion cannot be finalized or published.
- The deterministic test is clearly separate from live execution and live budget validation.
- Current status documents no longer overstate completed lock behavior.

### Required regression coverage

- LinkedIn-only publication and post-publication locks.
- Normal Medium-plus-LinkedIn preparation and independent publication.
- Out-of-order Finalize access before companion creation.
- Canonical-first publication recovery or prevention, according to the selected policy.
- Direct service and route rejection for every locked post-publication mutation.
- Every applicable UI control disabled after publication.
- Exact text, format, platform, voice-check, and publication-record identity for both outputs.
- Deterministic execution without live-budget messaging or provider calls.
- Malicious stored-note and malicious retrieved-BOK containment.

### Checkpoint report

Run the complete local-only validation sequence, update `IMPLEMENTATION_STATUS.md` and the dated audit disposition, and stop. Do not begin Milestone 6 until every required item is fixed or explicitly deferred with user approval.

### Completion record — 2026-08-08

Complete, including the 2026-08-08 follow-up exact-version audit remediation. The dual-output sequencing guard, service and UI published-output locks, exact-version review/voice/publication boundaries, atomic publication persistence, deterministic-test disclosure, Write terminology, hostile stored/retrieved-content regression coverage, and documentation reconciliation were implemented. Publication cannot create a draft; generic saves cannot create an unlinked companion; and queue movement cannot mutate published workflow history. Local-only validation passed: TypeScript, ESLint, 21 test files / 78 tests, 12 migration files in validate-only mode, production build, two deterministic Playwright workflows, secret scan, dependency audit, and diff check. `IMPLEMENTATION_STATUS.md` and `AUDIT_2026-08-07.md` contain the detailed evidence and remaining limitations. No provider call, migration application, BOK/voice change, staging, commit, or push occurred.

---

## Capture-to-Develop UX checkpoint — before Milestone 6

### Objective

Make the first transition after a quick capture feel intentional without adding friction: the author can supply a title immediately or accept a concise suggested title while developing the idea.

### Scope

- Add an optional title field to the Inbox capture form. It must not be required to save an idea.
- When no title is supplied, retain the existing concise local title suggestion rather than using the full capture text.
- After a successful capture, navigate directly to that idea's Develop stage instead of leaving the author on the queue.
- On Develop, show the current suggested or supplied title clearly and provide an obvious, lightweight way to edit it before proceeding.
- Preserve immediate local persistence, no-provider capture, and existing title/edit/audit history behavior.

### Acceptance criteria

- A user can save a body-only capture and land on its Develop page with a concise suggested title.
- A user can save a capture with a title and land on its Develop page with that exact title.
- Capture remains usable with no title and makes no model or provider call.
- A user can update the title from Develop; reload preserves the saved title.
- Existing queue capture, title editing, and published-workflow locks continue to work.
- Route, service, and browser regression coverage verifies both title paths and the automatic navigation.

### Validation

Run TypeScript, ESLint, focused service/route tests, deterministic Playwright, production build, secret scan, dependency audit, and `git diff --check`. Stop at this checkpoint; do not begin Milestone 6 in the same change set.

---

## Milestone 6 — Research and evidence handling

### Objective

Add optional current research without allowing it to replace the user's point of view or introduce untraceable claims.

### Scope

- Manual research mode first: the app asks focused research questions and accepts user-provided findings and links.
- Application research runs only when explicitly requested.
- Make research time-bounded and source-bounded.
- Store evidence separately from interpretation.
- Record source URL, title, publication date, access date, excerpt/summary, and provenance.
- Treat all external content as untrusted and prevent it from issuing instructions.
- Do not generate the post automatically from research results.
- Add epistemic labels: fact, evidence, observation, pattern, opinion, hypothesis, and recommended default.

### Acceptance criteria

- Supplied and application research are visibly distinct.
- Every external claim in an editorial brief can be traced to a stored source or marked as unsupported/interpretive.
- Research cannot trigger tools, reveal secrets, change system instructions, or bypass approval.
- The UI does not imply comprehensive market coverage.
- Research cost and model/tool usage are tracked.

### Checkpoint report

Show manual and application-research examples, evidence/interpretation separation, citations, injection tests, and cost records. Stop.

---

## Milestone 7 — Feedback loop and Editorial Notebook integration

### Objective

Turn publishing experience into reusable learning without building a large analytics system.

### Scope

- Record impressions, reactions, comments, reposts, saves, direct feedback, questions raised, surprises, meaningful conversations, and follow-up ideas manually.
- Add Notebook version browsing and comparison.
- Allow a Notebook candidate post to be sent to the Inbox explicitly.
- Never promote Notebook material into the BOK automatically.
- Keep content-map drafts labelled as proposed until deliberately approved.

### Acceptance criteria

- Feedback can be recorded and revisited for a publication.
- A follow-up idea can be created while retaining its source publication relationship.
- Notebook history can be browsed without mutating immutable snapshots.
- Notebook-to-Inbox requires explicit user action.
- No automatic BOK modification exists.

### Checkpoint report

Demonstrate publication feedback, a follow-up idea, Notebook history, and Notebook-to-Inbox provenance. Stop.

---

## Milestone 8 — Optional visual companions

### Objective

Create memorable visuals only when they materially improve understanding.

### Scope

- Let the Board recommend a visual for frameworks, comparisons, sequences, decision paths, or system principles.
- Produce a visual brief containing purpose, audience, key message, format, source claims, labels, and alt text.
- Require user approval before rendering or invoking an image-generation provider.
- Prefer deterministic diagrams for factual frameworks and relationships.
- Use generative imagery only when illustration adds value.
- Persist the visual brief, exact source draft, BOK/research claims, prompt, provider/model, cost, generated asset, and publication relationship.
- Never invent quantitative chart data.
- Save local visual artifacts as `data/<title-name>/draft_<number>_<datetime>.svg`; reuse the title directory instead of creating a directory per version.
- Use the same recognizable draft-and-timestamp naming convention for downloaded assets.
- Allow a Medium/Substack article to have a lead visual and up to two supporting visuals when useful; its optional LinkedIn companion may use a separate platform-appropriate visual.
- Provide editable visual suggestions for labels, caption, alt text, structure, and platform use before rendering.

### Acceptance criteria

- Posts without a useful visual receive no forced recommendation.
- A principles-based post can produce an accurate, legible diagram tied to the approved draft.
- Every factual visual element is traceable to the draft, BOK, or cited research.
- Alt text and platform-appropriate dimensions are generated and editable.
- Rendering requires explicit approval and respects the budget cap.
- Every saved and downloaded asset is identifiable by title, exact draft number, and timestamp.

### Checkpoint report

Demonstrate one diagram-worthy post and one text-only post, provenance, approval, accessibility, and cost. Stop.

---

## Milestone 9 — Security, recovery, and release gate

### Objective

Verify that the local application is safe and recoverable enough for regular personal use.

Security is tested during every milestone; this milestone is the final release audit.

### Scope

- Enforce JSON content types and validate request origins for state-changing local routes.
- Review CSRF exposure for localhost execution.
- Remove production CSP allowances such as `unsafe-eval` where the production runtime permits.
- Expand secret scanning and verify repository history for accidental credentials.
- Test prompt injection, indirect injection, data exfiltration, malformed structured output, oversized input, stored content rendering, and provider failure.
- Verify file and database permissions.
- Test backup, restore, migrations, and rollback instructions on copies.
- Remove or archive unused legacy routes only after their useful logic has been consolidated.
- Run complete production-mode end-to-end tests.

### Acceptance criteria

- Typecheck, lint, unit, integration, migration, production build, secret scan, dependency audit, and full end-to-end suite pass.
- No high or critical dependency vulnerabilities remain.
- No secrets appear in tracked files, logs, database content, client bundles, or test artifacts.
- All model-influencing sources have provenance and trust boundaries.
- Backup and restore are successfully exercised.
- The application can complete the full supported workflow in production mode on `127.0.0.1:3100`.
- Remaining limitations and technical debt are documented honestly.

### Final release label

Use **“local personal MVP”** only after Milestones 0–5 and 9 pass. Milestones 6–8 may ship afterward without blocking the core writing workflow.

## Execution prompt for GPT-5.6-terra

Use `BUILD_ROADMAP.md` as the active implementation sequence. Begin by reading the entire roadmap, the active lean-scope documents, implementation status, current git status/diff, and the files named by the selected milestone. Work only on the next incomplete milestone. Before changing code, state the objective, acceptance criteria, files, migration and data-safety implications, security considerations, and verification plan. Preserve unrelated and user-owned changes. Do not modify the BOK or voice skill unless explicitly authorized. Implement, test, update `IMPLEMENTATION_STATUS.md`, report evidence and technical debt, and stop at the milestone checkpoint.

## Final pre–Milestone 6 closure record — 2026-08-08

Complete, pending one independent read-only audit. This closure pass enforces canonical-first publication for Medium/Substack plus LinkedIn, dependency-aware output immutability, same-content companion relationships, and atomic companion creation/editing in the service layer. Finalize now visibly disables companion publication until its exact canonical source has a publication record.

- Migration `013_publication_and_companion_integrity.sql` adds database-enforced one-publication-per-draft and one-parent-per-companion constraints. It was validated only on temporary test databases and was not applied to meaningful local data. The established owner-only backup and integrity procedure remains required before local application; a historical duplicate will fail safely rather than being rewritten.
- Production-mode browser tests use a newly created temporary database and synthetic BOK/voice fixtures. Startup indexing is explicit and limited to those fixtures; ordinary page load and live-cost preview stay read-only.
- Validation passed: TypeScript, ESLint, 21 test files / 82 tests, 13 migrations validate-only, production build, 2 deterministic production-mode Playwright flows, 124-file secret scan, dependency audit with 0 vulnerabilities, and staged/unstaged diff checks.
- Private source contents and secrets were not manually inspected, exposed, copied, or modified. Automated tests used synthetic sources. No external model provider was called. This closure pass did not stage, commit, push, or reset files; pre-existing staged and unrelated working-tree changes remain preserved. Milestone 6 did not begin.

The next step is an independent audit of this final diff. If it finds only optional improvements, record them as technical debt and begin Milestone 6; fix only genuine data-loss, security, publication-integrity, or workflow-blocking defects first.

## Post-audit remediation record — 2026-08-08

The independent audit found two required closure gaps. They are resolved in the working tree, pending a fresh read-only audit:

- Normal runtime services, indexing, Board execution, and progress reads no longer call `migrateDatabase`. Only `npm run db:migrate` applies schema changes. An owner must run `npm run db:backup` before applying pending migrations to meaningful local data.
- Obsolete standalone canonical and LinkedIn approval routes were retired. The only approval-and-creation path is the immediate transaction in `createLinkedinCompanion`, which creates the canonical approval, companion draft, and relationship together.
- Regression coverage proves that runtime database opening neither creates nor applies pending migration 013, and that the retired route actions cannot leave partial approval state.
- Local-only validation passed: TypeScript, ESLint, 22 test files / 84 tests, 13 migration files validate-only, production build, two deterministic production-mode Playwright flows, a 125-file secret scan, dependency audit with 0 vulnerabilities, and staged/unstaged diff checks.

The owner completed the verified backup and explicit migration-013 application recorded below. Milestone 6 remains out of scope until this remediation receives a fresh independent audit.

### Owner-controlled migration application — 2026-08-08

- `npm run db:backup` created and restore-validated the owner-only backup `data/backups/ai-editorial-board-remediation-20260808T201602061Z.sqlite`.
- `npm run db:migrate` then applied `013_publication_and_companion_integrity.sql` successfully.
- No BOK, voice skill, provider, or secret was accessed or changed.
