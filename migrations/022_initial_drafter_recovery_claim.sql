-- One explicit Initial Drafter retry is permitted for a failed Board run.
-- This durable unique claim is inserted immediately before provider dispatch,
-- closing the gap between read-only eligibility and later attempt persistence.
CREATE TABLE initial_drafter_recovery_claims (
  review_run_id TEXT PRIMARY KEY REFERENCES review_runs(id) ON DELETE CASCADE,
  claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
