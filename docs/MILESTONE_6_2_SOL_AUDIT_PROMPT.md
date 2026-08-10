# Milestone 6.2 — independent Sol audit instructions

Conduct a new independent **read-only** audit of Milestone 6.2. Return an explicit `APPROVE` or `DO NOT APPROVE` verdict. An approval must be based on direct source-and-regression evidence, not the aggregate green test count.

Read, in full:

- `AGENTS.md`
- `BUILD_ROADMAP.md`
- `LEAN_PRODUCT_SCOPE.md`
- `AI_Editorial_Board_Spec.md`
- `IMPLEMENTATION_STATUS.md`
- `docs/MILESTONE_6_2_BLOCKER_MATRIX.md`
- `docs/AGENT_SECURITY_GUARDRAILS.md`
- `AUDIT_2026-08-07.md`
- the complete current diff

Do not modify files, apply migrations, run providers, access `.env` files, secrets, BOK, voice, private sources, or database contents, and do not stage, commit, or push. Do not run suites if their configuration applies migrations, even to temporary databases; inspect the direct regression source instead.

Audit only the Milestone 6.2 contract and these boundaries:

1. From Capture through Write, active UI, service, route, model prompts, saved formats, relationships, and tests use only reader/output concepts: short post, article, and derived short post. Historical migrations and compatibility mapping may mention legacy delivery platforms. A `channel` may occur only when recording an exact approved output in Finalize.
2. Migration 018 is additive and preserves populated legacy synthetic records and dependent publication history while mapping legacy output plans, formats, relationships, approvals, reader context, and publication delivery data to the new generic schema.
3. The immutable saved reader contract—including adversarial reader notes and unmistakably non-default ranges—reaches every relevant reviewer, canonical drafter, initial derived-short drafter, scoped estimation, and scoped recovery boundary. Reader notes remain escaped, bounded, untrusted context and never trusted system instructions.
4. Exact-version behavior is preserved: derived short posts link to exact article versions, review/proofread and stale-state rules remain independent, unchanged saves do not create fake versions, and the generic Finalize flow enforces sequencing and server-side locks.
5. Live-proofread boundaries remain server-routed, capped before dispatch, bounded to one same-route repair, terminal on non-success, telemetry-complete per attempt, and ineligible after missing, failed, or unattempted live-required proofread. Verify this against direct adversarial tests as well as code.
6. Browser regressions prove reader/output-only authoring, immutable provenance distinct from mutable preferences, Finalize-only channel selection, generic output lifecycle, provider-route isolation, and truthful unavailable/failed/missing/material-review states.
7. Confirm local mutation errors are sanitized while known user-facing proofread and Finalize explanations remain actionable.

Give specific attention to the remediated findings: change Develop preferences after a saved paired Board run and verify scoped estimate/recovery use only the strict saved manifest contract; inspect a targeted reviewer rerun for the same trusted audience, output shape, and ranges while its reader note remains untrusted; verify a missing BOK/voice index returns a truthful preview/UI state rather than an exception that removes the Board setup; then inspect the saved-manual-draft/no-Board case, all six legacy plan mappings on ideas and snapshots, strict mixed-payload rejection, and recording an article and derived short post on deliberately different channels.

For each concrete concern, cite its source path and line, explain the violated invariant, and identify whether a direct regression detects it. Do not ask for scope expansion or implementation preferences. Report any remaining limitation separately from a blocker.
