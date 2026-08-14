import fs from "node:fs";
import { customVisualImageAsset } from "@/lean/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ visualId: string }> },
) {
  const { visualId } = await params;
  const asset = customVisualImageAsset(visualId);
  if (!asset) return Response.json({ error: "Visual image not found." }, { status: 404 });
  try {
    return new Response(fs.readFileSync(asset.path), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${asset.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "Visual image is unavailable." }, { status: 404 });
  }
}
