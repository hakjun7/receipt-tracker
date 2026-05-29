const krw = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const krwCompact = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateLong = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const dateShort = new Intl.DateTimeFormat("ko-KR", {
  month: "short",
  day: "numeric",
});

export function formatKRW(value: number): string {
  if (!Number.isFinite(value)) return "₩0";
  return krw.format(Math.round(value));
}

export function formatKRWCompact(value: number): string {
  if (!Number.isFinite(value)) return "₩0";
  return krwCompact.format(Math.round(value));
}

export function formatDateLong(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return dateLong.format(d);
}

export function formatDateShort(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return dateShort.format(d);
}

export function monthKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}.${m}`;
}
