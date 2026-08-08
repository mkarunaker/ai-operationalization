UPDATE themes SET name = 'See through the AI hype'
  WHERE name = 'From AI hype to AI value';

UPDATE themes SET name = 'Understand the operationalization gap'
  WHERE name = 'Enterprise AI operationalization';

UPDATE themes SET name = 'Improve leadership judgment'
  WHERE name = 'Responsible AI leadership and decision-making';

UPDATE themes SET name = 'Select the right work'
  WHERE name = 'AI solution intake and use-case discipline';

UPDATE themes SET name = 'Build, adopt, and operate with principles'
  WHERE name = 'Principles for building agentic systems responsibly';

DELETE FROM themes
  WHERE name = 'Thinking clearly about AI and organizational change'
    AND NOT EXISTS (SELECT 1 FROM idea_themes WHERE idea_themes.theme_id = themes.id);
