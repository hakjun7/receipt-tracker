import { NextResponse } from "next/server";
import { extractReceipt, UpstageError } from "@/lib/upstage";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "유효하지 않은 요청입니다." }, { status: 400 });
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "빈 파일입니다." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "파일 크기가 너무 큽니다 (최대 10MB)." },
      { status: 413 },
    );
  }

  try {
    const data = await extractReceipt(file);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof UpstageError) {
      const msg =
        err.status === 401
          ? "Upstage API 키가 유효하지 않습니다."
          : `OCR 분석 실패 (${err.status}): ${err.message.slice(0, 200)}`;
      return NextResponse.json({ error: msg }, { status: err.status });
    }
    console.error("extract route error", err);
    return NextResponse.json(
      { error: "예기치 않은 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
