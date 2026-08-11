-- Milestone 7 establishes an explicit, exact-output visual-brief lifecycle.
-- It is additive: existing deterministic visual companions remain readable,
-- but new rendering will require an approved brief linked to one saved draft.

CREATE TABLE visual_briefs (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  output_format TEXT NOT NULL CHECK(output_format IN ('short', 'article', 'derived_short')),
  recommendation TEXT NOT NULL CHECK(recommendation IN ('no_visual', 'visual')),
  rationale TEXT NOT NULL,
  purpose TEXT CHECK(purpose IN ('contrast', 'decision_path', 'sequence', 'lifecycle', 'framework', 'comparison')),
  -- `vertical_path` is the only persisted vertical grammar. Renderer-only
  -- compatibility for legacy visual assets is handled outside this table.
  visual_type TEXT CHECK(visual_type IN ('flow', 'vertical_path', 'contrast', 'decision_fork')),
  source_draft_text TEXT NOT NULL,
  reader_contract_json TEXT NOT NULL,
  author_direction TEXT NOT NULL DEFAULT '',
  claims_json TEXT NOT NULL,
  labels_json TEXT NOT NULL,
  caption TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  placement TEXT CHECK(placement IN ('lead', 'supporting')),
  status TEXT NOT NULL CHECK(status IN ('recommended', 'approved', 'dismissed', 'rendered')),
  revision_number INTEGER NOT NULL DEFAULT 1 CHECK(revision_number >= 1),
  approved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX visual_briefs_draft_status_idx
  ON visual_briefs(draft_version_id, status, created_at DESC);

-- The service checks these limits inside its writer transaction so it can give
-- the author a clear explanation. Keep the database as the final authority as
-- well: a second local writer, import, or future route must not create a
-- second active lead for one exact output.
CREATE UNIQUE INDEX visual_briefs_one_active_lead_idx
  ON visual_briefs(draft_version_id)
  WHERE placement = 'lead' AND status != 'dismissed';

-- SQLite serializes writers, but these triggers also protect direct database
-- writes and placement/status updates that do not go through the service.
CREATE TRIGGER visual_briefs_limit_before_insert
BEFORE INSERT ON visual_briefs
WHEN NEW.status != 'dismissed' AND NEW.placement IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NEW.placement = 'lead' AND EXISTS (
      SELECT 1 FROM visual_briefs
      WHERE draft_version_id = NEW.draft_version_id
        AND placement = 'lead'
        AND status != 'dismissed'
    ) THEN RAISE(ABORT, 'This exact saved output already has a lead visual brief.')
  END;
  SELECT CASE
    WHEN NEW.placement = 'supporting' AND (
      SELECT COUNT(*) FROM visual_briefs
      WHERE draft_version_id = NEW.draft_version_id
        AND placement = 'supporting'
        AND status != 'dismissed'
    ) >= 2 THEN RAISE(ABORT, 'This exact saved output already has two supporting visual briefs.')
  END;
END;

CREATE TRIGGER visual_briefs_limit_before_update
BEFORE UPDATE OF draft_version_id, placement, status ON visual_briefs
WHEN NEW.status != 'dismissed' AND NEW.placement IS NOT NULL
BEGIN
  SELECT CASE
    WHEN NEW.placement = 'lead' AND EXISTS (
      SELECT 1 FROM visual_briefs
      WHERE draft_version_id = NEW.draft_version_id
        AND placement = 'lead'
        AND status != 'dismissed'
        AND id != NEW.id
    ) THEN RAISE(ABORT, 'This exact saved output already has a lead visual brief.')
  END;
  SELECT CASE
    WHEN NEW.placement = 'supporting' AND (
      SELECT COUNT(*) FROM visual_briefs
      WHERE draft_version_id = NEW.draft_version_id
        AND placement = 'supporting'
        AND status != 'dismissed'
        AND id != NEW.id
    ) >= 2 THEN RAISE(ABORT, 'This exact saved output already has two supporting visual briefs.')
  END;
END;

ALTER TABLE visual_companions ADD COLUMN visual_brief_id TEXT REFERENCES visual_briefs(id) ON DELETE SET NULL;
CREATE INDEX visual_companions_brief_idx
  ON visual_companions(visual_brief_id);
