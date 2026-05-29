"use client";

import type { Receipt } from "./types";

const KEY = "receipts.v1";

function read(): Receipt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Receipt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Receipt[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch (err) {
    console.error("localStorage write failed", err);
    throw err;
  }
}

export function getAll(): Receipt[] {
  return read().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

export function get(id: string): Receipt | null {
  return read().find((r) => r.id === id) ?? null;
}

export function save(receipt: Receipt): void {
  const items = read();
  const idx = items.findIndex((r) => r.id === receipt.id);
  if (idx >= 0) items[idx] = receipt;
  else items.unshift(receipt);
  write(items);
}

export function update(id: string, patch: Partial<Receipt>): Receipt | null {
  const items = read();
  const idx = items.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  items[idx] = { ...items[idx], ...patch };
  write(items);
  return items[idx];
}

export function remove(id: string): void {
  write(read().filter((r) => r.id !== id));
}
