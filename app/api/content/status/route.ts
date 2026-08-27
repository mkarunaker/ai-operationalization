import { getContentStatus, publicContentStatus, refreshContent, searchKnowledge, setSelectedKnowledgeDocuments } from "../../../../src/content/loader";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ ...publicContentStatus(getContentStatus()), results: query ? searchKnowledge(query) : [] });
}

export async function POST(request: Request) {
  try {
    requireLocalJsonMutation(request);
    const body = await request.json() as { action?: string; documents?: unknown };
    if (body.action === "select") return Response.json(publicContentStatus(setSelectedKnowledgeDocuments(body.documents)));
    if (body.action === "index") return Response.json(publicContentStatus(refreshContent()));
    throw new Error("Choose a knowledge-library action.");
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
