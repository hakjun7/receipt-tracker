import { getReceipt } from "@/lib/db";
import { getReceiptImageStream } from "@/lib/blob";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return new Response("Bad request", { status: 400 });
  }

  const row = await getReceipt(id);
  if (!row?.image_url) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const result = await getReceiptImageStream(row.image_url);
    if (!result) {
      return new Response("Not found", { status: 404 });
    }
    const ct =
      result.headers.get("content-type") ?? "application/octet-stream";
    const cl = result.headers.get("content-length");
    const headers: Record<string, string> = {
      "Content-Type": ct,
      "Cache-Control": "private, max-age=3600",
    };
    if (cl) headers["Content-Length"] = cl;
    return new Response(result.stream as unknown as BodyInit, { headers });
  } catch (err) {
    console.error("image proxy failed", id, err);
    return new Response("Image fetch failed", { status: 500 });
  }
}
