CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title TEXT,
  raw_notes TEXT NOT NULL,
  source TEXT,
  theme TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intake_conversations (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL REFERENCES ideas(id),
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intake_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES intake_conversations(id),
  role TEXT NOT NULL,
  message_type TEXT NOT NULL,
  body TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  model_call_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(conversation_id, sequence)
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  idea_id TEXT REFERENCES ideas(id),
  content_type TEXT NOT NULL,
  working_title TEXT,
  target_audience TEXT,
  intended_platform TEXT,
  objective TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_intent_briefs (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL REFERENCES content_items(id),
  working_title TEXT,
  central_thesis TEXT,
  intended_audience TEXT,
  purpose TEXT,
  trigger_context TEXT,
  supporting_points TEXT NOT NULL DEFAULT '[]',
  user_provided_evidence TEXT NOT NULL DEFAULT '[]',
  claims_requiring_validation TEXT NOT NULL DEFAULT '[]',
  possible_counterargument TEXT,
  desired_tone TEXT,
  intended_platform TEXT,
  suggested_length TEXT,
  relationship_to_previous_posts TEXT,
  open_questions TEXT NOT NULL DEFAULT '[]',
  system_assumptions TEXT NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_item_id, version)
);

CREATE TABLE IF NOT EXISTS voice_skill_versions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_path TEXT NOT NULL,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL,
  loaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT NOT NULL DEFAULT '{}',
  UNIQUE(source_path, checksum)
);

CREATE TABLE IF NOT EXISTS draft_versions (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL REFERENCES content_items(id),
  version_number INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_by TEXT NOT NULL,
  parent_version_id TEXT REFERENCES draft_versions(id),
  change_summary TEXT,
  voice_skill_version_id TEXT REFERENCES voice_skill_versions(id),
  model_call_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(content_item_id, version_number)
);

CREATE TABLE IF NOT EXISTS agent_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  prompt_path TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  prompt_checksum TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1))
);

CREATE TABLE IF NOT EXISTS model_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  adapter_type TEXT NOT NULL,
  endpoint TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  configuration TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL REFERENCES model_providers(id),
  model_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  capabilities TEXT NOT NULL DEFAULT '{}',
  context_limit INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)),
  UNIQUE(provider_id, model_key)
);

CREATE TABLE IF NOT EXISTS model_pricing (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES models(id),
  currency TEXT NOT NULL,
  input_price_per_million REAL NOT NULL,
  cached_input_price_per_million REAL,
  output_price_per_million REAL NOT NULL,
  reasoning_price_per_million REAL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  source_note TEXT
);

CREATE TABLE IF NOT EXISTS agent_configurations (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES agent_roles(id),
  model_id TEXT NOT NULL REFERENCES models(id),
  prompt_version TEXT NOT NULL,
  temperature REAL,
  max_output_tokens INTEGER,
  reasoning_effort TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS active_agent_configuration_per_role
  ON agent_configurations(role_id) WHERE active = 1;

CREATE TABLE IF NOT EXISTS review_runs (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL REFERENCES content_items(id),
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id),
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'partially_completed', 'failed')),
  estimated_cost REAL NOT NULL DEFAULT 0,
  actual_cost REAL,
  budget_cap REAL,
  started_at TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_reviews (
  id TEXT PRIMARY KEY,
  review_run_id TEXT NOT NULL REFERENCES review_runs(id),
  role_id TEXT NOT NULL REFERENCES agent_roles(id),
  model_id TEXT REFERENCES models(id),
  prompt_version TEXT NOT NULL,
  structured_output TEXT,
  text_output TEXT,
  confidence_score REAL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'partially_structured', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  id TEXT PRIMARY KEY,
  agent_review_id TEXT NOT NULL REFERENCES agent_reviews(id),
  category TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  severity TEXT NOT NULL,
  user_decision TEXT,
  user_note TEXT,
  applied_to_version_id TEXT REFERENCES draft_versions(id)
);

CREATE TABLE IF NOT EXISTS model_calls (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id),
  draft_version_id TEXT REFERENCES draft_versions(id),
  prompt_template_id TEXT,
  prompt_template_version TEXT,
  voice_skill_version_id TEXT REFERENCES voice_skill_versions(id),
  input_tokens INTEGER,
  cached_input_tokens INTEGER,
  output_tokens INTEGER,
  reasoning_tokens INTEGER,
  total_tokens INTEGER,
  estimated_input_cost REAL,
  estimated_output_cost REAL,
  estimated_total_cost REAL,
  actual_billed_cost REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  pricing_record_id TEXT REFERENCES model_pricing(id),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT,
  latency_ms INTEGER,
  success INTEGER NOT NULL CHECK(success IN (0, 1)),
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_category TEXT,
  escalation_reason TEXT,
  prior_lower_cost_model_call_id TEXT REFERENCES model_calls(id),
  budget_cap REAL,
  projected_cost_at_escalation REAL,
  escalation_materially_improved INTEGER CHECK(escalation_materially_improved IN (0, 1)),
  provider_request_id TEXT,
  raw_usage TEXT NOT NULL DEFAULT '{}',
  user_rating TEXT,
  output_accepted INTEGER CHECK(output_accepted IN (0, 1)),
  influenced_final_draft INTEGER CHECK(influenced_final_draft IN (0, 1))
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_path TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_sections (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES knowledge_documents(id),
  heading_path TEXT NOT NULL,
  text TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  embedding_reference TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  UNIQUE(document_id, heading_path, sequence)
);

CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_search USING fts5(
  section_id UNINDEXED,
  heading_path,
  text
);

CREATE TABLE IF NOT EXISTS retrieval_records (
  id TEXT PRIMARY KEY,
  model_call_id TEXT NOT NULL REFERENCES model_calls(id),
  knowledge_section_id TEXT NOT NULL REFERENCES knowledge_sections(id),
  relevance_score REAL NOT NULL,
  retrieval_method TEXT NOT NULL,
  rank INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL REFERENCES content_items(id),
  draft_version_id TEXT NOT NULL REFERENCES draft_versions(id),
  platform TEXT NOT NULL,
  publication_url TEXT,
  published_at TEXT NOT NULL,
  final_text TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS performance_snapshots (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publications(id),
  captured_at TEXT NOT NULL,
  impressions INTEGER,
  reactions INTEGER,
  comments INTEGER,
  reposts INTEGER,
  saves INTEGER,
  clicks INTEGER,
  follows INTEGER,
  other_metrics TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS feedback_items (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publications(id),
  source TEXT NOT NULL,
  feedback_type TEXT NOT NULL,
  author_or_audience_type TEXT,
  text TEXT NOT NULL,
  sentiment TEXT,
  theme TEXT,
  user_interpretation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retrospectives (
  id TEXT PRIMARY KEY,
  publication_id TEXT NOT NULL REFERENCES publications(id),
  what_worked TEXT,
  what_did_not TEXT,
  unexpected_feedback TEXT,
  follow_up_ideas TEXT,
  strategic_value TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ideas_project_status_idx ON ideas(project_id, status);
CREATE INDEX IF NOT EXISTS draft_versions_content_idx ON draft_versions(content_item_id, version_number);
CREATE INDEX IF NOT EXISTS review_runs_content_status_idx ON review_runs(content_item_id, status);
CREATE INDEX IF NOT EXISTS agent_reviews_run_status_idx ON agent_reviews(review_run_id, status);
CREATE INDEX IF NOT EXISTS model_calls_role_started_idx ON model_calls(agent_role, started_at);
CREATE INDEX IF NOT EXISTS retrieval_records_model_call_rank_idx ON retrieval_records(model_call_id, rank);
CREATE INDEX IF NOT EXISTS performance_snapshots_publication_captured_idx ON performance_snapshots(publication_id, captured_at);
