-- Enforce the exact-version relationships that the local service validates.
-- Existing historical duplicates are intentionally not rewritten. Applying this
-- migration will fail safely until the local owner resolves them from a backup.

CREATE UNIQUE INDEX IF NOT EXISTS publications_draft_version_unique
  ON publications(draft_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS linkedin_companion_single_parent_unique
  ON draft_relationships(child_draft_version_id)
  WHERE relationship_type = 'linkedin_companion';
