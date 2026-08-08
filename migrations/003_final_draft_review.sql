ALTER TABLE review_runs ADD COLUMN review_type TEXT NOT NULL DEFAULT 'editorial'
  CHECK(review_type IN ('editorial', 'final_draft'));

CREATE INDEX IF NOT EXISTS review_runs_content_type_completed_idx
  ON review_runs(content_item_id, review_type, completed_at DESC);
