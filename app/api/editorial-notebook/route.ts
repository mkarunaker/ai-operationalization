import { getNotebook, saveNotebook } from "@/notebook/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() { return Response.json(getNotebook()); }
export async function POST(request: Request) {
  try {
    requireLocalJsonMutation(request);
    return Response.json(saveNotebook(await request.json()));
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
