"use client";

import type { Receipt } from "./types";

export async function getAll(): Promise<Receipt[]> {
  const res = await fetch("/api/receipts", { cache: "no-store" });
  if (!res.ok) throw new Error(`목록을 불러오지 못했습니다 (${res.status})`);
  return (await res.json()) as Receipt[];
}

export async function get(id: string): Promise<Receipt | null> {
  const res = await fetch(`/api/receipts/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`불러오기 실패 (${res.status})`);
  return (await res.json()) as Receipt;
}

export type CreateInput = {
  imageFile: File | null;
  store: string;
  date: string;
  total: number;
  memo?: string | null;
  rawFields: Receipt["rawFields"];
};

export async function create(input: CreateInput): Promise<Receipt> {
  const form = new FormData();
  if (input.imageFile) form.append("image", input.imageFile);
  form.append("store", input.store);
  form.append("date", input.date ?? "");
  form.append("total", String(input.total ?? 0));
  if (input.memo) form.append("memo", input.memo);
  form.append("rawFields", JSON.stringify(input.rawFields ?? []));

  const res = await fetch("/api/receipts", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `저장 실패 (${res.status})`);
  }
  return (await res.json()) as Receipt;
}

export type UpdateInput = Partial<{
  store: string;
  date: string | null;
  total: number;
  memo: string | null;
}>;

export async function update(id: string, patch: UpdateInput): Promise<Receipt> {
  const res = await fetch(`/api/receipts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `수정 실패 (${res.status})`);
  }
  return (await res.json()) as Receipt;
}

export async function remove(id: string): Promise<void> {
  const res = await fetch(`/api/receipts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 404) {
    throw new Error(`삭제 실패 (${res.status})`);
  }
}
