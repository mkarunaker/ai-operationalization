-- A palette is an approved, immutable property of each visual version. The
-- service validates the finite local enum; defaults preserve every prior SVG.
ALTER TABLE visual_briefs ADD COLUMN color_scheme TEXT NOT NULL DEFAULT 'violet';
ALTER TABLE visual_companions ADD COLUMN color_scheme TEXT NOT NULL DEFAULT 'violet';
