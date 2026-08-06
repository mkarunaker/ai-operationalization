import { createIntake, listSavedWorkspaces } from "@/intake/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() { return Response.json({ items: listSavedWorkspaces() }); }

export async function POST(request: Request) {
  try { return Response.json(await createIntake(await request.json()), { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Invalid intake request." }, { status: 400 }); }
}
