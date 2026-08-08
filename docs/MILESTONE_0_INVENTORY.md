# Milestone 0 worktree inventory

Captured on 2026-08-06 before any new commit.

## Commit candidates from Milestones 0 and prior local development

- Documentation and decisions: `BUILD_ROADMAP.md`, `LEAN_PRODUCT_SCOPE.md`, `REVISED_BUILD_PROMPT.md`, `README.md`, `ARCHITECTURE.md`, `DEVELOPMENT.md`, `PRODUCT_REQUIREMENTS.md`, `IMPLEMENTATION_PLAN.md`, `IMPLEMENTATION_STATUS.md`, `DECISIONS.md`, `docs/LOCAL_BACKUP.md`, and `docs/adr/0003-lean-product-contract.md`.
- Application and tests already modified in the shared worktree: the lean idea routes, queue/workspace UI, stylesheet, lean service, and integration test.
- Additive migrations: `003_final_draft_review.sql`, `004_editorial_backbone_themes.sql`, and `005_normalize_canonical_theme_labels.sql`.

These files must still receive a final staged-diff review before a commit. Nothing was staged during Milestone 0.

## Local-only material excluded from Git

- `data/`, including the SQLite database and Milestone 0 backups.
- `content/knowledge/`, including the BOK.
- `content/editorial-notebook/`, including current Notebook content and snapshots.
- `.env` and `.env.*` files.
- Generated directories: `node_modules/`, `.next/`, coverage, and Playwright artifacts.

## User reference material excluded from Git

- `The_Missing_Middle_of_Enterprise_AI-v0.2.pdf`
- `missing-middle-2x2.png`
- `archive/`

## Backup evidence

The consistent SQLite snapshot and restore-validation copy are local-only under `data/backups/`. Both have owner-only permissions. The source backup passes `PRAGMA integrity_check`, contains six ideas and two publication records, and contains migrations 001–004. The restore-validation copy passes the same integrity and record-count checks.

## Rules before commit

- Confirm no ignored source, Notebook, database, backup, secret, archive, or reference asset has been force-added.
- Inspect the staged file list and `git diff --cached --check`.
- Keep migrations ordered, additive, and accompanied by test evidence.
- Do not commit generated `next-env.d.ts` changes unless a Next.js upgrade makes it necessary.
