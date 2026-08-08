CREATE TABLE IF NOT EXISTS recommendation_dispositions (
  source_review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  disposition TEXT NOT NULL CHECK(disposition IN ('resolved', 'revised', 'superseded', 'still_open')),
  note TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_review_run_id, recommendation_text)
);

CREATE TABLE IF NOT EXISTS publication_provenance (
  publication_id TEXT PRIMARY KEY REFERENCES publications(id) ON DELETE CASCADE,
  editorial_review_run_id TEXT REFERENCES review_runs(id),
  final_review_run_id TEXT REFERENCES review_runs(id),
  voice_check_json TEXT NOT NULL,
  reviewed_draft_version_id TEXT REFERENCES draft_versions(id),
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
