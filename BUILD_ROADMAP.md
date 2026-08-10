# AI Editorial Board — Build Roadmap

## Purpose

This roadmap converts the approved lean product direction and the 2026-08-06 alignment audit into bounded implementation milestones. The product is a local, single-user thinking and writing workspace. The first reliable release must take one rough idea through a genuinely BOK-grounded editorial review into a voice-aligned reader-appropriate output with visible provenance and cost.

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
| Capture-to-Develop UX checkpoint | Complete | 2026-08-08 | Optional author title at capture, concise suggested title on Develop, and automatic transition into the new idea |
| Board and companion truthfulness closure checkpoint | Complete | 2026-08-09 | Truthful saved Board state, exact companion-stage identity, scoped provenance, governed LinkedIn recovery, and isolated deterministic E2E |
| Reader-first output contract and integrated quality gate: Milestone 5.1 | Approved | 2026-08-09 | Independent Sol read-only audit found no blocking findings after the direct-regression and complete-local-validation gate |
| Research and evidence: Milestone 6 | Complete (manual-first) | 2026-08-08 | Manual evidence workflow, explicit zero-cost planning brief, citations, injection tests |
| Reader-first distribution-neutral reset: Milestone 6.2 | Independently approved | 2026-08-09 | Sol approved the reader/output contract, immutable proofread and scoped boundaries, compatibility migration, and Finalize lifecycle after read-only review |
| Learning loop: Milestone 7 | Planned | 2026-08-14 | Manual feedback, follow-up ideas, Notebook history and explicit Notebook-to-Inbox flow |
| Full visual companions: Milestone 8 | Planned | 2026-08-16 | Approved, traceable visuals; any delivery-channel choice remains a Finalize concern |
| Local personal MVP release gate: Milestone 9 | Planned | 2026-08-19 | Security, recovery, production-mode validation, and honest technical-debt handoff |

Milestone 5.1 is independently approved following Sol's read-only review. The completed manual-first research work remains valid historical delivery evidence; later milestones still require their own acceptance, validation, and audit gates.

### Live execution audit hold point — bounded structured-output repair

Before the next independent audit, verify the live execution contract for every model-backed Board role:

1. One normal model attempt may be followed by **one** automatic structured-output repair only when the provider completed but local schema validation failed.
2. The repair must keep the same provider, model, and configured tier. It must not expand the task, retrieve new sources, create a new draft, raise the token allowance, or escalate capability.
3. If the repair fails, the workflow stops. The user must explicitly choose any further unchanged retry, bounded output increase, or one-role escalation.
4. Detail mode must log a rejected original attempt and, when applicable, an explicit `bounded_same_route_structured_output_repair` recovery record. The UI must report the final saved workflow state, while provenance retains the rejected attempt.

Sol audit: confirm this behavior in `generateStructured`, `CumulativeBudgetProvider`, persisted model-call provenance, routing, UI recovery controls, and regression coverage. Confirm that neither a model/tier escalation nor an extra paid attempt is hidden behind the repair path.

### Write-stage proofread-integrated review gate — approved follow-on

Before Finalize, each exact saved publication output must receive a current **Run draft review**. That one author action combines the existing focused editorial check with a separately routed low-cost proofread-and-clarity role; it is not a second button or a hidden automatic editor.

- For a dual-output plan, **Run draft review** applies this to the canonical article and **Run LinkedIn review** applies the same combined check independently to the LinkedIn companion. Neither output inherits the other output’s review or proofread state.

- The proofreader receives only the exact saved publication output and returns structured, span-specific suggestions for spelling, grammar, punctuation, and unclear wording.
- It must never overwrite the draft. The author accepts, dismisses, or revises every material suggestion in Write.
- Finalize is unavailable until the proofread check is current for that exact version and each material finding is resolved or explicitly dismissed by the author.
- Saving a new article or LinkedIn version invalidates its proofread result, along with version-bound review and voice checks.
- Browser spellcheck remains enabled for immediate local feedback; the proofreader is an additional contextual check, not a claim of perfect grammar detection.
- The one Run draft review control shows the assigned model(s) and combined estimated cost before the paid call. Its result separates **Editorial assessment** from **Proofread and clarity** findings, while keeping one clear next action. A deterministic test fixture covers the workflow without a provider call.
- Sol design audit: assess whether the combined review result makes the next required author action obvious, whether proofread findings are visually distinct from optional editorial advice, and whether Finalize is blocked only by unreviewed or unresolved material corrections rather than optional stylistic suggestions.

### Platform delivery profiles — approved follow-on

Platform selection must shape delivery, not merely word count. Keep the Board's thesis and evidence assessment platform-neutral; apply the delivery profile when producing and reviewing each publication output.

- **LinkedIn:** professionals across AI, data, technology, business, and leadership; a clear opening observation, mobile-scannable paragraphs, one practical implication, and an inviting close. Avoid clickbait, generic AI hype, artificial controversy, unsupported authority, and generic calls to action. Default 180–300 words unless the author overrides it.
- **Medium:** a self-contained practical essay for readers seeking a coherent point of view; a strong title and opening, logical progression, one illustrative example or clearly visible uncertainty where useful, and a meaningful close. Default 800–1,100 words; expand only when evidence, a framework, or a worked example earns the length.
- **Substack:** the same self-contained essay discipline, with more room for an ongoing reader relationship and a reflective close when it helps. Default 800–1,100 words unless the author chooses a deeper 1,200–1,500-word treatment.
- The external `kk-spoken-voice` skill remains authoritative across all profiles. Profiles never authorize invented facts, sources, audience knowledge, or platform claims.
- The selected profile must be visible in Write and provenance, supplied to the relevant drafting/review/proofread prompts, and overrideable per output without turning initial capture into a questionnaire.
- Sol audit: verify that platform adaptation changes framing, structure, and reader invitation where appropriate, not just output length; verify that the canonical argument remains consistent across related outputs.

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

### Completion record — 2026-08-08

Complete. Inbox capture accepts an optional author title, otherwise preserves the concise local suggestion, and opens the saved idea directly in Develop. The Develop stage remains the lightweight title-editing surface. Service and deterministic browser coverage prove both capture paths and the direct transition.

---

## Board and companion truthfulness closure checkpoint — before Milestone 5.1

### Objective

Close the independent audit gaps in the existing publication workflow before changing the output model. The visible status, recovery controls, provenance, estimate, and deterministic test environment must describe what actually happened.

### Scope

- Keep Board-review completion independent from canonical/LinkedIn output completion. A recovered LinkedIn drafter cannot conceal a failed Strategist, Skeptic, Editor, or Synthesizer.
- Treat an ordinary stale LinkedIn refresh as the configured low-cost Final Drafter route. Offer a medium-tier retry only as an explicit escalation after a failure, with a recorded reason.
- Estimate LinkedIn refreshes from the actual saved canonical article, voice reference, Final Drafter prompt, and 1,200-token allowance.
- Scope displayed Board provenance to the displayed Board run; show later LinkedIn recovery separately rather than attributing it to the original run.
- Choose the newest eligible terminal Board run, including a failed run, by completion time regardless of execution mode, so a newer deterministic test survives reload.
- Refresh the controlled LinkedIn editor after a successful recovery without overwriting unsaved author edits.
- Label the current SVG as a mutable draft asset until immutable visual-artifact history and publication linkage are implemented.
- Explicitly blank provider credentials in deterministic Playwright startup.
- Reconcile historical companion-generation language and delivery tracking without deleting prior decisions.

### Acceptance criteria

- Mixed Board failures remain visible after a successful LinkedIn-only recovery.
- A stale companion refresh uses the low Final Drafter route and its own accurate estimate; an escalation is visibly optional and separately recorded.
- Run provenance contains only calls tied to the chosen Board run. Recovery history remains available but separate.
- Reload selects the latest eligible Board result, including a newer deterministic test.
- A recovered companion appears immediately unless the author has unsaved edits, which are preserved and clearly protected.
- The current visual UI never claims an overwritten draft asset is immutable publication provenance.
- Deterministic Playwright cannot inherit a provider credential or call an external provider.
- Full local-only regression coverage and documentation traceability pass before Milestone 5.1 begins.

### Sol re-audit focus

Verify these exact run-status, routing, provenance, state-reset, visual-labeling, and test-isolation boundaries. This is a small closure checkpoint; it does not implement the reader-first data model.

### Follow-up remediation record — 2026-08-09

The follow-up independent audit found three closure gaps: an unattempted LinkedIn stage could be shown as completed after a failed dual-output synthesis; the exported recovery execution boundary could be called with an ordinary medium-tier retry or refresh; and the estimate/editor regressions did not prove the intended inputs or rendered editor behavior. The implementation now records the exact companion child produced from each Board run, keeps unattempted stages as `not_run`, enforces recovery policy at the exported execution boundary, persists an explicit escalation reason, and adds shape-sensitive estimate plus browser-state regressions. A final independent audit remains required before Milestone 5.1; this record is implementation evidence, not an audit verdict.

### Final closure remediation record — 2026-08-09

The final closure pass must also preserve author edits that occur while an action response is pending, render a pre-drafting Synthesizer failure as `not_run` for both article and LinkedIn stages, terminalize in-page failure progress without requiring reload, and prevent production direct callers from selecting arbitrary LinkedIn recovery routes or caps. The live recovery wrapper requires `recoveryKind: "escalation"` explicitly for medium work; character-derived LinkedIn estimates are labelled conservative reservations. Regression coverage must exercise the delayed-response editor case, the rendered saved-stage case, and direct-boundary route/cap rejection. This remains implementation evidence pending a fresh independent audit.

### Run-truthfulness follow-up remediation record — 2026-08-09

The final audit found three further state-truthfulness gaps: terminal Board rendering could mark an unattempted Synthesizer as completed when every reviewer failed; scoped recovery could be labeled as a completed Board or claim failure provenance before any provider attempt; and the historical Board companion identity could be replaced by a later recovery or author edit. The implementation now derives terminal roles from persisted attempts, scopes the generated companion through the originating run’s persisted model-call metadata, gives recovery its own progress identity and pre-dispatch rejection state, and aligns scoped estimate framing with execution. This remains implementation evidence pending a fresh independent audit before Milestone 5.1.

---

## Milestone 5.1 — Reader-first output contract and integrated quality gate

### Objective

Make the author choose an audience and output shape before distribution. Preserve existing publication plans as compatibility data while the Board remains thesis and evidence focused.

### Scope

- Add an optional audience profile with the existing professional audience as the default.
- Let the author select short form, long form, or both, with editable default target ranges: short 180–300 words and long 800–1,100 words.
- When both outputs are selected, create a derived, independently editable short form tied to one exact long-form version.
- Apply optional delivery guidance before drafting/review only when the author chooses it; record actual LinkedIn, Medium, or Substack distribution later in Finalize.
- Integrate one low-cost proofread-and-clarity result into the existing per-output review action. Material issues require an explicit author disposition; optional style suggestions never block publication.
- Preserve existing `linkedin`, `canonical`, and `linkedin_companion` formats and map existing publication plans additively. Do not rewrite historical drafts or publication records.

### Acceptance criteria

- New capture remains low-friction: the default audience and sensible ranges require no extra question.
- Short-only, long-only, and dual-output plans work with exact-version and stale-dependency rules intact.
- Every exact output has a current combined editorial/proofread review before Finalize; authors can dismiss non-applicable material findings explicitly.
- Finalize remains content read-only and records actual channels independently.
- All changes are additive, backup-gated, provider-budgeted, prompt-injection-contained, and covered by local-only service, route, and browser tests.

### Migration discipline

Use one additive, owner-backup-gated migration for audience/output preferences and immutable review-finding dispositions. Backfill existing publication plans without deleting or renaming historical format records. Validate against temporary synthetic data first; apply to meaningful local data only through the explicit migration workflow.

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

### Completion record — 2026-08-08

Complete for the current local, manual-first research capability. Develop now stores author-provided evidence separately from interpretation, source title/URL/date/excerpt, epistemic labels, and instruction-like-content signals. An explicitly requested, zero-cost local research brief records the question, time window, tool identity, and cost while stating clearly that it does not browse or claim market coverage. External web retrieval remains deliberately out of scope until an explicit search/source connector is selected; the application never treats a recorded URL as trusted content or a command.

### Milestone 6 follow-on — dual-output model drafting

- A selected Medium/Substack plus LinkedIn plan must produce both outputs in the same Editorial Board run: the canonical article from the Initial Drafting Agent and a separately metered, source-linked LinkedIn post from the Final Drafting Agent.
- The LinkedIn post is a standalone 1–1.5 minute adaptation, not a template excerpt or a reference to a “longer piece.” It uses the low-cost configured route because it is bounded by the canonical article and validated Board synthesis.
- The live cost preview must show the added Final Drafting Agent call. The free deterministic Board test must generate a clearly labelled simulated companion without any provider call.
- The old separate **Create LinkedIn companion** UI/API action is removed from the normal workflow. A stale historic pair requires a fresh Board run rather than a silent local-template replacement.
- Regression coverage must prove both generated outputs, their exact source relationship, independent versions, provenance, and the six-call live estimate.

Completion record — 2026-08-08: complete. The Board pipeline now executes the Final Drafting Agent only for Medium/Substack plus LinkedIn plans. The output is constrained to a standalone 160–240-word LinkedIn post, has its own exact draft version and parent relationship, and uses the low-cost route. The live preview and cumulative run cap account for the sixth call. The visible/API template-creation action now instructs historic incomplete pairs to rerun the Board. The narrowly scoped final-drafter reliability repair normalizes only explicitly prohibited em dashes before voice validation and persistence, preserves a safe, actionable execution category if validation still fails, and provides a separately capped retry that calls only the missing LinkedIn drafter from its saved canonical source. Local-only validation passed: TypeScript, ESLint, 23 test files / 97 tests, 16 validate-only migrations, production build, two deterministic Playwright workflows, a 126-file secret scan, dependency audit with 0 vulnerabilities, and diff check. No external provider call occurred.

Stabilization traceability — pending full audit: model-call failure diagnostics remain redacted and structured; reload-safe stage summaries are derived from persisted run records; the recovery card must prefer the most recent failed final-drafter model call over an older Board memo. Audit must confirm UI, API, persistence, and route-safe-error behavior together before this checkpoint is considered release-ready.

Governed recovery policy — approved: for a technical, non-content failure (output limit, invalid structured output after the bounded repair, or no usable structured output), the app may make at most one automatic retry of the failed role within the already approved run cap. It must record the failure category, retry settings, incremental estimate, and result. A second failure, a cap exceedance, provider rejection/refusal, safety concern, or any requested model/tier escalation stops automation and presents the author with the diagnosis plus explicit choices: retry unchanged, increase only the bounded output allowance, escalate only that role to the next approved tier, or stop. Frontier escalation is never automatic. This policy applies independently to each saved workflow stage and never reruns successful paid stages.

Model-independence routing policy — approved: role independence must not rely solely on separate prompts. The configurable routing plan should prefer a model/provider distinct from the majority of reviewer calls for Synthesizer and a route distinct from Synthesizer for Final Drafter when viable under the run cap. Skeptic diversity is especially valuable. The policy is advisory when only one configured provider is available, transparent in the run plan, and never claims that vendor diversity proves factual correctness. Every factual claim remains subject to BOK/research grounding and explicit evidence boundaries. The audit must verify route diversity disclosure, graceful single-provider fallback, cost-cap enforcement, and no permanent vendor binding.

### Final follow-on — approved visual brief selection

Status: **planned; unlocked by Milestone 5.1 approval and required before the full visual-rendering work in Milestone 8.** Add a small visual-brief step after the reader-first output contract and before the full visual-rendering work in Milestone 8.

- Do not force a visual for every post. First recommend either **no visual** or one explanatory purpose: contrast, decision path, sequence, lifecycle, framework, or comparison.
- Show an editable brief before rendering: the intended reader takeaway, proposed visual grammar, exact source claims, labels, caption, alt text, and whether the visual is an optional short-post or article asset.
- The initial recommendation may use transparent local rules and author choice at zero cost. An explicitly requested low-cost model may later suggest a brief, but its output is advisory, bounded to the saved draft and selected BOK/research claims, and requires user approval.
- Deterministic SVG diagrams remain the default renderer for conceptual and factual relationships. Generative imagery, characters, and illustration remain optional Milestone 8 work and must never be required for a usable visual.
- The visual brief must not invent risk, security, governance, market, or quantitative claims that are absent from the saved draft or approved sources.

Acceptance criteria: an author can understand why a visual is or is not recommended, edit the proposed claims and structure, approve it explicitly, and see that the rendered visual uses only the approved brief. This extension does not add an image-generation provider, browser research, or automatic rendering.

---

## Milestone 6.2 — Reader-first distribution-neutral reset

### Objective

Make the active product model reader-first end to end. Before Finalize, the author chooses only the reader contract and whether to create a short post, article, or derived short post. Platform names must not select, constrain, label, or imply a draft, review, prompt, relationship, or model route.

### Scope

- Replace the active `publicationPlan` contract with an output-shape contract: `short`, `long`, or `long_with_derived_short`.
- Use reader-facing names in the UI: **Short post**, **Article**, and **Derived short post**. Keep exact-version and stale-dependency rules, but remove LinkedIn/Medium/Substack terminology from authoring, Write, review, and model prompts.
- Give every output an explicit generic format and relationship. A derived short post remains tied to one exact article version, independently editable, reviewed, proofread, and publishable.
- Keep delivery channel exclusively in Finalize. Recording a publication selects its actual channel for that exact already-approved output; it must not retroactively affect the Board run, prompts, range, provenance, or review eligibility.
- Remove active service, route, client, schema, test, and documentation dependencies on `publicationPlan`, `linkedin`, `medium`, `substack`, `canonical`, and `linkedin_companion`. Historical migration scripts remain immutable; their legacy columns and records become inactive schema history only.
- Add one additive migration to establish the generic output formats and relationships. Rebuild only the known synthetic local database after the migration is validated. Do not apply it to meaningful local data, inspect database contents, or rewrite pushed migrations.

### Acceptance criteria

- Capture and Develop expose audience, reader notes, ranges, and output shape; they expose no platform selector or platform-first default.
- Every drafting, reviewing, proofread, scoped-estimation, and recovery request receives the immutable reader/output contract and no platform-delivery instruction.
- Short-only, long-only, and long-with-derived-short workflows preserve exact-version review, stale dependency, proofreader, Finalize, and publication safeguards.
- Finalize records a channel per exact output only after all current review/proofread/material-finding checks pass. Choosing a channel cannot cause drafting, a provider call, or a version change.
- Fresh synthetic migration and deterministic production-mode browser coverage prove no active authoring surface or payload depends on a legacy platform plan.
- The complete local validation and a new independent read-only audit pass before this milestone is accepted.

### Required working method

Create direct failing regressions first for each acceptance criterion. Use non-default reader ranges, adversarial reader notes, a derived-short relationship, deliberately different publication channels chosen only in Finalize, and a fresh temporary database. Inspect exact prompts, persisted generic formats/relationships, browser-visible labels, route payload rejection, reload behavior, and Finalize server enforcement. Do not use green aggregate counts as proof.

### Handoff checkpoint — 2026-08-09

The independent Sol read-only audit approved this milestone on 2026-08-09 with no blockers. `docs/MILESTONE_6_2_BLOCKER_MATRIX.md` maps each acceptance invariant to its implementation boundary, adversarial fixture, and direct unit, integration, migration, or browser regression. `IMPLEMENTATION_STATUS.md` contains the command-derived validation evidence and the deliberately limited synthetic-database reset record.

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
- Allow an article to have a lead visual and up to two supporting visuals when useful; its optional derived short post may use a separate output-appropriate visual.
- Provide editable visual suggestions for labels, caption, alt text, structure, and platform use before rendering.

### Acceptance criteria

- Posts without a useful visual receive no forced recommendation.
- A principles-based post can produce an accurate, legible diagram tied to the approved draft.
- Every factual visual element is traceable to the draft, BOK, or cited research.
- Alt text and output-appropriate dimensions are generated and editable; any delivery-channel choice remains a Finalize concern.
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

Historical note (2026-08-08): the next step at that point was an independent audit of this final diff before Milestone 6. This record is preserved as evidence; it is superseded by the active checkpoint and next-item summary at the top of this roadmap.

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
