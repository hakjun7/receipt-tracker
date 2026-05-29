"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Loader2, ImageIcon, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { resizeToFile, fileToDataUrl } from "@/lib/image";
import { parseReceipt } from "@/lib/parse-receipt";
import { create } from "@/lib/storage";
import type { ExtractResponse } from "@/lib/types";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  async function handleFile(picked: File) {
    if (!picked.type.startsWith("image/") && picked.type !== "application/pdf") {
      toast.error("이미지 또는 PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      toast.error("파일이 너무 큽니다 (최대 10MB).");
      return;
    }
    setFile(picked);
    if (picked.type.startsWith("image/")) {
      setPreviewUrl(await fileToDataUrl(picked));
    } else {
      setPreviewUrl(null);
    }
  }

  function clear() {
    setFile(null);
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function extract() {
    if (!file) return;
    setIsExtracting(true);
    const toastId = toast.loading("OCR 분석 중...");
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = (await res.json()) as ExtractResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `오류 (${res.status})`);
      }
      const parsed = parseReceipt(data);

      toast.loading("저장 중...", { id: toastId });
      const uploadFile = file.type.startsWith("image/") ? await resizeToFile(file) : file;
      const created = await create({
        imageFile: uploadFile,
        store: parsed.store,
        date: parsed.date || new Date().toISOString().slice(0, 10),
        total: parsed.total,
        rawFields: parsed.rawFields,
      });

      toast.success("저장되었습니다.", { id: toastId });
      router.push(`/receipts/${created.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      toast.error(msg, { id: toastId });
      setIsExtracting(false);
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">영수증 업로드</h1>
          <p className="text-sm text-muted-foreground mt-1">
            영수증 이미지 또는 PDF를 올리면 자동으로 가게·날짜·금액을 추출합니다.
          </p>
        </div>

        {!file ? (
          <Card
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) await handleFile(dropped);
            }}
            onClick={() => inputRef.current?.click()}
            className={`p-12 border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition ${
              isDragging ? "border-primary bg-accent" : "border-border"
            }`}
          >
            <div className="size-14 rounded-full bg-muted flex items-center justify-center">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <div className="font-medium">
                여기에 파일을 끌어놓거나 클릭하세요
              </div>
              <div className="text-sm text-muted-foreground">
                PNG, JPG, PDF · 최대 10MB
              </div>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={async (e) => {
                const picked = e.target.files?.[0];
                if (picked) await handleFile(picked);
              }}
            />
          </Card>
        ) : (
          <Card className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  <ImageIcon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB · {file.type || "unknown"}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clear}
                disabled={isExtracting}
                aria-label="제거"
              >
                <X className="size-4" />
              </Button>
            </div>
            {previewUrl && (
              <div className="rounded-md overflow-hidden border border-border max-h-96 flex items-center justify-center bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="영수증 미리보기"
                  className="max-w-full max-h-96 object-contain"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={clear} disabled={isExtracting}>
                취소
              </Button>
              <Button onClick={extract} disabled={isExtracting}>
                {isExtracting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> 분석 중...
                  </>
                ) : (
                  "분석 시작"
                )}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </>
  );
}
