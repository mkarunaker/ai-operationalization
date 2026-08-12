-- Custom illustrations are immutable local PNG assets. Keep their metadata in
-- the existing versioned companion record so lead selection and history stay
-- exact-output scoped, but extend the renderer type explicitly rather than
-- passing arbitrary image paths through the browser.
CREATE TABLE visual_companions_next (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL CHECK(visual_type IN ('flow', 'maturity_path', 'contrast', 'decision_fork', 'custom_image')),
  color_scheme TEXT NOT NULL DEFAULT 'violet',
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visual_brief_id TEXT REFERENCES visual_briefs(id) ON DELETE SET NULL
);

INSERT INTO visual_companions_next (
  id, idea_id, content_item_id, draft_version_id, visual_type, color_scheme,
  title, subtitle, steps_json, alt_text, caption, file_path, created_at, visual_brief_id
)
SELECT
  id, idea_id, content_item_id, draft_version_id, visual_type, color_scheme,
  title, subtitle, steps_json, alt_text, caption, file_path, created_at, visual_brief_id
FROM visual_companions;

DROP TABLE visual_companions;
ALTER TABLE visual_companions_next RENAME TO visual_companions;
CREATE INDEX visual_companions_draft_created_idx ON visual_companions(draft_version_id, created_at DESC);
CREATE INDEX visual_companions_brief_idx ON visual_companions(visual_brief_id);

-- Each paid request is durable provenance even if provider dispatch or file
-- persistence fails. The prompt and image bytes are intentionally never
-- stored in SQLite.
CREATE TABLE custom_visual_attempts (
  id TEXT PRIMARY KEY,
  visual_brief_id TEXT NOT NULL REFERENCES visual_briefs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  pricing_assumption TEXT NOT NULL,
  estimated_cost REAL NOT NULL CHECK(estimated_cost >= 0),
  reserved_cost REAL NOT NULL CHECK(reserved_cost >= 0),
  actual_cost REAL,
  status TEXT NOT NULL CHECK(status IN ('dispatching', 'completed', 'failed')),
  provider_request_id TEXT,
  latency_ms INTEGER,
  failure_category TEXT,
  injection_signals_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);
CREATE INDEX custom_visual_attempts_brief_created_idx ON custom_visual_attempts(visual_brief_id, created_at DESC);
