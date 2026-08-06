ALTER TABLE ideas ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
ALTER TABLE ideas ADD COLUMN publication_plan TEXT;

CREATE TABLE IF NOT EXISTS themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS idea_themes (
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idea_id, theme_id)
);

CREATE TABLE IF NOT EXISTS idea_notes (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'note',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_items (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK(mode IN ('none', 'provided', 'application')),
  question TEXT,
  time_window TEXT,
  evidence_summary TEXT,
  interpretation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS research_sources (
  id TEXT PRIMARY KEY,
  research_item_id TEXT NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_url TEXT,
  published_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS draft_relationships (
  parent_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  child_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('linkedin_companion')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (parent_draft_version_id, child_draft_version_id)
);

CREATE INDEX IF NOT EXISTS ideas_status_priority_idx ON ideas(status, priority DESC, updated_at DESC);
CREATE INDEX IF NOT EXISTS idea_themes_theme_idx ON idea_themes(theme_id);
CREATE INDEX IF NOT EXISTS idea_notes_idea_created_idx ON idea_notes(idea_id, created_at);
