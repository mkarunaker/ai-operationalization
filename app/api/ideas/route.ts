import { createIdea, createTheme, listIdeas, listThemes } from "@/lean/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() { return Response.json({ ideas: listIdeas(), themes: listThemes() }); }
export async function POST(request: Request) {
  try { const body = await request.json() as { action?: string; name?: string }; if (body.action === "create_theme") return Response.json({ theme: createTheme(body.name ?? "") }, { status: 201 }); return Response.json({ idea: createIdea(body) }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid idea request." }, { status: 400 }); }
}
