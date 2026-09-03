import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { SellerNavLink } from "@/shared/components/layout/seller-nav-link";
import { Icon } from "@/shared/components/ui/icon";
import { sellerNavigation } from "@/shared/config/navigation";

const headerActions = [
  { name: "bell", label: "알림" },
  { name: "settings", label: "설정" },
  { name: "profile", label: "내 계정" },
] as const;

export function SellerShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-layer-surface-default min-h-screen">
      <header className="border-border-default h-[70px] border-b">
        <div className="max-w-content mx-auto flex h-full w-full items-center gap-4 px-5 xl:px-0">
          <Link
            href="/seller/projects"
            className="bg-border-default text-label-l flex h-[54px] w-[102px] shrink-0 items-center justify-center"
          >
            로고
          </Link>
          <nav aria-label="판매자 주요 메뉴" className="flex gap-1">
            {sellerNavigation.map((item) => (
              <SellerNavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {headerActions.map((action) => (
              <button
                key={action.name}
                type="button"
                aria-label={action.label}
                className="hover:bg-layer-surface-disabled focus-visible:outline-border-primary flex h-9 w-7 items-center justify-center rounded-xs focus-visible:outline-2"
              >
                <Icon name={action.name} className="size-5" />
              </button>
            ))}
            <ModeSwitchLink mode="seller" />
          </div>
        </div>
      </header>
      <main className="max-w-content mx-auto flex min-h-[calc(100vh-70px)] w-full flex-col px-5 pb-[22px] xl:px-0">
        {children}
      </main>
    </div>
  );
}
