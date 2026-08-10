-- Reader-first output preferences are additive. Existing publication plans and
-- draft formats remain the compatibility source for historical content.

ALTER TABLE ideas ADD COLUMN audience_profile_key TEXT;
ALTER TABLE ideas ADD COLUMN audience_notes TEXT;

CREATE TABLE idea_output_preferences (
  idea_id TEXT PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE,
  long_form_enabled INTEGER NOT NULL DEFAULT 0 CHECK(long_form_enabled IN (0, 1)),
  long_form_min_words INTEGER NOT NULL DEFAULT 800 CHECK(long_form_min_words >= 100 AND long_form_min_words <= 10000),
  long_form_max_words INTEGER NOT NULL DEFAULT 1100 CHECK(long_form_max_words >= 100 AND long_form_max_words <= 10000),
  short_form_enabled INTEGER NOT NULL DEFAULT 1 CHECK(short_form_enabled IN (0, 1)),
  short_form_min_words INTEGER NOT NULL DEFAULT 180 CHECK(short_form_min_words >= 40 AND short_form_min_words <= 5000),
  short_form_max_words INTEGER NOT NULL DEFAULT 300 CHECK(short_form_max_words >= 40 AND short_form_max_words <= 5000),
  short_form_source TEXT NOT NULL DEFAULT 'standalone' CHECK(short_form_source IN ('standalone', 'derived_from_long')),
  delivery_hint TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(long_form_min_words <= long_form_max_words),
  CHECK(short_form_min_words <= short_form_max_words),
  CHECK(long_form_enabled = 1 OR short_form_enabled = 1),
  CHECK(short_form_enabled = 1 OR short_form_source = 'standalone')
);

-- Compatibility backfill. Do not update the legacy publication_plan field.
INSERT INTO idea_output_preferences (idea_id, long_form_enabled, short_form_enabled, short_form_source)
SELECT
  id,
  CASE WHEN publication_plan IN ('medium', 'substack', 'medium_linkedin', 'substack_linkedin') THEN 1 ELSE 0 END,
  CASE WHEN publication_plan IS NULL OR publication_plan IN ('linkedin', 'medium_linkedin', 'substack_linkedin') THEN 1 ELSE 0 END,
  CASE WHEN publication_plan IN ('medium_linkedin', 'substack_linkedin') THEN 'derived_from_long' ELSE 'standalone' END
FROM ideas;

CREATE TABLE review_finding_dispositions (
  id TEXT PRIMARY KEY,
  review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE,
  finding_id TEXT NOT NULL,
  disposition TEXT NOT NULL CHECK(disposition IN ('accepted', 'dismissed', 'revised', 'still_open')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(review_run_id, finding_id)
);

CREATE INDEX review_finding_dispositions_run_idx
  ON review_finding_dispositions(review_run_id, created_at);
