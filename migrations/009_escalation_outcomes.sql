CREATE TABLE IF NOT EXISTS escalation_outcomes (
  model_call_id TEXT PRIMARY KEY REFERENCES model_calls(id) ON DELETE CASCADE,
  review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE,
  prior_lower_cost_model_call_id TEXT REFERENCES model_calls(id),
  prior_review_run_id TEXT REFERENCES review_runs(id),
  output_accepted INTEGER CHECK(output_accepted IN (0, 1)),
  influenced_final_draft INTEGER CHECK(influenced_final_draft IN (0, 1)),
  materially_improved INTEGER CHECK(materially_improved IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS escalation_outcomes_review_run_idx
  ON escalation_outcomes(review_run_id);
