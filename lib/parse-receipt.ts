import type { ExtractedField, ExtractResponse } from "./types";

type ExtractedReceipt = {
  vendor_name?: string;
  transaction_date?: string;
  total_amount?: string;
  currency?: string;
  items?: Array<{ name?: string; quantity?: string; price?: string }>;
  [key: string]: unknown;
};

export type ParsedReceipt = {
  store: string;
  date: string;
  total: number;
  rawFields: ExtractedField[];
};

function parseAmount(value: string | undefined): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.-]/g, "");
  if (!cleaned) return 0;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function parseDate(value: string | undefined): string {
  if (!value) return "";
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString().slice(0, 10);
  }
  const m = value.match(/(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    if (!Number.isNaN(new Date(iso).getTime())) return iso;
  }
  return "";
}

function flatten(value: unknown, prefix = ""): ExtractedField[] {
  if (value === null || value === undefined) return [];
  if (typeof value !== "object") {
    return [
      {
        key: prefix || "value",
        type: typeof value,
        value: String(value),
        confidence: 1,
      },
    ];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => flatten(item, `${prefix}[${i}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  );
}

export function parseReceipt(resp: ExtractResponse): ParsedReceipt {
  const content = resp.choices?.[0]?.message?.content;
  if (!content) {
    return { store: "", date: "", total: 0, rawFields: [] };
  }
  let obj: ExtractedReceipt;
  try {
    obj = JSON.parse(content) as ExtractedReceipt;
  } catch {
    return { store: "", date: "", total: 0, rawFields: [] };
  }

  return {
    store: (obj.vendor_name ?? "").trim(),
    date: parseDate(obj.transaction_date),
    total: parseAmount(obj.total_amount),
    rawFields: flatten(obj),
  };
}
