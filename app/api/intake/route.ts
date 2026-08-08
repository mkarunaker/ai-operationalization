import { createIntake } from "@/intake/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireLocalJsonMutation(request);
    return Response.json(await createIntake(await request.json()), { status: 201 });
  } catch (error) { return Response.json({ error: safeRouteError(error) }, { status: 400 }); }
}
