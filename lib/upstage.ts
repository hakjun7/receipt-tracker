import "server-only";
import type { ExtractResponse } from "./types";

const ENDPOINT = "https://api.upstage.ai/v1/information-extraction";
const MODEL = "information-extract";

const RECEIPT_SCHEMA = {
  name: "receipt",
  schema: {
    type: "object",
    properties: {
      vendor_name: { type: "string", description: "가게/매장 이름" },
      transaction_date: {
        type: "string",
        description: "거래 날짜 YYYY-MM-DD 형식",
      },
      total_amount: {
        type: "string",
        description: "총 결제 금액 (숫자만, 콤마/통화기호 제외)",
      },
      currency: { type: "string", description: "통화 코드 (KRW/USD 등)" },
      items: {
        type: "array",
        description: "구매 항목 목록",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "상품명" },
            quantity: { type: "string", description: "수량" },
            price: { type: "string", description: "단가 또는 소계 (숫자만)" },
          },
        },
      },
    },
    required: ["vendor_name", "total_amount"],
  },
};

export async function extractReceipt(file: File): Promise<ExtractResponse> {
  const apiKey = process.env.UPSTAGE_API_KEY;
  if (!apiKey) {
    throw new UpstageError(500, "UPSTAGE_API_KEY is not configured on the server.");
  }

  const buf = await file.arrayBuffer();
  const base64 = Buffer.from(buf).toString("base64");
  const mime = file.type || "image/png";
  const dataUrl = `data:${mime};base64,${base64}`;

  const body = {
    model: MODEL,
    messages: [
      {
        role: "user",
        content: [{ type: "image_url", image_url: { url: dataUrl } }],
      },
    ],
    response_format: { type: "json_schema", json_schema: RECEIPT_SCHEMA },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstageError(res.status, text || res.statusText);
  }
  return (await res.json()) as ExtractResponse;
}

export class UpstageError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "UpstageError";
  }
}
