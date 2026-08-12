-- A visual asset version is immutable once its candidate is created. The
-- existing revision_number remains a mutable brief-edit count until approval.
ALTER TABLE visual_briefs ADD COLUMN visual_version_number INTEGER NOT NULL DEFAULT 1;
