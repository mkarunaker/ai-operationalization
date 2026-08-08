import crypto from "node:crypto";
import { z } from "zod";
import { MockModelProvider } from "@/ai/mock-provider";
import { createUntrustedContextBlock, TRUSTED_INSTRUCTION_BOUNDARY } from "@/ai/prompt-boundary";
import { getAppConfig } from "@/config/env";
import { openInitializedDatabase } from "@/persistence/database";

const createInput = z.object({ rawNotes: z.string().trim().min(3).max(50_000), existingDraft: z.string().trim().max(80_000).optional().default("") });
const answerInput = z.object({ question: z.string().min(1).max(500), answer: z.string().max(5_000), choice: z.enum(["answered", "skipped", "best_judgment"]) });
const completeInput = z.object({ answers: z.array(answerInput).max(5), useBestJudgment: z.boolean().default(false) });
const briefInput = z.object({
  workingTitle: z.string().max(300).nullable().optional(), centralThesis: z.string().max(4_000).nullable().optional(), intendedAudience: z.string().max(1_000).nullable().optional(), purpose: z.string().max(2_000).nullable().optional(), triggerContext: z.string().max(2_000).nullable().optional(), supportingPoints: z.array(z.string().max(1_000)).max(12), userProvidedEvidence: z.array(z.string().max(1_000)).max(12), claimsRequiringValidation: z.array(z.string().max(1_000)).max(12), possibleCounterargument: z.string().max(2_000).nullable().optional(), desiredTone: z.string().max(1_000).nullable().optional(), intendedPlatform: z.string().max(1_000).nullable().optional(), suggestedLength: z.string().max(500).nullable().optional(), relationshipToPreviousPosts: z.string().max(2_000).nullable().optional(), openQuestions: z.array(z.string().max(1_000)).max(12), systemAssumptions: z.array(z.string().max(1_000)).max(12),
});

export type Brief = z.infer<typeof briefInput> & { id: string; version: number; status: string };
export type IntakeWorkspace = { id: string; rawNotes: string; existingDraft: string; status: string; questions: string[]; answers: Array<{ question: string; answer: string; choice: string }>; brief?: Brief; selectedPath?: string };

const id = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const now = () => new Date().toISOString();

function database() {
  const config = getAppConfig();
  return openInitializedDatabase(config.databasePath);
}

function ensureLocalProject(db: ReturnType<typeof database>) {
  db.prepare("INSERT OR IGNORE INTO users (id, name, email) VALUES ('local-user', 'Local owner', 'local@ai-editorial-board.local')").run();
  db.prepare("INSERT OR IGNORE INTO projects (id, user_id, title, description, status) VALUES ('local-editorial-board', 'local-user', 'AI Editorial Board', 'Local private editorial workspace', 'active')").run();
}

function nextSequence(db: ReturnType<typeof database>, conversationId: string) {
  return (db.prepare("SELECT COALESCE(MAX(sequence), 0) + 1 AS value FROM intake_messages WHERE conversation_id = ?").get(conversationId) as { value: number }).value;
}

function saveMessage(db: ReturnType<typeof database>, conversationId: string, role: string, messageType: string, body: string) {
  db.prepare("INSERT INTO intake_messages (id, conversation_id, role, message_type, body, sequence) VALUES (?, ?, ?, ?, ?, ?)").run(id("message"), conversationId, role, messageType, body, nextSequence(db, conversationId));
}

function focusedQuestions(notes: string): string[] {
  const lower = notes.toLowerCase();
  const candidates = [
    ["What is the one idea or tension you most want the reader to leave with?", /(thesis|point of view|argument|main idea)/],
    ["Who is this primarily for, and what do they already understand about the topic?", /(audience|reader|for leaders|for operators|for founders)/],
    ["What outcome should this piece create: a decision, a conversation, a challenge, or something else?", /(objective|outcome|goal|purpose)/],
    ["What evidence, experience, or example should anchor the argument?", /(evidence|example|experience|data|research)/],
    ["Where will this appear, and what tone or length should it have?", /(linkedin|platform|tone|length|newsletter)/],
  ] as const;
  const unanswered = candidates.filter(([, signal]) => !signal.test(lower)).map(([question]) => question);
  return (unanswered.length ? unanswered : candidates.map(([question]) => question)).slice(0, 5);
}

function inferTitle(notes: string) { return notes.split(/[\n.!?]/).map((line) => line.trim()).find((line) => line.length > 8)?.slice(0, 100) ?? "Untitled editorial idea"; }

function buildBrief(notes: string, answers: Array<{ question: string; answer: string; choice: string }>, bestJudgment: boolean): z.infer<typeof briefInput> {
  const usable = answers.filter((answer) => answer.choice === "answered" && answer.answer.trim());
  const find = (needle: string) => usable.find((answer) => answer.question.toLowerCase().includes(needle))?.answer.trim();
  const summary = notes.replace(/\s+/g, " ").trim();
  return {
    workingTitle: inferTitle(notes),
    centralThesis: find("one idea") ?? summary.slice(0, 500),
    intendedAudience: find("primarily for") ?? (bestJudgment ? "Thoughtful operators and leaders" : null),
    purpose: find("outcome") ?? (bestJudgment ? "Clarify a useful point of view and invite considered discussion." : null),
    triggerContext: summary.slice(0, 700),
    supportingPoints: [], userProvidedEvidence: find("evidence") ? [find("evidence")!] : [], claimsRequiringValidation: [],
    possibleCounterargument: null, desiredTone: find("tone") ?? (bestJudgment ? "Direct, clear, and thoughtful" : null), intendedPlatform: find("appear") ?? null,
    suggestedLength: null, relationshipToPreviousPosts: null, openQuestions: usable.filter((answer) => answer.choice !== "answered").map((answer) => answer.question), systemAssumptions: bestJudgment ? ["The brief uses explicit best judgment where the intake did not supply a preference."] : [],
  };
}

export async function createIntake(input: unknown) {
  const value = createInput.parse(input);
  const db = database();
  try {
    ensureLocalProject(db);
    const ideaId = id("idea"); const conversationId = id("conversation"); const contentId = id("content"); const title = inferTitle(value.rawNotes);
    db.exec("BEGIN IMMEDIATE;");
    try {
      db.prepare("INSERT INTO ideas (id, project_id, title, raw_notes, source, status, created_at, updated_at) VALUES (?, 'local-editorial-board', ?, ?, ?, 'clarifying', ?, ?)").run(ideaId, title, value.rawNotes, value.existingDraft ? "existing_draft" : "idea", now(), now());
      db.prepare("INSERT INTO intake_conversations (id, idea_id, status) VALUES (?, ?, 'clarifying')").run(conversationId, ideaId);
      db.prepare("INSERT INTO content_items (id, project_id, idea_id, content_type, working_title, status) VALUES (?, 'local-editorial-board', ?, 'editorial_post', ?, 'intake')").run(contentId, ideaId, title);
      saveMessage(db, conversationId, "user", "initial_input", value.rawNotes);
      if (value.existingDraft) saveMessage(db, conversationId, "user", "existing_draft", value.existingDraft);
      const boundary = createUntrustedContextBlock([{ source: "user idea intake", text: value.rawNotes }]);
      const modelResponse = await new MockModelProvider().generate({ provider: "mock", model: "mock-editorial-v1", systemPrompt: TRUSTED_INSTRUCTION_BOUNDARY, messages: [{ role: "user", content: boundary.contextBlock }], metadata: { agentRole: "intake_clarification" } });
      db.prepare(`INSERT INTO model_calls (id, provider, model, agent_role, project_id, input_tokens, output_tokens, total_tokens, estimated_input_cost, estimated_output_cost, estimated_total_cost, ended_at, latency_ms, success, provider_request_id, raw_usage) VALUES (?, ?, ?, 'intake_clarification', 'local-editorial-board', ?, ?, ?, 0, 0, 0, ?, ?, 1, ?, ?)`)
        .run(id("model_call"), modelResponse.provider, modelResponse.model, modelResponse.inputTokens ?? null, modelResponse.outputTokens ?? null, modelResponse.totalTokens ?? null, now(), modelResponse.latencyMs ?? null, modelResponse.providerRequestId ?? null, JSON.stringify(modelResponse.rawUsage ?? {}));
      const questions = focusedQuestions(value.rawNotes);
      saveMessage(db, conversationId, "assistant", "clarifying_questions", JSON.stringify({ questions, injectionSignals: boundary.injectionSignals }));
      db.exec("COMMIT;");
      return { id: ideaId, questions };
    } catch (error) { db.exec("ROLLBACK;"); throw error; }
  } finally { db.close(); }
}

export function completeIntake(ideaId: string, input: unknown) {
  const value = completeInput.parse(input); const db = database();
  try {
    const row = db.prepare("SELECT conversation.id AS conversation_id, idea.raw_notes, content.id AS content_id FROM ideas idea JOIN intake_conversations conversation ON conversation.idea_id = idea.id JOIN content_items content ON content.idea_id = idea.id WHERE idea.id = ?").get(ideaId) as { conversation_id: string; raw_notes: string; content_id: string } | undefined;
    if (!row) throw new Error("Idea not found.");
    const brief = buildBrief(row.raw_notes, value.answers, value.useBestJudgment);
    db.exec("BEGIN IMMEDIATE;");
    try {
      for (const answer of value.answers) saveMessage(db, row.conversation_id, "user", answer.choice, JSON.stringify(answer));
      const prior = db.prepare("SELECT COALESCE(MAX(version), 0) AS value FROM content_intent_briefs WHERE content_item_id = ?").get(row.content_id) as { value: number };
      const version = prior.value + 1;
      const briefId = id("brief");
      db.prepare(`INSERT INTO content_intent_briefs (id, content_item_id, working_title, central_thesis, intended_audience, purpose, trigger_context, supporting_points, user_provided_evidence, claims_requiring_validation, possible_counterargument, desired_tone, intended_platform, suggested_length, relationship_to_previous_posts, open_questions, system_assumptions, version, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'editable')`).run(briefId, row.content_id, brief.workingTitle ?? null, brief.centralThesis ?? null, brief.intendedAudience ?? null, brief.purpose ?? null, brief.triggerContext ?? null, JSON.stringify(brief.supportingPoints), JSON.stringify(brief.userProvidedEvidence), JSON.stringify(brief.claimsRequiringValidation), brief.possibleCounterargument ?? null, brief.desiredTone ?? null, brief.intendedPlatform ?? null, brief.suggestedLength ?? null, brief.relationshipToPreviousPosts ?? null, JSON.stringify(brief.openQuestions), JSON.stringify(brief.systemAssumptions), version);
      db.prepare("UPDATE ideas SET status = 'brief_ready', updated_at = ? WHERE id = ?").run(now(), ideaId); db.prepare("UPDATE intake_conversations SET status = 'completed', updated_at = ? WHERE id = ?").run(now(), row.conversation_id); db.prepare("UPDATE content_items SET status = 'brief_ready', updated_at = ? WHERE id = ?").run(now(), row.content_id);
      db.exec("COMMIT;"); return getWorkspace(ideaId)!;
    } catch (error) { db.exec("ROLLBACK;"); throw error; }
  } finally { db.close(); }
}

export function updateBrief(ideaId: string, input: unknown) {
  const value = briefInput.parse(input); const db = database();
  try {
    const row = db.prepare("SELECT content.id AS content_id FROM ideas idea JOIN content_items content ON content.idea_id = idea.id WHERE idea.id = ?").get(ideaId) as { content_id: string } | undefined; if (!row) throw new Error("Idea not found.");
    const prior = db.prepare("SELECT COALESCE(MAX(version), 0) AS value FROM content_intent_briefs WHERE content_item_id = ?").get(row.content_id) as { value: number }; const version = prior.value + 1;
    db.prepare(`INSERT INTO content_intent_briefs (id, content_item_id, working_title, central_thesis, intended_audience, purpose, trigger_context, supporting_points, user_provided_evidence, claims_requiring_validation, possible_counterargument, desired_tone, intended_platform, suggested_length, relationship_to_previous_posts, open_questions, system_assumptions, version, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'editable')`).run(id("brief"), row.content_id, value.workingTitle ?? null, value.centralThesis ?? null, value.intendedAudience ?? null, value.purpose ?? null, value.triggerContext ?? null, JSON.stringify(value.supportingPoints), JSON.stringify(value.userProvidedEvidence), JSON.stringify(value.claimsRequiringValidation), value.possibleCounterargument ?? null, value.desiredTone ?? null, value.intendedPlatform ?? null, value.suggestedLength ?? null, value.relationshipToPreviousPosts ?? null, JSON.stringify(value.openQuestions), JSON.stringify(value.systemAssumptions), version);
    return getWorkspace(ideaId)!;
  } finally { db.close(); }
}

export function choosePath(ideaId: string, selectedPath: "review_existing_draft" | "create_working_draft" | "review_idea") {
  const db = database();
  try {
    const row = db.prepare("SELECT content.id AS content_id, conversation.id AS conversation_id, idea.raw_notes FROM ideas idea JOIN content_items content ON content.idea_id = idea.id JOIN intake_conversations conversation ON conversation.idea_id = idea.id WHERE idea.id = ?").get(ideaId) as { content_id: string; conversation_id: string; raw_notes: string } | undefined; if (!row) throw new Error("Idea not found.");
    const draft = db.prepare("SELECT body FROM intake_messages WHERE conversation_id = ? AND message_type = 'existing_draft' ORDER BY sequence DESC LIMIT 1").get(row.conversation_id) as { body: string } | undefined;
    if (selectedPath === "review_existing_draft" && !draft) throw new Error("Add an existing draft during intake before choosing draft review.");
    db.exec("BEGIN IMMEDIATE;"); try {
      if (selectedPath === "review_existing_draft" && draft) db.prepare("INSERT OR IGNORE INTO draft_versions (id, content_item_id, version_number, body, created_by, change_summary) VALUES (?, ?, 1, ?, 'user', 'Original draft preserved exactly as submitted.')").run(id("draft"), row.content_id, draft.body);
      db.prepare("UPDATE ideas SET status = ?, updated_at = ? WHERE id = ?").run(selectedPath, now(), ideaId); db.prepare("UPDATE content_items SET status = ?, updated_at = ? WHERE id = ?").run(selectedPath, now(), row.content_id); saveMessage(db, row.conversation_id, "user", "workflow_choice", selectedPath); db.exec("COMMIT;"); return getWorkspace(ideaId)!;
    } catch (error) { db.exec("ROLLBACK;"); throw error; }
  } finally { db.close(); }
}

export function getWorkspace(ideaId: string): IntakeWorkspace | undefined {
  const db = database();
  try {
    const idea = db.prepare("SELECT id, raw_notes, status FROM ideas WHERE id = ?").get(ideaId) as { id: string; raw_notes: string; status: string } | undefined; if (!idea) return undefined;
    const conversation = db.prepare("SELECT id FROM intake_conversations WHERE idea_id = ?").get(ideaId) as { id: string }; const messages = db.prepare("SELECT message_type, body FROM intake_messages WHERE conversation_id = ? ORDER BY sequence").all(conversation.id) as Array<{ message_type: string; body: string }>;
    const content = db.prepare("SELECT id FROM content_items WHERE idea_id = ?").get(ideaId) as { id: string }; const row = db.prepare("SELECT * FROM content_intent_briefs WHERE content_item_id = ? ORDER BY version DESC LIMIT 1").get(content.id) as Record<string, unknown> | undefined;
    const questionsMessage = messages.find((message) => message.message_type === "clarifying_questions"); const questions = questionsMessage ? (JSON.parse(questionsMessage.body) as { questions: string[] }).questions : [];
    const answers = messages.filter((message) => ["answered", "skipped", "best_judgment"].includes(message.message_type)).map((message) => JSON.parse(message.body) as { question: string; answer: string; choice: string });
    const existingDraft = messages.find((message) => message.message_type === "existing_draft")?.body ?? "";
    const brief = row ? { id: String(row.id), version: Number(row.version), status: String(row.status), workingTitle: row.working_title as string | null, centralThesis: row.central_thesis as string | null, intendedAudience: row.intended_audience as string | null, purpose: row.purpose as string | null, triggerContext: row.trigger_context as string | null, supportingPoints: JSON.parse(String(row.supporting_points)), userProvidedEvidence: JSON.parse(String(row.user_provided_evidence)), claimsRequiringValidation: JSON.parse(String(row.claims_requiring_validation)), possibleCounterargument: row.possible_counterargument as string | null, desiredTone: row.desired_tone as string | null, intendedPlatform: row.intended_platform as string | null, suggestedLength: row.suggested_length as string | null, relationshipToPreviousPosts: row.relationship_to_previous_posts as string | null, openQuestions: JSON.parse(String(row.open_questions)), systemAssumptions: JSON.parse(String(row.system_assumptions)) } satisfies Brief : undefined;
    return { id: idea.id, rawNotes: idea.raw_notes, existingDraft, status: idea.status, questions, answers, brief, selectedPath: messages.find((message) => message.message_type === "workflow_choice")?.body };
  } finally { db.close(); }
}
