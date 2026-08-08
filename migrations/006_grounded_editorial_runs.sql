ALTER TABLE review_runs ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'simulation'
  CHECK(execution_mode IN ('simulation', 'grounded_test', 'live'));

ALTER TABLE knowledge_sections ADD COLUMN source_version TEXT;

CREATE INDEX IF NOT EXISTS knowledge_sections_document_version_idx
  ON knowledge_sections(document_id, source_version);

CREATE TABLE IF NOT EXISTS editorial_run_snapshots (
  id TEXT PRIMARY KEY,
  review_run_id TEXT NOT NULL UNIQUE REFERENCES review_runs(id) ON DELETE CASCADE,
  generated_draft_version_id TEXT REFERENCES draft_versions(id),
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  content_item_id TEXT NOT NULL REFERENCES content_items(id),
  original_capture TEXT NOT NULL,
  notes_json TEXT NOT NULL,
  clarification_answers_json TEXT NOT NULL,
  themes_json TEXT NOT NULL,
  publication_plan TEXT,
  bok_document_id TEXT REFERENCES knowledge_documents(id),
  bok_version TEXT,
  bok_checksum TEXT,
  voice_skill_version_id TEXT REFERENCES voice_skill_versions(id),
  voice_skill_version TEXT,
  voice_skill_checksum TEXT,
  prompt_manifest TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS editorial_run_snapshots_idea_created_idx
  ON editorial_run_snapshots(idea_id, created_at DESC);
