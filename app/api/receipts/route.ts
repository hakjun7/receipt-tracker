import { NextResponse } from "next/server";
import { createReceipt, listReceipts, type ReceiptRow } from "@/lib/db";
import { uploadReceiptImage } from "@/lib/blob";
import type { ExtractedField, Receipt } from "@/lib/types";

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

function errMessage(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`.slice(0, 400);
  return String(err).slice(0, 400);
}

export async function GET() {
  try {
    const rows = await listReceipts();
    return NextResponse.json(rows.map(toReceipt));
  } catch (err) {
    console.error("GET /api/receipts", err);
    return NextResponse.json(
      { error: "목록 조회 실패", detail: errMessage(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "유효하지 않은 요청입니다." }, { status: 400 });
  }

  const store = String(form.get("store") ?? "").trim();
  const dateValue = String(form.get("date") ?? "").trim();
  const totalRaw = String(form.get("total") ?? "0");
  const total = Number(totalRaw.replace(/[^\d.-]/g, "")) || 0;
  const memoValue = String(form.get("memo") ?? "").trim();
  const memo = memoValue.length > 0 ? memoValue : null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue : null;

  let rawFields: ExtractedField[] = [];
  const rawRaw = form.get("rawFields");
  if (typeof rawRaw === "string" && rawRaw.length > 0) {
    try {
      const parsed = JSON.parse(rawRaw);
      if (Array.isArray(parsed)) rawFields = parsed as ExtractedField[];
    } catch {
      // ignore — store as empty
    }
  }

  let imageUrl: string | null = null;
  const image = form.get("image");
  if (image instanceof File && image.size > 0) {
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "이미지가 너무 큽니다 (최대 10MB)." }, { status: 413 });
    }
    try {
      imageUrl = await uploadReceiptImage(image);
    } catch (err) {
      console.error("blob upload failed", err);
      return NextResponse.json(
        { error: "이미지 업로드 실패", detail: errMessage(err) },
        { status: 500 },
      );
    }
  }

  try {
    const row = await createReceipt({ store, date, total, memo, imageUrl, rawFields });
    return NextResponse.json(toReceipt(row), { status: 201 });
  } catch (err) {
    console.error("POST /api/receipts", err);
    return NextResponse.json(
      { error: "저장 실패", detail: errMessage(err) },
      { status: 500 },
    );
  }
}
