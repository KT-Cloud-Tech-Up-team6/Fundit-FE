import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { HeaderWeb } from "@/shared/components/layout/header-web";
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
      <HeaderWeb
        logo={
          <Link href="/seller/projects" className="flex shrink-0 items-center">
            <Image alt="Fundit" className="h-9 w-auto" height={36} src="/logo.svg" width={100} />
          </Link>
        }
        nav={
          <nav aria-label="판매자 주요 메뉴" className="flex gap-1">
            {sellerNavigation.map((item) => (
              <SellerNavLink key={item.href} {...item} />
            ))}
          </nav>
        }
        actions={
          <>
            {headerActions.map((action) => (
              <button
                key={action.name}
                type="button"
                aria-label={action.label}
                className="flex size-9 items-center justify-center"
              >
                <Icon name={action.name} className="size-6" />
              </button>
            ))}
            <ModeSwitchLink mode="seller" />
          </>
        }
      />
      <main className="max-w-content mx-auto flex min-h-[calc(100vh-70px)] w-full flex-col px-5 pb-[22px] xl:px-0">
        {children}
      </main>
    </div>
  );
}
