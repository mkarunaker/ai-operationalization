-- Milestone 6.2 keeps the pushed platform-first migration history intact,
-- but makes the active authoring model reader/output-first. Existing records
-- are mapped only so an old local database can open safely; new application
-- code must never create or depend on the legacy values.

ALTER TABLE ideas ADD COLUMN output_shape TEXT NOT NULL DEFAULT 'short'
  CHECK(output_shape IN ('short', 'long', 'long_with_derived_short'));

UPDATE ideas
SET output_shape = CASE
  WHEN publication_plan IN ('medium_linkedin', 'substack_linkedin') THEN 'long_with_derived_short'
  WHEN publication_plan IN ('medium', 'substack') THEN 'long'
  ELSE 'short'
END;

ALTER TABLE editorial_run_snapshots ADD COLUMN output_shape TEXT;

UPDATE editorial_run_snapshots
SET output_shape = CASE
  WHEN publication_plan IN ('medium_linkedin', 'substack_linkedin') THEN 'long_with_derived_short'
  WHEN publication_plan IN ('medium', 'substack') THEN 'long'
  ELSE 'short'
END;

-- Intake may retain a free-form reader/distribution context, but it must not
-- select a delivery platform. Preserve any old local note as context while
-- new intake writes use the neutral column.
ALTER TABLE content_intent_briefs ADD COLUMN reader_context TEXT;

UPDATE content_intent_briefs
SET reader_context = intended_platform
WHERE reader_context IS NULL AND intended_platform IS NOT NULL;

UPDATE draft_versions
SET publication_format = CASE publication_format
  WHEN 'canonical' THEN 'article'
  WHEN 'linkedin_companion' THEN 'derived_short'
  ELSE 'short'
END;

-- SQLite cannot alter the relationship CHECK constraint in place. Rebuild
-- only this small relationship table and retain parent/child identity.
CREATE TABLE draft_relationships_next (
  parent_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  child_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('derived_short')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (parent_draft_version_id, child_draft_version_id)
);

INSERT INTO draft_relationships_next (parent_draft_version_id, child_draft_version_id, relationship_type, created_at)
SELECT parent_draft_version_id, child_draft_version_id, 'derived_short', created_at
FROM draft_relationships;

DROP TABLE draft_relationships;
ALTER TABLE draft_relationships_next RENAME TO draft_relationships;

CREATE UNIQUE INDEX derived_short_single_parent_unique
  ON draft_relationships(child_draft_version_id)
  WHERE relationship_type = 'derived_short';

-- The earlier, platform-named approval tables are immutable migration
-- history. Active application code uses these output-neutral records.
CREATE TABLE article_draft_approvals (
  article_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  approved_at TEXT NOT NULL
);

INSERT OR IGNORE INTO article_draft_approvals (article_draft_version_id, idea_id, approved_at)
SELECT canonical_draft_version_id, idea_id, approved_at
FROM canonical_draft_approvals;

CREATE TABLE derived_short_approvals (
  derived_short_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE,
  idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  approved_at TEXT NOT NULL
);

INSERT OR IGNORE INTO derived_short_approvals (derived_short_draft_version_id, idea_id, approved_at)
SELECT companion_draft_version_id, idea_id, approved_at
FROM linkedin_companion_approvals;

-- Delivery destination is an event recorded only at Finalize. The historical
-- column has no constraint, so rename it in place to retain every dependent
-- publication-provenance, performance, feedback, and retrospective record.
ALTER TABLE publications RENAME COLUMN platform TO channel;
