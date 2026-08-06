# Data Model

The executable system-of-record schema is `migrations/001_foundation.sql`.

Core groups:

- Authoring: users, projects, ideas, intake conversations/messages, content items, intent briefs, draft versions.
- Configuration: agent roles, providers, models, pricing, active role configurations, voice-skill versions.
- Review execution: review runs, agent reviews, recommendations, model calls, retrieval records.
- Knowledge: documents, heading-aware sections, FTS5 search index.
- Learning history: publications, performance snapshots, feedback items, retrospectives.

Foreign keys, immutable version uniqueness, active role configuration uniqueness, run status checks, and retrieval/model-call indexes are enforced in SQL.
