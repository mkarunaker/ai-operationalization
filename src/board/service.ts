import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { MockModelProvider } from "@/ai/mock-provider";
import { createUntrustedContextBlock, TRUSTED_INSTRUCTION_BOUNDARY } from "@/ai/prompt-boundary";
import { commonReviewOutputSchema } from "@/ai/structured-output";
import { getAppConfig } from "@/config/env";
import type { AgentRole } from "@/domain/roles";
import { openInitializedDatabase } from "@/persistence/database";
import { getContentStatus, searchKnowledge } from "@/content/loader";

const identifier = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;
const timestamp = () => new Date().toISOString();
const promptPath = (role: string) => path.resolve(process.cwd(), `prompts/roles/${role === "initial_drafter" ? "initial-drafter" : role}.md`);

function db() { return openInitializedDatabase(getAppConfig().databasePath); }
function seedRole(database: ReturnType<typeof db>, role: AgentRole) { const file = promptPath(role); const prompt = fs.readFileSync(/* turbopackIgnore: true */ file, "utf8"); database.prepare("INSERT OR IGNORE INTO agent_roles (id, name, description, prompt_path, prompt_version, prompt_checksum) VALUES (?, ?, ?, ?, '1', ?)").run(`role_${role}`, role, role, file, crypto.createHash("sha256").update(prompt).digest("hex")); }

export type BoardResult = { runId: string; status: string; estimatedCost: number; actualCost: number; reviews: Array<{ id: string; role: string; status: string; summary: string; confidence: number; recommendations: Array<{ id: string; text: string; decision?: string }> }>; synthesis?: { summary: string; disagreements: string[] }; context: Array<{ headingPath: string; sourceLocation: string; text: string }> };

export async function runBoard(ideaId: string, budgetCap = 0): Promise<BoardResult> {
  const database = db();
  try {
    const item = database.prepare("SELECT idea.id, idea.raw_notes, idea.status AS path, content.id AS content_id, brief.central_thesis FROM ideas idea JOIN content_items content ON content.idea_id = idea.id LEFT JOIN content_intent_briefs brief ON brief.content_item_id = content.id WHERE idea.id = ? ORDER BY brief.version DESC LIMIT 1").get(ideaId) as { id: string; raw_notes: string; path: string; content_id: string; central_thesis: string | null } | undefined;
    if (!item || !["review_existing_draft", "create_working_draft", "review_idea"].includes(item.path)) throw new Error("Complete the brief and select a workflow path before running the board.");
    const sourceStatus = getContentStatus();
    const existing = database.prepare("SELECT id, body FROM draft_versions WHERE content_item_id = ? ORDER BY version_number DESC LIMIT 1").get(item.content_id) as { id: string; body: string } | undefined;
    let draft = existing;
    if (item.path === "create_working_draft") {
      if (sourceStatus.voiceSkill.status !== "ready") throw new Error("Working drafts require a valid external kk-spoken-voice skill.");
      const body = `Working draft (local mock)\n\n${item.central_thesis ?? item.raw_notes}\n\nThis is a starting draft. It requires editorial review and factual validation.`;
      const draftId = identifier("draft"); database.prepare("INSERT INTO draft_versions (id, content_item_id, version_number, body, created_by, change_summary) VALUES (?, ?, COALESCE((SELECT MAX(version_number) + 1 FROM draft_versions WHERE content_item_id = ?), 1), ?, 'initial_drafter', 'Mock working draft created from the Content Intent Brief.')").run(draftId, item.content_id, item.content_id, body); draft = { id: draftId, body };
    }
    const snapshot = draft ?? (() => { const draftId = identifier("snapshot"); database.prepare("INSERT INTO draft_versions (id, content_item_id, version_number, body, created_by, change_summary) VALUES (?, ?, COALESCE((SELECT MAX(version_number) + 1 FROM draft_versions WHERE content_item_id = ?), 1), ?, 'idea_review_snapshot', 'Internal non-prose snapshot for pre-draft idea review.')").run(draftId, item.content_id, item.content_id, item.raw_notes); return { id: draftId, body: item.raw_notes }; })();
    const roles: AgentRole[] = item.path === "review_idea" ? ["strategist", "skeptic"] : ["strategist", "skeptic", "editor"];
    for (const role of [...roles, "synthesizer" as const]) seedRole(database, role);
    const runId = identifier("review_run"); database.prepare("INSERT INTO review_runs (id, content_item_id, draft_version_id, status, estimated_cost, budget_cap, started_at) VALUES (?, ?, ?, 'running', 0, ?, ?)").run(runId, item.content_id, snapshot.id, budgetCap, timestamp());
    const context = searchKnowledge(`${item.central_thesis ?? ""} ${item.raw_notes}`.slice(0, 500), 5).map(({ headingPath, sourceLocation, text }) => ({ headingPath, sourceLocation, text }));
    const provider = new MockModelProvider(); const reviewOutput: BoardResult["reviews"] = [];
    for (const role of roles) {
      try {
      const boundary = createUntrustedContextBlock([{ source: "user idea", text: item.raw_notes }, { source: "draft or idea snapshot", text: snapshot.body }, ...context.map((section) => ({ source: `${section.headingPath} (${section.sourceLocation})`, text: section.text }))]);
      let response = await provider.generate({ provider: "mock", model: "mock-editorial-v1", systemPrompt: `${TRUSTED_INSTRUCTION_BOUNDARY}\n\n${fs.readFileSync(/* turbopackIgnore: true */ promptPath(role), "utf8")}`, messages: [{ role: "user", content: boundary.contextBlock }], responseFormat: { type: "json_schema" }, metadata: { agentRole: role } });
      let parsedResult = commonReviewOutputSchema.safeParse(response.structuredOutput); let repairCount = 0;
      if (!parsedResult.success) { repairCount = 1; response = await provider.generate({ provider: "mock", model: "mock-editorial-v1", systemPrompt: "Repair the response into the required structured editorial-review schema. Do not change the supplied evidence.", messages: [{ role: "user", content: response.text }], responseFormat: { type: "json_schema" }, metadata: { agentRole: role } }); parsedResult = commonReviewOutputSchema.safeParse(response.structuredOutput); }
      if (!parsedResult.success) throw new Error("Structured output remained invalid after one repair attempt.");
      const parsed = parsedResult.data; const callId = identifier("model_call");
      database.prepare("INSERT INTO model_calls (id, provider, model, agent_role, project_id, draft_version_id, input_tokens, output_tokens, total_tokens, estimated_input_cost, estimated_output_cost, estimated_total_cost, ended_at, latency_ms, success, retry_count, provider_request_id, raw_usage) VALUES (?, ?, ?, ?, 'local-editorial-board', ?, ?, ?, ?, 0, 0, 0, ?, ?, 1, ?, ?, ?)").run(callId, response.provider, response.model, role, snapshot.id, response.inputTokens ?? null, response.outputTokens ?? null, response.totalTokens ?? null, timestamp(), response.latencyMs ?? null, repairCount, response.providerRequestId ?? null, JSON.stringify({ ...response.rawUsage, injectionSignals: boundary.injectionSignals }));
      for (const section of context) { const found = database.prepare("SELECT section.id FROM knowledge_sections section JOIN knowledge_documents document ON document.id = section.document_id WHERE section.heading_path = ? AND json_extract(section.metadata, '$.sourceLocation') = ? LIMIT 1").get(section.headingPath, section.sourceLocation) as { id: string } | undefined; if (found) database.prepare("INSERT INTO retrieval_records (id, model_call_id, knowledge_section_id, relevance_score, retrieval_method, rank) VALUES (?, ?, ?, 0, 'fts5', ?)").run(identifier("retrieval"), callId, found.id, context.indexOf(section) + 1); }
      const reviewId = identifier("review"); database.prepare("INSERT INTO agent_reviews (id, review_run_id, role_id, prompt_version, structured_output, text_output, confidence_score, status) VALUES (?, ?, ?, '1', ?, ?, ?, 'completed')").run(reviewId, runId, `role_${role}`, JSON.stringify(parsed), response.text, parsed.confidence.score);
      const recommendations = parsed.top_recommendations.map((text) => { const recommendationId = identifier("recommendation"); database.prepare("INSERT INTO recommendations (id, agent_review_id, category, recommendation, severity) VALUES (?, ?, 'editorial', ?, 'medium')").run(recommendationId, reviewId, text); return { id: recommendationId, text }; });
      reviewOutput.push({ id: reviewId, role, status: "completed", summary: parsed.summary, confidence: parsed.confidence.score, recommendations });
      } catch (error) {
        const reviewId = identifier("review"); const message = error instanceof Error ? error.message : "Reviewer failed.";
        database.prepare("INSERT INTO agent_reviews (id, review_run_id, role_id, prompt_version, text_output, status) VALUES (?, ?, ?, '1', ?, 'failed')").run(reviewId, runId, `role_${role}`, message);
        reviewOutput.push({ id: reviewId, role, status: "failed", summary: message, confidence: 0, recommendations: [] });
      }
    }
    const synthesisInput = reviewOutput.map((review) => ({
      role: review.role,
      summary: review.summary,
      recommendations: review.recommendations.map((recommendation) => recommendation.text),
    }));
    const synthesisResponse = await provider.generate({ provider: "mock", model: "mock-editorial-v1", systemPrompt: fs.readFileSync(/* turbopackIgnore: true */ promptPath("synthesizer"), "utf8"), messages: [{ role: "user", content: JSON.stringify(synthesisInput) }], responseFormat: { type: "json_schema" }, metadata: { agentRole: "synthesizer" } });
    const synthesisOutput = commonReviewOutputSchema.parse(synthesisResponse.structuredOutput); const synthesisCallId = identifier("model_call");
    database.prepare("INSERT INTO model_calls (id, provider, model, agent_role, project_id, draft_version_id, input_tokens, output_tokens, total_tokens, estimated_input_cost, estimated_output_cost, estimated_total_cost, ended_at, latency_ms, success, provider_request_id, raw_usage) VALUES (?, ?, ?, 'synthesizer', 'local-editorial-board', ?, ?, ?, ?, 0, 0, 0, ?, ?, 1, ?, ?)").run(synthesisCallId, synthesisResponse.provider, synthesisResponse.model, snapshot.id, synthesisResponse.inputTokens ?? null, synthesisResponse.outputTokens ?? null, synthesisResponse.totalTokens ?? null, timestamp(), synthesisResponse.latencyMs ?? null, synthesisResponse.providerRequestId ?? null, JSON.stringify(synthesisResponse.rawUsage ?? {}));
    database.prepare("INSERT INTO agent_reviews (id, review_run_id, role_id, prompt_version, structured_output, text_output, confidence_score, status) VALUES (?, ?, 'role_synthesizer', '1', ?, ?, ?, 'completed')").run(identifier("review"), runId, JSON.stringify(synthesisOutput), synthesisResponse.text, synthesisOutput.confidence.score);
    const synthesis = { summary: synthesisOutput.summary, disagreements: ["No material disagreement was generated by the deterministic mock provider."] };
    const status = reviewOutput.some((review) => review.status === "failed") ? "partially_completed" : "completed";
    database.prepare("UPDATE review_runs SET status = ?, actual_cost = 0, completed_at = ? WHERE id = ?").run(status, timestamp(), runId);
    return { runId, status, estimatedCost: 0, actualCost: 0, reviews: reviewOutput, synthesis, context };
  } finally { database.close(); }
}

export function decideRecommendation(recommendationId: string, decision: "accepted" | "partially_accepted" | "rejected", note = "") { const database = db(); try { database.prepare("UPDATE recommendations SET user_decision = ?, user_note = ? WHERE id = ?").run(decision, note, recommendationId); } finally { database.close(); } }
