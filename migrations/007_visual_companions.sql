CREATE TABLE IF NOT EXISTS visual_companions (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL CHECK(visual_type IN ('flow')),
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS visual_companions_draft_created_idx
  ON visual_companions(draft_version_id, created_at DESC);
