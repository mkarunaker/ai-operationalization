import { decideRecommendation, runBoard } from "@/board/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";
export const runtime = "nodejs"; export const dynamic = "force-dynamic";
export async function POST(request: Request, context: RouteContext<"/api/board/[ideaId]">) {
  try {
    requireLocalJsonMutation(request);
    const { ideaId } = await context.params;
    const body = await request.json() as { action?: string; budgetCap?: number; recommendationId?: string; decision?: "accepted" | "partially_accepted" | "rejected"; note?: string };
    if (body.action === "decide" && body.recommendationId && body.decision) {
      decideRecommendation(body.recommendationId, body.decision, body.note);
      return Response.json({ ok: true });
    }
    return Response.json(await runBoard(ideaId, Math.max(0, Number(body.budgetCap) || 0)));
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
