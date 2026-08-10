import {
  developIdea,
  deleteUnpublishedIdea,
  createVisualCompanion,
  saveLinkedinCompanionDraft,
  getIdea,
  moveIdea,
  publishIdea,
  runFinalDraftReview,
  saveProvidedResearch,
  createApplicationResearchBrief,
  runLeanBoard,
  saveEditedDraft,
  setEscalationOutcome,
  setRecommendationDisposition,
  setReviewFindingDisposition,
  updateIdea,
} from "@/lean/service";
import { runGroundedEditorialRun } from "@/editorial/grounded-run";
import { liveRunPreview, rerunLiveReviewer, retryLiveLinkedinCompanion, runLiveEditorialRun, runLiveProofreadReview } from "@/editorial/live-run";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";
import { getLiveEditorialProgress } from "@/editorial/run-progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  const { ideaId } = await params;
  const search = new URL(request.url).searchParams;
  if (search.get("execution") === "live_preview")
      return Response.json({ preview: liveRunPreview(ideaId) });
    if (search.get("execution") === "live_status")
      return Response.json({ progress: getLiveEditorialProgress(ideaId, search.get("since") ?? undefined) });
    const idea = getIdea(ideaId);
    return idea
      ? Response.json({ idea })
      : Response.json({ error: "Idea not found." }, { status: 404 });
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> },
) {
  try {
    requireLocalJsonMutation(request);
    const { ideaId } = await params;
    const body = (await request.json()) as {
      action?: string;
      [key: string]: unknown;
    };
    if (body.action === "develop")
      return Response.json({ idea: developIdea(ideaId, body) });
    if (body.action === "prepare_editorial_review") {
      developIdea(ideaId, { useBestJudgment: true, answers: [] });
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after preparation.");
      return Response.json({ idea });
    }
    if (body.action === "run_board") {
      return Response.json({ idea: runLeanBoard(ideaId) });
    }
    if (body.action === "run_grounded_board") {
      await runGroundedEditorialRun(ideaId);
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after editorial run.");
      return Response.json({ idea });
    }
    if (body.action === "run_live_board") {
      const budgetCap = Number(body.budgetCap);
      await runLiveEditorialRun(ideaId, { budgetCap });
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after live editorial run.");
      return Response.json({ idea });
    }
    if (body.action === "retry_live_linkedin_companion" || body.action === "refresh_live_linkedin_companion" || body.action === "escalate_live_linkedin_companion") {
      const escalating = body.action === "escalate_live_linkedin_companion";
      if (!escalating && body.tier !== undefined && body.tier !== "low")
        throw new Error("Only the explicit LinkedIn escalation action may use the medium-tier model.");
      if (escalating && body.tier !== undefined && body.tier !== "medium")
        throw new Error("The explicit LinkedIn escalation action uses the medium-tier model.");
      await retryLiveLinkedinCompanion(ideaId, {
        budgetCap: Number(body.budgetCap),
        tier: escalating ? "medium" : "low",
        recoveryKind: escalating ? "escalation" : body.action === "refresh_live_linkedin_companion" ? "refresh" : "retry",
        escalationReason: escalating ? String(body.escalationReason ?? "") : undefined,
      });
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after LinkedIn retry.");
      return Response.json({ idea });
    }
    if (body.action === "rerun_live_reviewer") {
      const role = String(body.role ?? "");
      if (!["strategist", "skeptic", "editor"].includes(role))
        throw new Error("Only Strategist, Skeptic, or Editor can be rerun individually.");
      const tier = String(body.tier ?? "medium");
      if (!["medium", "high"].includes(tier))
        throw new Error("A reviewer rerun must use the medium or high tier.");
      if (tier === "high" && body.confirmHighTier !== true)
        throw new Error("A high-tier reviewer rerun requires explicit confirmation.");
      const budgetCap = Number(body.budgetCap);
      await rerunLiveReviewer(ideaId, role as "strategist" | "skeptic" | "editor", {
        tier: tier as "medium" | "high",
        budgetCap,
        escalationReason: String(body.escalationReason ?? ""),
      });
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after reviewer rerun.");
      return Response.json({ idea });
    }
    if (body.action === "run_final_review") {
      const format =
        body.format === "linkedin_companion"
          ? "linkedin_companion"
          : body.format === "canonical"
            ? "canonical"
            : body.format === "linkedin"
              ? "linkedin"
              : undefined;
      if (!format) throw new Error("A current draft format is required for final review.");
      return Response.json({
        idea: runFinalDraftReview(
          ideaId,
          body.body,
          format,
          String(body.draftVersionId ?? ""),
          { proofreadMode: body.proofreadMode === "live_required" ? "live_required" : "deterministic" },
        ),
      });
    }
    if (body.action === "run_live_proofread") {
      if (["provider", "model", "tier", "pricingAssumption"].some((field) => field in body))
        throw new Error("Proofreader provider, model, tier, and pricing are resolved only by the server route.");
      const format = body.format === "linkedin_companion" ? "linkedin_companion" : body.format === "canonical" ? "canonical" : "linkedin";
      await runLiveProofreadReview(ideaId, { format, draftVersionId: String(body.draftVersionId ?? ""), budgetCap: Number(body.budgetCap) });
      const idea = getIdea(ideaId);
      if (!idea) throw new Error("Idea not found after proofread.");
      return Response.json({ idea });
    }
    if (body.action === "set_recommendation_disposition")
      return Response.json({ idea: setRecommendationDisposition(ideaId, body) });
    if (body.action === "set_review_finding_disposition")
      return Response.json({ idea: setReviewFindingDisposition(ideaId, body) });
    if (body.action === "set_escalation_outcome")
      return Response.json({ idea: setEscalationOutcome(ideaId, body) });
    if (body.action === "save_provided_research")
      return Response.json({ idea: saveProvidedResearch(ideaId, body) });
    if (body.action === "create_application_research_brief")
      return Response.json({ idea: createApplicationResearchBrief(ideaId, body) });
    if (body.action === "save_draft") {
      if (body.format === "linkedin_companion")
        throw new Error("Use the dedicated LinkedIn companion action to save a companion version.");
      return Response.json({
        idea: saveEditedDraft(
          ideaId,
          String(body.body ?? ""),
          body.format === "canonical" ? "canonical" : body.format === "linkedin" ? "linkedin" : undefined,
        ),
      });
    }
    if (
      body.action === "approve_canonical_draft" ||
      body.action === "approve_linkedin_companion"
    )
      throw new Error(
        "This approval action is no longer available. Create the LinkedIn companion from the current article instead.",
      );
    if (body.action === "create_linkedin_companion")
      throw new Error("LinkedIn output is generated with the Editorial Board for a dual-output plan. Run the Board again to create a matched pair.");
    if (body.action === "save_linkedin_companion")
      return Response.json({ idea: saveLinkedinCompanionDraft(ideaId, String(body.body ?? "")) });
    if (body.action === "create_visual_companion") {
      const template = body.template === "contrast" || body.template === "decision_fork" || body.template === "flow" || body.template === "vertical_path"
        ? body.template
        : undefined;
      return Response.json({ idea: createVisualCompanion(ideaId, template) });
    }
    if (body.action === "publish")
      return Response.json({ idea: publishIdea(ideaId, body) });
    if (body.action === "move_up" || body.action === "move_down")
      return Response.json({
        idea: moveIdea(ideaId, body.action === "move_up" ? "up" : "down"),
      });
    if (body.action === "delete_idea") {
      deleteUnpublishedIdea(ideaId);
      return Response.json({ deleted: true });
    }
    return Response.json({ idea: updateIdea(ideaId, body) });
  } catch (error) {
    return Response.json(
      {
        error:
          safeRouteError(error),
      },
      { status: 400 },
    );
  }
}
