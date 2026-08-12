# Milestone 7.1 — Independent read-only audit request

Please perform an independent, read-only audit of the current Milestone 7.1 diff. This is a new hardening milestone after Sol-approved Milestone 7. Do **not** declare the milestone approved merely because the recorded local gate is green. Report `APPROVE` only if the source and direct regressions below establish every invariant; otherwise report `DO NOT APPROVE` with concrete blocker locations and the missing direct regression.

## Audit limits

- Do not modify files, stage, commit, push, call providers, apply migrations, or execute application suites.
- Do not read `.env` files, databases, backups, BOK, voice, Notebook, provider request bodies, or other private/untracked content.
- Listing tracked source/test names and inspecting the current tracked diff is allowed. Use `git diff HEAD` (not only unstaged `git diff`) so staged additive migrations are included. Treat the recorded validation in `IMPLEMENTATION_STATUS.md` as supporting evidence only. Confirm `020_visual_lead_revision_selection.sql`, `021_visual_version_color_schemes.sql`, `022_initial_drafter_recovery_claim.sql`, `023_visual_asset_version_sequence.sql`, this audit prompt, and the blocker matrix are present in that tracked diff before reviewing schema claims. If `023` is not staged yet, report that audit-handoff gap rather than treating it as an implementation defect.
- Audit the Milestone 7.1 closure and regression safety only. Do not broaden this into a new product scope or a re-audit of previously approved milestones unless the current diff demonstrably regresses them.

## Required sources

Read these before reaching a verdict:

- `AGENTS.md`
- `BUILD_ROADMAP.md`, especially Milestone 7.1
- `IMPLEMENTATION_STATUS.md`
- `docs/AGENT_SECURITY_GUARDRAILS.md`
- `docs/MILESTONE_7_1_BLOCKER_MATRIX.md`
- Current tracked diff and the direct tests named in the matrix

## Required boundary review

1. **Reader-facing contract and prose**
   - Confirm all initial/derived drafting and scoped recovery saves enforce the immutable saved long or short range and never silently save an under-range result.
   - Confirm saved audience, output shape, and ranges reach main reviewers/drafters, targeted reviewer reruns, scoped derived recovery, Initial Drafter recovery, proofreader estimate, and proofreader execution.
   - Confirm author audience notes and capture/source text stay bounded, escaped, untrusted data; they must not be interpolated into trusted system instructions.
   - Confirm reader-facing publication body rejects capture fragments, BOK labels, and prompt scaffolding while labelled provenance remains separate. Inspect the unaligned `slice(1, 13)` 12-word hostile fixtures containing normalized one-character `a` and `I` tokens, not only fragments beginning at capture offset zero or consisting solely of multi-character words.

2. **Initial Drafter and reviewer recovery**
   - Verify an Initial Drafter output-limit failure is terminal, preserved, and recoverable only through a server-owned route/cap. The recovery must use the original saved Board snapshot, retrieval, synthesis, voice version, and reader contract; it must not rerun reviews/synthesis, widen the role allowance, silently alter the saved route, or erase the first attempt.
   - Confirm exactly one scoped retry is permitted for one failed Board: after its second failure, a third dispatch is rejected before provider use, preview is unavailable, and browser copy removes the retry control while naming the new-Board/configuration next step. Inspect `keeps a second Initial Drafter failure terminal and separately persisted` and `removes the Initial Drafter retry control after its one permitted retry has failed`.
   - Confirm concurrent retry requests cannot both pass an earlier eligibility read and dispatch. The additive unique recovery claim must be persisted after local cap preflight and immediately before provider dispatch. Inspect `atomically claims the one Initial Drafter retry before dispatch when concurrent callers overlap`: one latched call dispatches, the concurrent request is safely rejected pre-dispatch, preview is unavailable while the claim is live, and one recovery call persists. Verify a cap rejection creates no claim.
   - Confirm the saved Initial Drafter route includes and compares provider, model, tier, pricing assumption, and output allowance before **both** estimate and production dispatch. Inspect the parameterized `rejects a changed saved Initial Drafter %s before the production retry can dispatch` test: each isolated mutation must cause unavailable preview, no estimate, no dispatch, and no new attempt.
   - Change the synthetic saved voice source after a failed Board. Confirm recovery availability, estimate, and execution compare it with the saved Board checksum and reject before dispatch. Inspect `rejects an Initial Drafter recovery when the saved voice source has changed`.
   - Inspect browser recovery guidance for persisted `reader_range_contract_failed` and `reader_prose_scaffolding_failed` Initial Drafter failures. Each must name its actual safe category and must not say the model reached its output limit.
   - Confirm the scaffolding browser case obtains `reader_prose_scaffolding_failed` from a real persisted deterministic Initial-Drafter failure rather than manually supplying it in a mocked idea payload. Its preview route may mock only recovery availability.
   - Verify a reviewer truncation has no automatic paid retry. A later scoped rerun must remain separately linked to the original Board failure, retain the original Board history/current draft, and only resolve that displayed reviewer state when the linkage exists.

3. **Proofread truthfulness and publication safety**
   - Confirm provider failure, refusal, truncation, malformed-output repair exhaustion, cap rejection, unavailable, and unattempted states never become eligible proofread results.
   - Confirm every persisted live failure projects only an application-authored category/message—never raw provider output—and Write and Finalize show a specific allowed retry while Finalize stays blocked.
   - Confirm cosmetic/no-op proofreader suggestions cannot create a material publication blocker while meaning-changing punctuation remains material. Inspect `retains a meaning-changing punctuation correction as material and blocks Finalize until disposition` with the `Let's eat Grandma.` / `Let's eat, Grandma.` fixture.
   - Confirm established exact-version locks, material-finding disposition, and Finalize sequencing remain enforced.

4. **Visual revision closure**
   - Confirm author visual intent is bounded/untrusted and either maps faithfully to a supported local grammar or remains an honest no-render custom-illustration concept with no provider call, price, or misleading control. A dismissed custom concept must remain visible after reload in `Saved custom illustration concepts`, with author direction and no render/price/button action.
   - Use an unlisted literal direction such as “show a bridge connecting strategy and operations” against saved prose containing `framework` and `path`. Confirm output keywords cannot select a deterministic diagram; the result must remain a no-render custom concept with no approval or render action.
   - Confirm new authoring is one versioned lead visual per exact output: a replacement remains a distinct immutable version/file, active-lead selection is explicit, older versions remain downloadable history, and no normal supporting-visual creation control returned. Existing supporting records must remain readable history. Direct route **and** service actions must reject new supporting recommend/edit/approve/render work, not merely omit the browser button.
   - Edit Version 2's palette and claims before approval. Confirm `visual_version_number` remains 2 while mutable `revision_number` may advance, and the UI remains Version 2 of 2 with distinct Version 1/2 assets.
   - Confirm the browser actually submits and later reads a changed, traceable Version 2 claim; a blank claim that silently retains the existing generated claim is insufficient.
   - Confirm V1 and V2 asset paths cannot collide when rendered in the same clock millisecond. The direct regression must separately assert different IDs and paths, both files exist, and V1 remains unchanged after V2 renders.
   - Follow rendered V1 with a dismissed custom concept V2 and then a rendered diagram V3. The preparation disclosure must predict version 3 and the rendered navigation must say Version 3 of 3; it must not use a rendered-only denominator with an immutable-history numerator.
   - Start with an initial literal custom concept V1, then select a supported deterministic grammar through the alternative control. Confirm the concept is deliberately dismissed or otherwise explicitly superseded, the supported diagram is uniquely V2, and after render the browser says Version 2 of 2. No second Version 1 record may remain actionable.
   - Confirm Visual companion is discoverable beside/before review detail and that existing exact-output/publication locks remain intact.

5. **Regression rigor**
   - Check the matrix’s named direct tests genuinely exercise the listed boundary, not only helper code or default fixtures.
   - In particular, inspect the adversarial 1234–1567 / 321–357 reader contract, injection-shaped reader note/capture, unaligned 12-word `alpha a bridge I …`.slice(1, 13) capture fragment, under-range 25-word fixtures, exact persisted attempt history, atomic one-recovery claim, no-dispatch cap/route fixtures, rejected supporting route, and browser route/action assertions.
   - Identify any claim in the matrix or handoff whose test does not directly prove it.

## Expected report

Give one of:

- `APPROVE` — no concrete M7.1 blocker remains; list the critical direct evidence and any non-blocking limitation.
- `DO NOT APPROVE` — list each blocker with source location, violated invariant, why existing test misses it, and the narrow correction/regression required.

State explicitly that the audit was read-only and whether any prohibited data or provider access occurred.
