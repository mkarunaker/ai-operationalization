# ADR 0001: Use Node built-in SQLite with explicit SQL migrations

## Status

Accepted.

## Context

The application is local-only, single-user, and intentionally lightweight. The BOK and content library are small, and the user explicitly does not need Docker, PostgreSQL, embeddings, or vector search for the MVP.

## Decision

Use Node's built-in `node:sqlite` module, SQLite FTS5, and versioned SQL migration files. Keep persistence access behind repository contracts so a future PostgreSQL implementation remains possible.

## Consequences

No database server, Docker daemon, native SQLite package, or ORM runtime is required. FTS5 supports the initial keyword-and-heading retrieval design. Schema access remains explicit, but a future migration would require new repository adapters and migration planning.
