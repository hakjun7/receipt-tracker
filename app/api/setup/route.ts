import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

const STATEMENTS = [
  `create extension if not exists "pgcrypto"`,
  `create table if not exists receipts (
     id uuid primary key default gen_random_uuid(),
     store text not null default '',
     date date,
     total integer not null default 0,
     memo text,
     image_url text,
     raw_fields jsonb not null default '[]'::jsonb,
     created_at timestamptz not null default now()
   )`,
  `create index if not exists receipts_date_idx on receipts (date desc nulls last)`,
  `create index if not exists receipts_created_at_idx on receipts (created_at desc)`,
];

async function runSetup() {
  const results: Array<{ stmt: string; ok: boolean; error?: string }> = [];
  for (const stmt of STATEMENTS) {
    const short = stmt.replace(/\s+/g, " ").slice(0, 80);
    try {
      await sql.query(stmt);
      results.push({ stmt: short, ok: true });
    } catch (err) {
      results.push({ stmt: short, ok: false, error: String(err) });
    }
  }
  const [{ count }] = (await sql.query(
    "select count(*)::int as count from receipts",
  )) as Array<{ count: number }>;
  return { results, rowCount: count };
}

export async function GET() {
  try {
    const data = await runSetup();
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST() {
  return GET();
}
