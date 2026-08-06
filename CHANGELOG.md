# Changelog

## 0.1.0 — Milestone 1 foundation

- Added a local Next.js application scaffold.
- Added local authentication boundary, SQLite schema/migrations, provider contracts, mock provider, job state machine, prompts, schemas, tests, and foundational documentation.

## Local-only access decision

- Removed the login and session-secret requirement by explicit user decision. The app now opens directly on loopback port 3100.
