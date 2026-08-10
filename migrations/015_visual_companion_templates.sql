-- Adds the quiet vertical maturity-path visual template while preserving every
-- existing visual record and file path. Apply through the explicit owner-only
-- migration workflow after a verified backup.
CREATE TABLE visual_companions_next (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL CHECK(visual_type IN ('flow', 'maturity_path')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO visual_companions_next (
  id, idea_id, content_item_id, draft_version_id, visual_type, title, subtitle,
  steps_json, alt_text, caption, file_path, created_at
)
SELECT
  id, idea_id, content_item_id, draft_version_id, visual_type, title, subtitle,
  steps_json, alt_text, caption, file_path, created_at
FROM visual_companions;

DROP TABLE visual_companions;
ALTER TABLE visual_companions_next RENAME TO visual_companions;

CREATE INDEX visual_companions_draft_created_idx
  ON visual_companions(draft_version_id, created_at DESC);
