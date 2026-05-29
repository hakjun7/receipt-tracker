import "server-only";
import { neon } from "@neondatabase/serverless";
import type { ExtractedField } from "./types";

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  throw new Error(
    "DATABASE_URL (or POSTGRES_URL) is not set. Connect Neon on Vercel or run `vercel env pull .env.local`.",
  );
}

export const sql = neon(url);

export type ReceiptRow = {
  id: string;
  store: string;
  date: string | null;
  total: number;
  memo: string | null;
  image_url: string | null;
  raw_fields: ExtractedField[];
  created_at: string;
};

const SELECT_COLS = `
  id,
  store,
  to_char(date, 'YYYY-MM-DD') as date,
  total,
  memo,
  image_url,
  raw_fields,
  to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
`;

export async function listReceipts(): Promise<ReceiptRow[]> {
  const rows = await sql/* sql */ `
    select ${sql.unsafe(SELECT_COLS)}
    from receipts
    order by date desc nulls last, created_at desc
  `;
  return rows as ReceiptRow[];
}

export async function getReceipt(id: string): Promise<ReceiptRow | null> {
  const rows = await sql/* sql */ `
    select ${sql.unsafe(SELECT_COLS)}
    from receipts
    where id = ${id}
    limit 1
  `;
  return (rows[0] as ReceiptRow | undefined) ?? null;
}

export type CreateReceiptInput = {
  store: string;
  date: string | null;
  total: number;
  memo: string | null;
  imageUrl: string | null;
  rawFields: ExtractedField[];
};

export async function createReceipt(input: CreateReceiptInput): Promise<ReceiptRow> {
  const rows = await sql/* sql */ `
    insert into receipts (store, date, total, memo, image_url, raw_fields)
    values (
      ${input.store},
      ${input.date},
      ${input.total},
      ${input.memo},
      ${input.imageUrl},
      ${JSON.stringify(input.rawFields)}::jsonb
    )
    returning ${sql.unsafe(SELECT_COLS)}
  `;
  return rows[0] as ReceiptRow;
}

export type UpdateReceiptInput = Partial<{
  store: string;
  date: string | null;
  total: number;
  memo: string | null;
}>;

export async function updateReceipt(
  id: string,
  patch: UpdateReceiptInput,
): Promise<ReceiptRow | null> {
  const rows = await sql/* sql */ `
    update receipts set
      store = coalesce(${patch.store ?? null}, store),
      date = case when ${patch.date !== undefined} then ${patch.date ?? null}::date else date end,
      total = coalesce(${patch.total ?? null}, total),
      memo = case when ${patch.memo !== undefined} then ${patch.memo ?? null} else memo end
    where id = ${id}
    returning ${sql.unsafe(SELECT_COLS)}
  `;
  return (rows[0] as ReceiptRow | undefined) ?? null;
}

export async function deleteReceipt(id: string): Promise<string | null> {
  const rows = await sql/* sql */ `
    delete from receipts where id = ${id}
    returning image_url
  `;
  return (rows[0] as { image_url: string | null } | undefined)?.image_url ?? null;
}
