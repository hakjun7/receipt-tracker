"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Receipt as ReceiptIcon } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ReceiptCard } from "@/components/receipt-card";
import { MonthBarChart, type MonthDatum } from "@/components/month-bar-chart";
import { getAll } from "@/lib/storage";
import { formatKRW, monthKey, monthLabel } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export default function DashboardPage() {
  const [receipts, setReceipts] = useState<Receipt[] | null>(null);

  useEffect(() => {
    setReceipts(getAll());
  }, []);

  const stats = useMemo(() => {
    if (!receipts) return null;
    const now = new Date();
    const thisMonth = monthKey(now);
    const thisMonthReceipts = receipts.filter(
      (r) => monthKey(r.date || r.createdAt) === thisMonth,
    );
    const thisMonthTotal = thisMonthReceipts.reduce((s, r) => s + (r.total || 0), 0);
    const allTotal = receipts.reduce((s, r) => s + (r.total || 0), 0);
    const avg = receipts.length ? allTotal / receipts.length : 0;
    return {
      thisMonthTotal,
      thisMonthCount: thisMonthReceipts.length,
      totalCount: receipts.length,
      avg,
    };
  }, [receipts]);

  const monthData: MonthDatum[] = useMemo(() => {
    if (!receipts) return [];
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.set(monthKey(d), 0);
    }
    for (const r of receipts) {
      const k = monthKey(r.date || r.createdAt);
      if (buckets.has(k)) {
        buckets.set(k, (buckets.get(k) ?? 0) + (r.total || 0));
      }
    }
    return Array.from(buckets.entries()).map(([k, total]) => ({
      month: monthLabel(k),
      total,
    }));
  }, [receipts]);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-8">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="이번 달 지출"
            value={stats ? formatKRW(stats.thisMonthTotal) : null}
            sub={stats ? `${stats.thisMonthCount}건` : null}
          />
          <StatCard
            label="전체 영수증"
            value={stats ? `${stats.totalCount}건` : null}
            sub="누적"
          />
          <StatCard
            label="평균 금액"
            value={stats ? formatKRW(stats.avg) : null}
            sub="영수증당"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">최근 6개월 지출</h2>
          <Card className="p-4">
            {receipts === null ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <MonthBarChart data={monthData} />
            )}
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">최근 영수증</h2>
            {receipts && receipts.length > 0 && (
              <Link href="/upload">
                <Button size="sm" variant="outline">
                  <Plus className="size-4" /> 추가
                </Button>
              </Link>
            )}
          </div>

          {receipts === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {receipts.map((r) => (
                <ReceiptCard key={r.id} receipt={r} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | null;
  sub: string | null;
}) {
  return (
    <Card className="p-5 gap-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">
        {value ?? <Skeleton className="h-7 w-24" />}
      </div>
      <div className="text-xs text-muted-foreground">{sub ?? ""}</div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-12 flex flex-col items-center justify-center gap-3 text-center">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center">
        <ReceiptIcon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <div className="font-medium">아직 영수증이 없습니다</div>
        <div className="text-sm text-muted-foreground">
          영수증을 업로드하면 지출이 자동으로 정리됩니다.
        </div>
      </div>
      <Link href="/upload">
        <Button className="mt-2">
          <Plus className="size-4" /> 첫 영수증 추가
        </Button>
      </Link>
    </Card>
  );
}
