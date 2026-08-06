import { developIdea, getIdea, moveIdea, publishIdea, runLeanBoard, saveEditedDraft, updateIdea } from "@/lean/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(_: Request, { params }: { params: Promise<{ ideaId: string }> }) { return params.then(({ ideaId }) => { const idea = getIdea(ideaId); return idea ? Response.json({ idea }) : Response.json({ error: "Idea not found." }, { status: 404 }); }); }
export async function POST(request: Request, { params }: { params: Promise<{ ideaId: string }> }) {
  try { const { ideaId } = await params; const body = await request.json() as { action?: string; [key: string]: unknown }; if (body.action === "develop") return Response.json({ idea: developIdea(ideaId, body) }); if (body.action === "run_board") return Response.json({ idea: runLeanBoard(ideaId) }); if (body.action === "save_draft") return Response.json({ idea: saveEditedDraft(ideaId, String(body.body ?? "")) }); if (body.action === "publish") return Response.json({ idea: publishIdea(ideaId, body) }); if (body.action === "move_up" || body.action === "move_down") return Response.json({ idea: moveIdea(ideaId, body.action === "move_up" ? "up" : "down") }); return Response.json({ idea: updateIdea(ideaId, body) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Idea could not be updated." }, { status: 400 }); }
}
