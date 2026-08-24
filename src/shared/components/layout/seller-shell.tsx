import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { sellerNavigation } from "@/shared/config/navigation";

export function SellerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-slate-950 p-4 text-white lg:min-h-screen lg:border-b-0 lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <Link href="/seller/projects" className="text-xl font-black">
            Fundit Seller
          </Link>
          <div className="lg:mt-6">
            <ModeSwitchLink mode="seller" />
          </div>
        </div>
        <nav
          aria-label="판매자 주요 메뉴"
          className="mt-4 flex gap-2 overflow-x-auto lg:mt-8 lg:flex-col"
        >
          {sellerNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold hover:bg-white/10"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="border-b border-line bg-surface px-4 py-4 sm:px-6">
          <p className="text-sm font-semibold text-muted">판매자 운영 콘솔 · PC-first</p>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
