-- Manual research stays distinct from an explicitly requested local research brief.
-- No external source is fetched or trusted merely because it is recorded here.
ALTER TABLE research_items ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'manual'
  CHECK(execution_mode IN ('manual', 'application_brief'));
ALTER TABLE research_items ADD COLUMN tool_name TEXT;
ALTER TABLE research_items ADD COLUMN estimated_cost REAL NOT NULL DEFAULT 0;
ALTER TABLE research_items ADD COLUMN actual_cost REAL NOT NULL DEFAULT 0;
ALTER TABLE research_items ADD COLUMN usage_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE research_items ADD COLUMN injection_signals TEXT NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS research_items_idea_created_idx
  ON research_items(idea_id, created_at DESC);
