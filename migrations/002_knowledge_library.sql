-- Keep historical single-file snapshots readable while recording the exact
-- selected multi-document library for every new Editorial Board run.
CREATE TABLE knowledge_library_selections (
  source_path TEXT PRIMARY KEY,
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Historical single-file BOK records and sections remain immutable evidence,
-- but they are never eligible for a future library-backed retrieval.
UPDATE knowledge_documents
SET status = 'retired', updated_at = CURRENT_TIMESTAMP
WHERE source_type = 'book_of_knowledge';

ALTER TABLE editorial_run_snapshots
  ADD COLUMN bok_sources_json TEXT NOT NULL DEFAULT '[]';
