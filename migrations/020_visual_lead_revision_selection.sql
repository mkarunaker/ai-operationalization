-- Milestone 7.1 adds an explicit active-lead pointer without rewriting the
-- approved visual-brief history. A replacement brief remains an unplaced
-- candidate until it has been approved and rendered; then this pointer, not a
-- destructive update, selects which immutable lead is shown in Write/Finalize.

CREATE TABLE visual_lead_selections (
  draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE,
  visual_brief_id TEXT NOT NULL UNIQUE REFERENCES visual_briefs(id) ON DELETE CASCADE,
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX visual_lead_selections_brief_idx
  ON visual_lead_selections(visual_brief_id);
