-- Clean local baseline. This file intentionally describes the current product
-- from an empty database; it carries no historical compatibility tables.
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE projects (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, description TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE ideas (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT, raw_notes TEXT NOT NULL,
  source TEXT, status TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 0,
  audience_profile_key TEXT, audience_notes TEXT,
  output_shape TEXT NOT NULL DEFAULT 'short' CHECK(output_shape IN ('short', 'long', 'long_with_derived_short')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE intake_conversations (id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id), status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE intake_messages (id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES intake_conversations(id), role TEXT NOT NULL, message_type TEXT NOT NULL, body TEXT NOT NULL, sequence INTEGER NOT NULL, model_call_id TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(conversation_id, sequence));
CREATE TABLE content_items (id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), idea_id TEXT REFERENCES ideas(id), content_type TEXT NOT NULL, working_title TEXT, target_audience TEXT, objective TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE content_intent_briefs (
  id TEXT PRIMARY KEY, content_item_id TEXT NOT NULL REFERENCES content_items(id), working_title TEXT, central_thesis TEXT, intended_audience TEXT,
  purpose TEXT, trigger_context TEXT, supporting_points TEXT NOT NULL DEFAULT '[]', user_provided_evidence TEXT NOT NULL DEFAULT '[]', claims_requiring_validation TEXT NOT NULL DEFAULT '[]',
  possible_counterargument TEXT, desired_tone TEXT, suggested_length TEXT, relationship_to_previous_posts TEXT, reader_context TEXT,
  open_questions TEXT NOT NULL DEFAULT '[]', system_assumptions TEXT NOT NULL DEFAULT '[]', version INTEGER NOT NULL, status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(content_item_id, version)
);
CREATE TABLE voice_skill_versions (id TEXT PRIMARY KEY, name TEXT NOT NULL, source_path TEXT NOT NULL, version TEXT NOT NULL, checksum TEXT NOT NULL, status TEXT NOT NULL, loaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, metadata TEXT NOT NULL DEFAULT '{}', UNIQUE(source_path, checksum));
CREATE TABLE draft_versions (
  id TEXT PRIMARY KEY, content_item_id TEXT NOT NULL REFERENCES content_items(id), version_number INTEGER NOT NULL, body TEXT NOT NULL,
  created_by TEXT NOT NULL, parent_version_id TEXT REFERENCES draft_versions(id), change_summary TEXT, voice_skill_version_id TEXT REFERENCES voice_skill_versions(id), model_call_id TEXT,
  publication_format TEXT NOT NULL DEFAULT 'short', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(content_item_id, version_number)
);
CREATE TABLE agent_roles (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, description TEXT NOT NULL, prompt_path TEXT NOT NULL, prompt_version TEXT NOT NULL, prompt_checksum TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)));
CREATE TABLE model_providers (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, adapter_type TEXT NOT NULL, endpoint TEXT, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)), configuration TEXT NOT NULL DEFAULT '{}');
CREATE TABLE models (id TEXT PRIMARY KEY, provider_id TEXT NOT NULL REFERENCES model_providers(id), model_key TEXT NOT NULL, display_name TEXT NOT NULL, capabilities TEXT NOT NULL DEFAULT '{}', context_limit INTEGER, enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN (0, 1)), UNIQUE(provider_id, model_key));
CREATE TABLE model_pricing (id TEXT PRIMARY KEY, model_id TEXT NOT NULL REFERENCES models(id), currency TEXT NOT NULL, input_price_per_million REAL NOT NULL, cached_input_price_per_million REAL, output_price_per_million REAL NOT NULL, reasoning_price_per_million REAL, effective_from TEXT NOT NULL, effective_to TEXT, source_note TEXT);
CREATE TABLE agent_configurations (id TEXT PRIMARY KEY, role_id TEXT NOT NULL REFERENCES agent_roles(id), model_id TEXT NOT NULL REFERENCES models(id), prompt_version TEXT NOT NULL, temperature REAL, max_output_tokens INTEGER, reasoning_effort TEXT, active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)));
CREATE UNIQUE INDEX active_agent_configuration_per_role ON agent_configurations(role_id) WHERE active = 1;
CREATE TABLE review_runs (
  id TEXT PRIMARY KEY, content_item_id TEXT NOT NULL REFERENCES content_items(id), draft_version_id TEXT NOT NULL REFERENCES draft_versions(id),
  status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'partially_completed', 'failed')),
  estimated_cost REAL NOT NULL DEFAULT 0, actual_cost REAL, budget_cap REAL, started_at TEXT, completed_at TEXT,
  review_type TEXT NOT NULL DEFAULT 'editorial' CHECK(review_type IN ('editorial', 'final_draft')),
  execution_mode TEXT NOT NULL DEFAULT 'simulation' CHECK(execution_mode IN ('simulation', 'grounded_test', 'live'))
);
CREATE TABLE agent_reviews (id TEXT PRIMARY KEY, review_run_id TEXT NOT NULL REFERENCES review_runs(id), role_id TEXT NOT NULL REFERENCES agent_roles(id), model_id TEXT REFERENCES models(id), prompt_version TEXT NOT NULL, structured_output TEXT, text_output TEXT, confidence_score REAL, status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'completed', 'partially_structured', 'failed')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE recommendations (id TEXT PRIMARY KEY, agent_review_id TEXT NOT NULL REFERENCES agent_reviews(id), category TEXT NOT NULL, recommendation TEXT NOT NULL, severity TEXT NOT NULL, user_decision TEXT, user_note TEXT, applied_to_version_id TEXT REFERENCES draft_versions(id));
CREATE TABLE model_calls (
  id TEXT PRIMARY KEY, provider TEXT NOT NULL, model TEXT NOT NULL, agent_role TEXT NOT NULL, project_id TEXT REFERENCES projects(id), draft_version_id TEXT REFERENCES draft_versions(id),
  prompt_template_id TEXT, prompt_template_version TEXT, voice_skill_version_id TEXT REFERENCES voice_skill_versions(id),
  input_tokens INTEGER, cached_input_tokens INTEGER, output_tokens INTEGER, reasoning_tokens INTEGER, total_tokens INTEGER,
  estimated_input_cost REAL, estimated_output_cost REAL, estimated_total_cost REAL, actual_billed_cost REAL, currency TEXT NOT NULL DEFAULT 'USD', pricing_record_id TEXT REFERENCES model_pricing(id),
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, ended_at TEXT, latency_ms INTEGER, success INTEGER NOT NULL CHECK(success IN (0, 1)), retry_count INTEGER NOT NULL DEFAULT 0,
  error_category TEXT, escalation_reason TEXT, prior_lower_cost_model_call_id TEXT REFERENCES model_calls(id), budget_cap REAL, projected_cost_at_escalation REAL,
  escalation_materially_improved INTEGER CHECK(escalation_materially_improved IN (0, 1)), provider_request_id TEXT, raw_usage TEXT NOT NULL DEFAULT '{}', user_rating TEXT,
  output_accepted INTEGER CHECK(output_accepted IN (0, 1)), influenced_final_draft INTEGER CHECK(influenced_final_draft IN (0, 1))
);
CREATE TABLE knowledge_documents (id TEXT PRIMARY KEY, title TEXT NOT NULL, source_path TEXT NOT NULL UNIQUE, source_type TEXT NOT NULL, version TEXT NOT NULL, checksum TEXT NOT NULL, status TEXT NOT NULL, metadata TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE knowledge_sections (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES knowledge_documents(id), heading_path TEXT NOT NULL, text TEXT NOT NULL, sequence INTEGER NOT NULL, embedding_reference TEXT, metadata TEXT NOT NULL DEFAULT '{}', source_version TEXT, UNIQUE(document_id, heading_path, sequence));
CREATE VIRTUAL TABLE knowledge_search USING fts5(section_id UNINDEXED, heading_path, text);
CREATE TABLE retrieval_records (id TEXT PRIMARY KEY, model_call_id TEXT NOT NULL REFERENCES model_calls(id), knowledge_section_id TEXT NOT NULL REFERENCES knowledge_sections(id), relevance_score REAL NOT NULL, retrieval_method TEXT NOT NULL, rank INTEGER NOT NULL);
CREATE TABLE publications (id TEXT PRIMARY KEY, content_item_id TEXT NOT NULL REFERENCES content_items(id), draft_version_id TEXT NOT NULL REFERENCES draft_versions(id), channel TEXT NOT NULL, publication_url TEXT, published_at TEXT NOT NULL, final_text TEXT NOT NULL, notes TEXT);
CREATE TABLE performance_snapshots (id TEXT PRIMARY KEY, publication_id TEXT NOT NULL REFERENCES publications(id), captured_at TEXT NOT NULL, impressions INTEGER, reactions INTEGER, comments INTEGER, reposts INTEGER, saves INTEGER, clicks INTEGER, follows INTEGER, other_metrics TEXT NOT NULL DEFAULT '{}');
CREATE TABLE feedback_items (id TEXT PRIMARY KEY, publication_id TEXT NOT NULL REFERENCES publications(id), source TEXT NOT NULL, feedback_type TEXT NOT NULL, author_or_audience_type TEXT, text TEXT NOT NULL, sentiment TEXT, user_interpretation TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE retrospectives (id TEXT PRIMARY KEY, publication_id TEXT NOT NULL REFERENCES publications(id), what_worked TEXT, what_did_not TEXT, unexpected_feedback TEXT, follow_up_ideas TEXT, strategic_value TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE idea_notes (id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, body TEXT NOT NULL, note_type TEXT NOT NULL DEFAULT 'note', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE research_items (id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, mode TEXT NOT NULL CHECK(mode IN ('none', 'provided', 'application')), question TEXT, time_window TEXT, evidence_summary TEXT, interpretation TEXT, execution_mode TEXT NOT NULL DEFAULT 'manual' CHECK(execution_mode IN ('manual', 'application_brief')), tool_name TEXT, estimated_cost REAL NOT NULL DEFAULT 0, actual_cost REAL NOT NULL DEFAULT 0, usage_json TEXT NOT NULL DEFAULT '{}', injection_signals TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE research_sources (id TEXT PRIMARY KEY, research_item_id TEXT NOT NULL REFERENCES research_items(id) ON DELETE CASCADE, title TEXT NOT NULL, source_url TEXT, published_at TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE draft_relationships (parent_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE, child_draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE, relationship_type TEXT NOT NULL CHECK(relationship_type IN ('derived_short')), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (parent_draft_version_id, child_draft_version_id));
CREATE UNIQUE INDEX derived_short_single_parent_unique ON draft_relationships(child_draft_version_id) WHERE relationship_type = 'derived_short';
CREATE TABLE editorial_run_snapshots (
  id TEXT PRIMARY KEY, review_run_id TEXT NOT NULL UNIQUE REFERENCES review_runs(id) ON DELETE CASCADE, generated_draft_version_id TEXT REFERENCES draft_versions(id),
  idea_id TEXT NOT NULL REFERENCES ideas(id), content_item_id TEXT NOT NULL REFERENCES content_items(id), original_capture TEXT NOT NULL, notes_json TEXT NOT NULL, clarification_answers_json TEXT NOT NULL,
  output_shape TEXT, bok_document_id TEXT REFERENCES knowledge_documents(id), bok_version TEXT, bok_checksum TEXT, voice_skill_version_id TEXT REFERENCES voice_skill_versions(id), voice_skill_version TEXT, voice_skill_checksum TEXT,
  prompt_manifest TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE recommendation_dispositions (source_review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE, recommendation_text TEXT NOT NULL, disposition TEXT NOT NULL CHECK(disposition IN ('resolved', 'revised', 'superseded', 'still_open')), note TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (source_review_run_id, recommendation_text));
CREATE TABLE publication_provenance (publication_id TEXT PRIMARY KEY REFERENCES publications(id) ON DELETE CASCADE, editorial_review_run_id TEXT REFERENCES review_runs(id), final_review_run_id TEXT REFERENCES review_runs(id), voice_check_json TEXT NOT NULL, reviewed_draft_version_id TEXT REFERENCES draft_versions(id), recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE escalation_outcomes (model_call_id TEXT PRIMARY KEY REFERENCES model_calls(id) ON DELETE CASCADE, review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE, prior_lower_cost_model_call_id TEXT REFERENCES model_calls(id), prior_review_run_id TEXT REFERENCES review_runs(id), output_accepted INTEGER CHECK(output_accepted IN (0, 1)), influenced_final_draft INTEGER CHECK(influenced_final_draft IN (0, 1)), materially_improved INTEGER CHECK(materially_improved IN (0, 1)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE idea_output_preferences (
  idea_id TEXT PRIMARY KEY REFERENCES ideas(id) ON DELETE CASCADE, long_form_enabled INTEGER NOT NULL DEFAULT 0 CHECK(long_form_enabled IN (0, 1)), long_form_min_words INTEGER NOT NULL DEFAULT 800 CHECK(long_form_min_words BETWEEN 100 AND 10000), long_form_max_words INTEGER NOT NULL DEFAULT 1100 CHECK(long_form_max_words BETWEEN 100 AND 10000), short_form_enabled INTEGER NOT NULL DEFAULT 1 CHECK(short_form_enabled IN (0, 1)), short_form_min_words INTEGER NOT NULL DEFAULT 180 CHECK(short_form_min_words BETWEEN 40 AND 5000), short_form_max_words INTEGER NOT NULL DEFAULT 300 CHECK(short_form_max_words BETWEEN 40 AND 5000), short_form_source TEXT NOT NULL DEFAULT 'standalone' CHECK(short_form_source IN ('standalone', 'derived_from_long')), delivery_hint TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, CHECK(long_form_min_words <= long_form_max_words), CHECK(short_form_min_words <= short_form_max_words), CHECK(long_form_enabled = 1 OR short_form_enabled = 1), CHECK(short_form_enabled = 1 OR short_form_source = 'standalone')
);
CREATE TABLE review_finding_dispositions (id TEXT PRIMARY KEY, review_run_id TEXT NOT NULL REFERENCES review_runs(id) ON DELETE CASCADE, finding_id TEXT NOT NULL, disposition TEXT NOT NULL CHECK(disposition IN ('accepted', 'dismissed', 'revised', 'still_open')), note TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(review_run_id, finding_id));
CREATE TABLE article_draft_approvals (article_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, approved_at TEXT NOT NULL);
CREATE TABLE derived_short_approvals (derived_short_draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, approved_at TEXT NOT NULL);
CREATE TABLE visual_briefs (
  id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  output_format TEXT NOT NULL CHECK(output_format IN ('short', 'article', 'derived_short')), recommendation TEXT NOT NULL CHECK(recommendation IN ('no_visual', 'visual')),
  rationale TEXT NOT NULL, purpose TEXT CHECK(purpose IN ('contrast', 'decision_path', 'sequence', 'lifecycle', 'framework', 'comparison')),
  visual_type TEXT CHECK(visual_type IN ('flow', 'vertical_path', 'contrast', 'decision_fork')), source_draft_text TEXT NOT NULL, reader_contract_json TEXT NOT NULL,
  author_direction TEXT NOT NULL DEFAULT '', claims_json TEXT NOT NULL, labels_json TEXT NOT NULL, caption TEXT NOT NULL, alt_text TEXT NOT NULL,
  placement TEXT CHECK(placement IN ('lead', 'supporting')), status TEXT NOT NULL CHECK(status IN ('recommended', 'approved', 'dismissed', 'rendered')),
  revision_number INTEGER NOT NULL DEFAULT 1 CHECK(revision_number >= 1), visual_version_number INTEGER NOT NULL DEFAULT 1, color_scheme TEXT NOT NULL DEFAULT 'violet', custom_illustration INTEGER NOT NULL DEFAULT 0 CHECK(custom_illustration IN (0, 1)), approved_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE visual_lead_selections (draft_version_id TEXT PRIMARY KEY REFERENCES draft_versions(id) ON DELETE CASCADE, visual_brief_id TEXT NOT NULL UNIQUE REFERENCES visual_briefs(id) ON DELETE CASCADE, selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE visual_companions (
  id TEXT PRIMARY KEY, idea_id TEXT NOT NULL REFERENCES ideas(id) ON DELETE CASCADE, content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE, draft_version_id TEXT NOT NULL REFERENCES draft_versions(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL CHECK(visual_type IN ('flow', 'maturity_path', 'contrast', 'decision_fork', 'custom_image')), color_scheme TEXT NOT NULL DEFAULT 'violet', title TEXT NOT NULL, subtitle TEXT NOT NULL, steps_json TEXT NOT NULL, alt_text TEXT NOT NULL, caption TEXT NOT NULL, file_path TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, visual_brief_id TEXT REFERENCES visual_briefs(id) ON DELETE SET NULL
);
CREATE TABLE initial_drafter_recovery_claims (review_run_id TEXT PRIMARY KEY REFERENCES review_runs(id) ON DELETE CASCADE, claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE custom_visual_attempts (id TEXT PRIMARY KEY, visual_brief_id TEXT NOT NULL REFERENCES visual_briefs(id) ON DELETE CASCADE, provider TEXT NOT NULL, model TEXT NOT NULL, pricing_assumption TEXT NOT NULL, estimated_cost REAL NOT NULL CHECK(estimated_cost >= 0), reserved_cost REAL NOT NULL CHECK(reserved_cost >= 0), actual_cost REAL, status TEXT NOT NULL CHECK(status IN ('dispatching', 'completed', 'failed')), provider_request_id TEXT, latency_ms INTEGER, failure_category TEXT, injection_signals_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, completed_at TEXT);
CREATE INDEX ideas_project_status_idx ON ideas(project_id, status);
CREATE INDEX ideas_status_priority_idx ON ideas(status, priority DESC, updated_at DESC);
CREATE INDEX idea_notes_idea_created_idx ON idea_notes(idea_id, created_at);
CREATE INDEX draft_versions_content_idx ON draft_versions(content_item_id, version_number);
CREATE INDEX review_runs_content_status_idx ON review_runs(content_item_id, status);
CREATE INDEX review_runs_content_type_completed_idx ON review_runs(content_item_id, review_type, completed_at DESC);
CREATE INDEX agent_reviews_run_status_idx ON agent_reviews(review_run_id, status);
CREATE INDEX model_calls_role_started_idx ON model_calls(agent_role, started_at);
CREATE INDEX retrieval_records_model_call_rank_idx ON retrieval_records(model_call_id, rank);
CREATE INDEX knowledge_sections_document_version_idx ON knowledge_sections(document_id, source_version);
CREATE INDEX performance_snapshots_publication_captured_idx ON performance_snapshots(publication_id, captured_at);
CREATE INDEX research_items_idea_created_idx ON research_items(idea_id, created_at DESC);
CREATE INDEX editorial_run_snapshots_idea_created_idx ON editorial_run_snapshots(idea_id, created_at DESC);
CREATE INDEX review_finding_dispositions_run_idx ON review_finding_dispositions(review_run_id, created_at);
CREATE INDEX article_draft_approvals_idea_idx ON article_draft_approvals(idea_id, approved_at DESC);
CREATE INDEX derived_short_approvals_idea_idx ON derived_short_approvals(idea_id, approved_at DESC);
CREATE INDEX visual_briefs_draft_status_idx ON visual_briefs(draft_version_id, status, created_at DESC);
CREATE UNIQUE INDEX visual_briefs_one_active_lead_idx ON visual_briefs(draft_version_id) WHERE placement = 'lead' AND status != 'dismissed';
CREATE INDEX visual_lead_selections_brief_idx ON visual_lead_selections(visual_brief_id);
CREATE INDEX visual_companions_draft_created_idx ON visual_companions(draft_version_id, created_at DESC);
CREATE INDEX visual_companions_brief_idx ON visual_companions(visual_brief_id);
CREATE INDEX custom_visual_attempts_brief_created_idx ON custom_visual_attempts(visual_brief_id, created_at DESC);
CREATE INDEX escalation_outcomes_review_run_idx ON escalation_outcomes(review_run_id);
CREATE TRIGGER visual_briefs_limit_before_insert BEFORE INSERT ON visual_briefs WHEN NEW.status != 'dismissed' AND NEW.placement IS NOT NULL BEGIN
  SELECT CASE WHEN NEW.placement = 'lead' AND EXISTS (SELECT 1 FROM visual_briefs WHERE draft_version_id = NEW.draft_version_id AND placement = 'lead' AND status != 'dismissed') THEN RAISE(ABORT, 'This exact saved output already has a lead visual brief.') END;
  SELECT CASE WHEN NEW.placement = 'supporting' AND (SELECT COUNT(*) FROM visual_briefs WHERE draft_version_id = NEW.draft_version_id AND placement = 'supporting' AND status != 'dismissed') >= 2 THEN RAISE(ABORT, 'This exact saved output already has two supporting visual briefs.') END;
END;
CREATE TRIGGER visual_briefs_limit_before_update BEFORE UPDATE OF draft_version_id, placement, status ON visual_briefs WHEN NEW.status != 'dismissed' AND NEW.placement IS NOT NULL BEGIN
  SELECT CASE WHEN NEW.placement = 'lead' AND EXISTS (SELECT 1 FROM visual_briefs WHERE draft_version_id = NEW.draft_version_id AND placement = 'lead' AND status != 'dismissed' AND id != NEW.id) THEN RAISE(ABORT, 'This exact saved output already has a lead visual brief.') END;
  SELECT CASE WHEN NEW.placement = 'supporting' AND (SELECT COUNT(*) FROM visual_briefs WHERE draft_version_id = NEW.draft_version_id AND placement = 'supporting' AND status != 'dismissed' AND id != NEW.id) >= 2 THEN RAISE(ABORT, 'This exact saved output already has two supporting visual briefs.') END;
END;
