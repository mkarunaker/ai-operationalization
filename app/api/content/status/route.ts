import { getContentStatus, searchKnowledge } from "../../../../src/content/loader";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ ...getContentStatus(), results: query ? searchKnowledge(query) : [] });
}
