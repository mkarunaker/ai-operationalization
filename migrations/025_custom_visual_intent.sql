-- An optional author direction must not decide whether a custom image exists.
-- Preserve prior literal custom concepts, then mark every future custom brief
-- explicitly so article-only illustration requests are visible and actionable.
ALTER TABLE visual_briefs ADD COLUMN custom_illustration INTEGER NOT NULL DEFAULT 0 CHECK(custom_illustration IN (0, 1));
UPDATE visual_briefs
  SET custom_illustration = 1
  WHERE recommendation = 'no_visual' AND author_direction != '';
