import { createIdea, listIdeas } from "@/lean/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() { return Response.json({ ideas: listIdeas() }); }
export async function POST(request: Request) {
  try {
    requireLocalJsonMutation(request);
    const body = await request.json();
    return Response.json({ idea: createIdea(body) }, { status: 201 });
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
