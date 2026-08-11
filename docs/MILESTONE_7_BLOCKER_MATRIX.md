# Milestone 7 — Optional visual companions contract matrix

Status: complete — independently approved by Sol on 2026-08-10. No provider, image-generation adapter, or migration to meaningful local data is authorized.

Migration design: additive `019_visual_brief_approval.sql` creates immutable-output visual-brief records and an optional link from a rendered companion to its approved brief. It must be validated only against fresh and populated temporary synthetic databases before any owner-controlled application.

| Invariant | Intended implementation boundary | Direct regression and expected current failure |
| --- | --- | --- |
| A visual is optional and the author can see why it was or was not recommended | Local visual-brief recommender, persisted `visual_briefs` record, and Write surface | `local visual asset storage > recommends no visual for a text-only saved output and never renders one` uses a deliberately non-diagrammatic saved short post and expects a persisted `no_visual` recommendation with no render action. |
| A useful recommendation is bound to one immutable saved output, not mutable editor text or current Develop preferences | Visual-brief service lookup, exact draft-version record, and reader-contract provenance | `local visual asset storage > preserves the saved reader contract after later Develop preference changes` uses unmistakable ranges and audience notes, changes them after recommendation, reloads, and asserts the brief retains its original contract. |
| Claims, labels, caption, and alt text are editable but remain attributable and bounded | Strict visual-brief schema and mutation route | `local visual asset storage > edits only traceable claims before visual-brief approval` rejects a source-absent claim and a hostile source-absent label, then proves accepted author direction and traceable text persist. |
| No output is rendered automatically; explicit approval is required for one exact brief revision | Brief state transition plus deterministic renderer entry point | `local visual asset storage > requires an approved visual brief before rendering a local visual asset` attempts render before approval and permits only the approved exact brief afterward. |
| A deterministic factual diagram uses only the approved brief and does not invent quantitative content | Approved-brief renderer, SVG serializer, and stored asset provenance | `local visual asset storage > renders only approved brief content and never lets a render request replace its approved template` uses distinctive source-backed labels/claims and author direction, then asserts the stored SVG accessibility metadata and grammar come only from that revision. |
| Visual assets stay local, readable, exact-version identifiable, and under the configured visual root | Asset naming/path guard, file permissions, and SQLite asset record | `local visual asset storage > stores each new visual under the dedicated visual directory rather than beside application data` verifies title-prefix/idea suffix containment, exact draft number, timestamp, owner-only file mode, and no file beside the temporary database. |
| The article may use one lead and up to two supporting visuals; a derived short post may have its own output-appropriate asset | Placement validation, exact-output relation, and per-brief asset renderer | `local visual asset storage > limits one lead and two supporting visual briefs to one exact saved output` creates a lead plus two supports, rejects a second lead/third support, explicitly approves all three briefs, renders each by exact brief id, and reloads two supporting assets independently. Earlier code could create only a newest single visual per draft. |
| Browser output is safe, accessible, and truthful about local cost | Write/Finalize UI and safe local mutation errors | Playwright `renders the exact visual asset on the page and downloads it as PNG` asserts the visible recommendation/edit/approval lifecycle, `$0.00 local`, shared SVG data asset, and PNG export. |
| The author can direct the visual and see cost before approval | `visual_briefs.author_direction`, strict edit route, and Write’s visual-brief editor | The edit regression stores `Show why ownership changes the outcome.` and asserts it survives reload. Playwright `renders the exact visual asset on the page and downloads it as PNG` asserts the reader-goal prompt and deterministic `$0.00 local` disclosure before approval. The selected local renderer cannot understate a paid call because it never calls a provider; a future raster route must display its server-reserved upper bound before its separate approval action exists. |

## Independent-audit remediation matrix — 2026-08-10

| Audit blocker | Implementation boundary | Direct regression added before remediation | Expected prior failure |
| --- | --- | --- | --- |
| The real mutation route sends `action` into the strict visual-brief payload | `app/api/ideas/[ideaId]/route.ts` action dispatch | `local visual asset storage > accepts a strict visual-brief edit through the real API action envelope` | The service rejects the otherwise valid body for the unexpected `action` key. |
| Approved visual content, caption, alt text, and template were not the sole renderer inputs | Approved-brief renderer and SVG serializer | `local visual asset storage > renders only approved brief content and never lets a render request replace its approved template` | A caller-selected contrast template wins; generated generic title/detail text remains; SVG uses generated title for `aria-label` and lacks a caption description. |
| Placement updates can evade the one-lead/two-supporting invariant | `updateVisualBrief` atomic placement validation | `local visual asset storage > keeps placement limits coherent when a visual brief is edited` | Moving the lead into an already-full supporting set persists an invalid third support. |
| Vertical grammar uses incompatible persisted and renderer identifiers | Migration 019, normalizing loader, edit validation, renderer mapping | `local visual asset storage > uses vertical_path consistently from edit, persistence, reload, and rendering` | An edit using `vertical_path` violates the migration’s `maturity_path`-only database constraint. |
| The derived short output has no independently targetable brief lifecycle | Exact-output resolver, route, detail projection, and Write surface | `local visual asset storage > targets a derived short post independently and exposes its own visual brief` | A request marked `derived_short` silently targets the canonical article instead. |

All five regressions were added before their fixes and observed failing against the prior implementation. The browser regression `keeps approved visual grammar immutable while exposing article support and derived-short visual lifecycles` additionally proves the author-facing article lead/support and derived-short paths.

## Second independent-audit remediation matrix — 2026-08-10

| Audit blocker | Implementation boundary | Direct regression added before remediation | Expected prior failure |
| --- | --- | --- | --- |
| A derived-short `no_visual` recommendation leaves the author with an invalid approval action and no output-specific grammar selector | Derived-short Write lifecycle and independent selected-template state | Playwright `lets an author replace a derived-short no-visual recommendation with its own selected shape` | The derived panel had no radios and offered `Approve derived short visual brief`, which the service rejects for `no_visual`. |
| Supporting and derived-short approval/render controls omit the deterministic cost disclosure | Per-output Write controls | Playwright `keeps approved visual grammar immutable while exposing article support and derived-short visual lifecycles` and `keeps a saved derived short post independently editable and reviewable after article publication` | Both lifecycle paths render an approval control with no `$0.00 local` disclosure in its output section. |
| One lead/two-supporting limits can be bypassed outside a service pre-check | `recommendVisualBrief` writer transaction plus migration-019 database index/triggers | `local visual asset storage > enforces lead and supporting limits in the database even when a caller bypasses the service count` | Raw inserts create a second active lead and a third support because no database constraint rejects them. |
| Article publication incorrectly locks independent visual work for the still-unpublished derived short | Exact-output publication guard in recommendation, brief edit, and rendering paths | `local visual asset storage > allows an unpublished derived-short visual lifecycle after its article has been recorded`; Playwright `keeps a saved derived short post independently editable and reviewable after article publication` | Recommendation throws the coarse `Published workflow is locked` error after the article record exists. |

The second-remediation command evidence is superseded by the third remediation below.

## Third independent-audit remediation matrix — 2026-08-10

| Audit blocker | Implementation boundary | Direct regression added before remediation | Expected prior failure |
| --- | --- | --- | --- |
| Lead and derived refresh controls omit the deterministic cost beside the action that re-renders | `VisualFlow` action rows in the Write view | Playwright `keeps approved visual grammar immutable while exposing article support and derived-short visual lifecycles` | The lead action row reads only `Refresh this visualDownload PNG`; the derived row likewise lacks `$0.00 local`. |
| Supporting-only brief/asset state can be created and then appears as both lead and support | Supporting placement guard, supporting-render ordering guard, and `getIdea()` visual projection | `local visual asset storage > requires a lead visual brief before a supporting brief can be requested`; `requires the rendered lead asset before a supporting asset can render`; and `never projects a stored supporting-only asset as the lead visual` | A supporting recommendation is accepted without a lead; a support can render before a lead asset; a stored support is returned as `visualCompanion` and as a supporting asset. |
| Compatibility-only `maturity_path` remains a writable visual-brief persistence value | Migration-019 `visual_briefs.visual_type` constraint | `local visual asset storage > rejects the legacy maturity_path value in visual-brief persistence`; `foundation migration > creates required tables and the FTS index` | Direct update/insert succeeds and the migration table SQL contains `'maturity_path'`. |

The third-remediation validation evidence is superseded by the fourth remediation below.

## Fourth independent-audit remediation matrix — 2026-08-10

| Audit blocker | Implementation boundary | Direct regression added before remediation | Expected prior failure |
| --- | --- | --- | --- |
| A pre-Milestone-7 asset with the intentionally null optional brief link disappears from Write and Finalize after the lead-only projection | Migration-019 compatibility, null-link-only detail projection, and Write/Finalize read-only presentation | `local visual asset storage > retains a pre-brief visual through the real detail route for Write and Finalize`; `maps populated legacy output records without losing publication dependents`; and Playwright `keeps a legacy unlinked visual readable in Write and Finalize` | `getIdea()` returns no `visualCompanion`; the real detail route omits the asset, and the client cannot render it in Write or Finalize. |

The full local gate and current-diff requirement-to-test review completed after this remediation: 24 unit/integration files / 110 tests, 19 validate-only migrations, 19 deterministic production-mode browser flows, typecheck, lint, build, 132-file secret scan, zero-vulnerability dependency audit, and both diff checks. This evidence supports a new independent audit; it is not an approval claim.

Sol independently approved the complete Milestone 7 current diff after this fourth remediation. Its read-only audit found no remaining concrete blockers.

## Fixed implementation choices

- The approved `VISUALS_PATH` root remains authoritative. Milestone 7 assets must never return to a database-adjacent `data/` directory.
- The first renderer remains deterministic SVG and costs `$0.00 local`. This milestone does not configure or dispatch an image-generation provider. Any later optional provider must use a separately audited, server-owned route, cap reservation, structured result schema, per-attempt telemetry, and explicit approval.
- All author, draft, BOK, research, and prior-model material is untrusted data. The visual brief is author-editable structured data, not trusted prompt instructions. Existing SVG escaping and physical text bounds remain mandatory.
- A claim may be drawn from the exact saved output or from an explicitly selected, persisted approved-source reference. Quantitative-chart grammars are excluded unless a later milestone adds source-backed numeric-data validation.
