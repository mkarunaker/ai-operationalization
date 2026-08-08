import { checkExactDraftVoice } from "@/lean/service";
import { requireLocalJsonMutation, safeRouteError } from "@/security/local-request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireLocalJsonMutation(request);
    const body = (await request.json()) as { ideaId?: unknown; draftVersionId?: unknown; format?: unknown };
    return Response.json(
      checkExactDraftVoice(String(body.ideaId ?? ""), {
        draftVersionId: body.draftVersionId,
        format: body.format,
      }),
    );
  } catch (error) {
    return Response.json({ error: safeRouteError(error) }, { status: 400 });
  }
}
