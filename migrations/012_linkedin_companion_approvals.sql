CREATE TABLE IF NOT EXISTS linkedin_companion_approvals (
  companion_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS linkedin_companion_approvals_idea_idx
  ON linkedin_companion_approvals(idea_id, approved_at DESC);
