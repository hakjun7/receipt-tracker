#!/usr/bin/env node
// Run with `node scripts/init-db.mjs` (requires DATABASE_URL in .env.local).
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

// Minimal .env.local loader (avoids extra deps).
function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key]) continue;
    const val = raw.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[key] = val;
  }
}

loadEnv();

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  console.error(
    "[init-db] DATABASE_URL not set. Run `vercel env pull .env.local` first, or set it manually.",
  );
  process.exit(1);
}

const sql = neon(url);

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

try {
  for (const stmt of STATEMENTS) {
    await sql.query(stmt);
    console.log("[init-db] OK:", stmt.replace(/\s+/g, " ").slice(0, 80) + "...");
  }
  const [{ count }] = await sql.query("select count(*)::int as count from receipts");
  console.log(`[init-db] receipts row count: ${count}`);
} catch (err) {
  console.error("[init-db] failed:", err);
  process.exit(1);
}
