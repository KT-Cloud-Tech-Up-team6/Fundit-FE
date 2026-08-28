import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { buyerNavigation } from "@/shared/config/navigation";

export function BuyerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="border-border-default bg-layer-surface-default/95 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <Link href="/" className="text-heading-s text-text-default tracking-tight">
            Fundit
          </Link>
          <nav aria-label="구매자 주요 메뉴" className="hidden items-center gap-5 md:flex">
            {buyerNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-label-l hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              aria-label="프로젝트 검색"
              className="text-label-l hover:bg-layer-surface-disabled rounded-full px-3 py-2"
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
        className="border-border-default bg-layer-surface-default fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {buyerNavigation.map((item) => (
          <Link key={item.href} href={item.href} className="text-label-m px-2 py-3 text-center">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
