import { NextResponse } from "next/server";
import {
  deleteReceipt,
  getReceipt,
  updateReceipt,
  type ReceiptRow,
  type UpdateReceiptInput,
} from "@/lib/db";
import { deleteReceiptImage } from "@/lib/blob";
import type { Receipt } from "@/lib/types";

export const runtime = "nodejs";

function toReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    createdAt: row.created_at,
    imageUrl: row.image_url,
    rawFields: Array.isArray(row.raw_fields) ? row.raw_fields : [],
    store: row.store ?? "",
    date: row.date,
    total: Number(row.total) || 0,
    memo: row.memo,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });
  }
  try {
    const row = await getReceipt(id);
    if (!row) return NextResponse.json({ error: "없음" }, { status: 404 });
    return NextResponse.json(toReceipt(row));
  } catch (err) {
    console.error("GET /api/receipts/[id]", err);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "유효하지 않은 JSON" }, { status: 400 });
  }

  const patch: UpdateReceiptInput = {};
  if (typeof body.store === "string") patch.store = body.store.trim();
  if ("date" in body) {
    const d = body.date;
    if (d === null || d === "") patch.date = null;
    else if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) patch.date = d;
    else return NextResponse.json({ error: "날짜 형식 오류 (YYYY-MM-DD)" }, { status: 400 });
  }
  if (typeof body.total === "number") patch.total = Math.round(body.total);
  else if (typeof body.total === "string") {
    const n = Number(body.total.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(n)) patch.total = Math.round(n);
  }
  if ("memo" in body) {
    const m = body.memo;
    if (m === null) patch.memo = null;
    else if (typeof m === "string") patch.memo = m.trim() || null;
  }

  try {
    const row = await updateReceipt(id, patch);
    if (!row) return NextResponse.json({ error: "없음" }, { status: 404 });
    return NextResponse.json(toReceipt(row));
  } catch (err) {
    console.error("PATCH /api/receipts/[id]", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "잘못된 ID" }, { status: 400 });
  }
  try {
    const imageUrl = await deleteReceipt(id);
    await deleteReceiptImage(imageUrl);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/receipts/[id]", err);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
