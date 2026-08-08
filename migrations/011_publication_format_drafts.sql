ALTER TABLE draft_versions ADD COLUMN publication_format TEXT NOT NULL DEFAULT 'linkedin';

CREATE TABLE IF NOT EXISTS canonical_draft_approvals (
  canonical_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS canonical_draft_approvals_idea_idx
  ON canonical_draft_approvals(idea_id, approved_at DESC);
