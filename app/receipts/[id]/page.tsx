"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Save, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { get, update, remove } from "@/lib/storage";
import { formatKRW, formatDateLong } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined);
  const [showRaw, setShowRaw] = useState(false);
  const [form, setForm] = useState({ store: "", date: "", total: "", memo: "" });

  useEffect(() => {
    const r = get(id);
    setReceipt(r);
    if (r) {
      setForm({
        store: r.store,
        date: r.date,
        total: String(r.total),
        memo: r.memo ?? "",
      });
    }
  }, [id]);

  function handleSave() {
    if (!receipt) return;
    const total = Number(form.total.replace(/[^\d.-]/g, "")) || 0;
    const updated = update(receipt.id, {
      store: form.store.trim(),
      date: form.date,
      total,
      memo: form.memo.trim() || undefined,
    });
    if (updated) {
      setReceipt(updated);
      toast.success("저장되었습니다.");
    }
  }

  function handleDelete() {
    if (!receipt) return;
    if (!confirm("이 영수증을 삭제할까요?")) return;
    remove(receipt.id);
    toast.success("삭제되었습니다.");
    router.push("/");
  }

  if (receipt === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (receipt === null) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 sm:px-6 py-12 text-center space-y-4">
          <h1 className="text-xl font-semibold">영수증을 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">
            삭제되었거나 잘못된 링크일 수 있습니다.
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="size-4" /> 대시보드로
            </Button>
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" /> 목록
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="size-4" /> 삭제
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="size-4" /> 저장
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-0 overflow-hidden">
            {receipt.imageDataUrl ? (
              <Dialog>
                <DialogTrigger
                  className="block w-full bg-muted cursor-zoom-in"
                  aria-label="이미지 확대"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receipt.imageDataUrl}
                    alt={receipt.store || "영수증"}
                    className="w-full max-h-[600px] object-contain"
                  />
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogTitle className="sr-only">영수증 이미지</DialogTitle>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receipt.imageDataUrl}
                    alt={receipt.store || "영수증"}
                    className="w-full max-h-[80vh] object-contain"
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                미리보기 없음
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-5">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">총 금액</div>
              <div className="text-3xl font-semibold tabular-nums">
                {formatKRW(Number(form.total) || 0)}
              </div>
              <div className="text-xs text-muted-foreground">
                추가일: {formatDateLong(receipt.createdAt)}
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="store">가게</Label>
                <Input
                  id="store"
                  value={form.store}
                  onChange={(e) => setForm({ ...form, store: e.target.value })}
                  placeholder="예: 스타벅스 오리역점"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="total">금액 (KRW)</Label>
                <Input
                  id="total"
                  inputMode="numeric"
                  value={form.total}
                  onChange={(e) => setForm({ ...form, total: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memo">메모</Label>
                <Textarea
                  id="memo"
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  placeholder="(선택) 메모를 남겨보세요"
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <span>원본 추출 데이터 ({receipt.rawFields.length}개 필드)</span>
            <ChevronDown
              className={`size-4 transition ${showRaw ? "rotate-180" : ""}`}
            />
          </button>
          {showRaw && (
            <div className="mt-4 space-y-2">
              {receipt.rawFields.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  추출된 필드가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {receipt.rawFields.map((f, i) => (
                    <div
                      key={i}
                      className="rounded-md border border-border p-3 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-muted-foreground truncate">
                          {f.key}
                        </span>
                        {typeof f.confidence === "number" && (
                          <Badge variant="secondary" className="text-[10px]">
                            {(f.confidence * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                      <div className="break-words">{f.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </>
  );
}
