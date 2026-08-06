# Decisions

See `docs/adr` for architecture decision records.

Current decisions:

- Local-only, single-user app with no OAuth.
- SQLite plus FTS5, no embeddings for the MVP.
- Node built-in SQLite driver and explicit SQL migrations.
- Lowest reasonably capable model is the default execution policy.
