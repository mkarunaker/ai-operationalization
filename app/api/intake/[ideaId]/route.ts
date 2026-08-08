import { choosePath, completeIntake, getWorkspace, updateBrief } from "@/intake/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/intake/[ideaId]">) {
  const { ideaId } = await context.params; const workspace = getWorkspace(ideaId);
  return workspace ? Response.json(workspace) : Response.json({ error: "Idea not found." }, { status: 404 });
}

export async function POST(request: Request, context: RouteContext<"/api/intake/[ideaId]">) {
  try {
    requireLocalJsonMutation(request);
    const { ideaId } = await context.params; const body = await request.json() as { action?: string; [key: string]: unknown };
    if (body.action === "complete") return Response.json(completeIntake(ideaId, body));
    if (body.action === "update_brief") return Response.json(updateBrief(ideaId, body.brief));
    if (body.action === "choose_path" && (body.path === "review_existing_draft" || body.path === "create_working_draft" || body.path === "review_idea")) return Response.json(choosePath(ideaId, body.path));
    return Response.json({ error: "Unsupported intake action." }, { status: 400 });
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
