# Milestone 6.2 — reboot and audit handoff

Status at handoff: **approved by independent Sol read-only audit on 2026-08-09.** Milestone 6.2 is complete; do not modify it unless a later concrete regression requires remediation.

The final remediation adds a non-throwing pre-Board manual-draft preview path, exhaustive synthetic legacy-plan mappings (ideas and snapshots), strict mixed-payload rejection, and a browser/service paired-output lifecycle that persists separate `medium` article and `substack` derived-short records. It also binds proofreader estimates and execution to the immutable saved Board contract, makes no-contract proofread routing unavailable and pre-dispatch-rejected, and atomically validates the merged reader-output state on every update. The full validation gate records 24 Vitest files / 84 tests, 18 validate-only migrations, and 11 deterministic Playwright flows.

## Resume point

The original five-item Milestone 6.2 plan was complete. Sol then identified two concrete orchestration gaps; direct failing-first regressions and narrow fixes are complete, and the full validation gate was rerun:

1. Reader-first distribution-neutral contract and adversarial blocker-to-regression matrix — complete.
2. Legacy dependency map and additive clean-database migration — complete as migration 018.
3. Authoring, orchestration, Finalize, and persistence refactor — complete.
4. Rebuild only the synthetic local database — complete after a verified recoverable owner backup; no database contents were inspected.
5. Full validation, documentation, and independent-audit package — complete and refreshed.

Remediated audit findings: scoped derived-short estimation/recovery uses the immutable saved Board reader contract after Develop preferences change; targeted reviewer reruns receive the same trusted reader/output contract. User testing also found that a missing BOK index threw from live preview and hid the Board setup; preview now reports that expected unavailable state without throwing. Direct integration and browser regressions cover all three.

Read these before any follow-up work:

- `AGENTS.md`
- `BUILD_ROADMAP.md`
- `LEAN_PRODUCT_SCOPE.md`
- `IMPLEMENTATION_STATUS.md`
- `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`
- `docs/MILESTONE_6_2_SOL_AUDIT_PROMPT.md`
- `docs/AGENT_SECURITY_GUARDRAILS.md`

## Implemented contract

- Capture through Write operates on reader/output concepts only: output shapes `short`, `long`, and `long_with_derived_short`; stored formats `short`, `article`, and `derived_short`.
- A derived short post is tied to an exact article version and remains independently editable, reviewable, proofread, stale-aware, and publishable.
- `channel` is selected only while recording an exact eligible output in Finalize. It does not affect Board prompts, model routing, output ranges, provenance, or review eligibility.
- Migration `018_reader_first_distribution_neutral.sql` is additive. It maps historical plans, formats, relationships, approvals, reader context, and publication delivery data while retaining dependent publication history.
- Existing migrations 001–017 were not rewritten.

## Evidence and validation

The direct adversarial invariant-to-regression map is `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`. It includes prompt-containment, non-default-range propagation, populated legacy migration preservation, exact-version lifecycle, Finalize-only delivery, terminal live-proofreader outcomes, Board-terminal states, route injection rejection, and browser-visible states.

The completed local validation commands and results are recorded in `IMPLEMENTATION_STATUS.md`:

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test -- --run` — 24 files / 77 tests passed
- `npm run db:validate` — 18 migrations validated without applying them
- `npm run build` — passed
- `npm run test:e2e` — 9 deterministic production-mode flows passed
- `npm run security:secrets` — 132 source/documentation files passed
- `npm run security:audit` — 0 vulnerabilities
- `git diff --check` and `git diff --cached --check` — passed after all handoff documentation changes

Tests used temporary databases and synthetic BOK/voice fixtures. No provider was configured or called. No `.env` file, secret, BOK, voice, private source, or provider request body was accessed.

## Local database and worktree safety

- The owner authorized resetting only the known synthetic local database. A recoverable verified backup was made first; the previous synthetic database was moved recoverably; migrations 001–018 were then applied to a new empty local database.
- No meaningful local data was migrated, opened, or inspected. No private-source index was run after the reset.
- Worktree changes are intentionally uncommitted and unstaged. Do not reset, clean, discard, stage, commit, or push them before the audit outcome.
- Preserve unrelated untracked artifacts already in the worktree, including the PDF, `archive/`, and image artifact. They are not part of Milestone 6.2 and must not be removed.

## Next action

Send the exact prompt in `docs/MILESTONE_6_2_SOL_AUDIT_PROMPT.md` to Sol. Sol must be read-only and must not run suites that apply migrations, access private content, open environment files, call providers, stage, commit, or push.

If Sol returns a blocker, map only that concrete finding to the existing invariant, add a direct adversarial regression that fails first, make the narrowest fix, rerun the complete local gate, update the blocker matrix and status handoff, then request another independent audit. Do not treat a green aggregate count as sufficient evidence.
