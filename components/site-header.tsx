import Link from "next/link";
import { Receipt } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Receipt className="size-5" aria-hidden />
          <span>영수증 트래커</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            대시보드
          </Link>
          <Link
            href="/upload"
            className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            영수증 추가
          </Link>
        </nav>
      </div>
    </header>
  );
}
