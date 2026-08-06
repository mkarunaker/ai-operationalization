import { getNotebook, saveNotebook } from "@/notebook/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() { return Response.json(getNotebook()); }
export async function POST(request: Request) {
  try { return Response.json(saveNotebook(await request.json())); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Notebook could not be saved." }, { status: 400 }); }
}
