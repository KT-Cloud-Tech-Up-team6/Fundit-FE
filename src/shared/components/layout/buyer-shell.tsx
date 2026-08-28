import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { buyerNavigation } from "@/shared/config/navigation";

export function BuyerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="border-line bg-surface/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="text-brand-strong text-xl font-black tracking-tight">
            Fundit
          </Link>
          <nav aria-label="구매자 주요 메뉴" className="hidden items-center gap-5 md:flex">
            {buyerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-brand text-sm font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="프로젝트 검색"
              className="rounded-full px-3 py-2 text-sm font-semibold hover:bg-slate-100"
            >
              검색
            </Link>
            <ModeSwitchLink mode="buyer" />
          </div>
        </div>
      </header>
      <main>{children}</main>
      <nav
        aria-label="모바일 구매자 메뉴"
        className="border-line bg-surface fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {buyerNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-2 py-3 text-center text-xs font-semibold"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
