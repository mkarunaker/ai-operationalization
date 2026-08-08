# Decisions

See `docs/adr` for architecture decision records.

Current decisions:

- Local-only, single-user app with no OAuth.
- Local-only access bypasses application login by explicit user decision; see ADR 0002.
- SQLite plus FTS5, no embeddings for the MVP.
- Node built-in SQLite driver and explicit SQL migrations.
- Lowest reasonably capable model is the default execution policy.
- The accepted lean local product contract is recorded in ADR 0003; `BUILD_ROADMAP.md` is the active milestone sequence.
