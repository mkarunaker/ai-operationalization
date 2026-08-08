INSERT OR IGNORE INTO users (id, name, email)
  VALUES ('local-user', 'Local owner', 'local@ai-editorial-board.local');

INSERT OR IGNORE INTO projects (id, user_id, title, description, status)
  VALUES ('local-editorial-board', 'local-user', 'AI Editorial Board', 'Local private editorial workspace', 'active');

INSERT OR IGNORE INTO themes (id, name) VALUES
  ('theme_1e4ac8703f0c4bfe599f', 'See through the AI hype'),
  ('theme_ee56990ede8d7bba6637', 'Understand the operationalization gap'),
  ('theme_ac4fdb10b830dd2b6175', 'Improve leadership judgment'),
  ('theme_4724e08eae585a650830', 'Select the right work'),
  ('theme_3eaf4573c8713181692b', 'Build, adopt, and operate with principles');
