import { checkHumanVoice } from "@/voice/final-check";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try { const body = await request.json() as { text?: unknown }; return Response.json(checkHumanVoice(body.text)); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Draft could not be checked." }, { status: 400 }); }
}
