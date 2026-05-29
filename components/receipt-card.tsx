"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatKRW, formatDateShort } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition cursor-pointer p-0 gap-0">
        <div className="aspect-[4/3] bg-muted overflow-hidden flex items-center justify-center">
          {receipt.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/receipts/${receipt.id}/image`}
              alt={receipt.store || "영수증"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="text-muted-foreground text-sm">미리보기 없음</div>
          )}
        </div>
        <div className="p-4 space-y-1">
          <div className="font-medium truncate">
            {receipt.store || "가게 미상"}
          </div>
          <div className="text-sm text-muted-foreground">
            {receipt.date ? formatDateShort(receipt.date) : "날짜 미상"}
          </div>
          <div className="text-lg font-semibold">{formatKRW(receipt.total)}</div>
        </div>
      </Card>
    </Link>
  );
}
