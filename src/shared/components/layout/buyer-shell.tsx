import Image from "next/image";
import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { ModeSwitchLink } from "@/features/mode-switch/ui/mode-switch-link";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { HeaderWeb } from "@/shared/components/layout/header-web";
import { SearchField } from "@/shared/components/ui/search-field";
import { buyerNavigation } from "@/shared/config/navigation";

const logo = (
  <Link href="/" className="flex shrink-0 items-center">
    <Image alt="Fundit" className="h-9 w-auto" height={36} src="/logo.svg" width={100} />
  </Link>
);

export function BuyerShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 min-[1200px]:pb-0">
      {/* mobile: Figma header/header_mobile(default) */}
      <header className="border-border-default bg-layer-surface-default/95 sticky top-0 z-20 border-b px-4 py-3 backdrop-blur min-[1200px]:hidden">
        <div className="flex items-center justify-between gap-4">
          {logo}
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
      {/* PC: 판매자 화면과 공유하는 Figma header/header_web */}
      <HeaderWeb
        className="sticky top-0 z-20 hidden min-[1200px]:block"
        logo={logo}
        nav={
          <nav aria-label="구매자 주요 메뉴" className="flex items-center gap-5">
            {buyerNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-label-l hover:underline">
                {item.label}
              </Link>
            ))}
          </nav>
        }
        actions={
          <>
            <Form action="/search" className="w-60" role="search">
              <SearchField
                aria-label="프로젝트 검색"
                name="q"
                placeholder="프로젝트 검색"
                size="sm"
              />
            </Form>
            <ModeSwitchLink mode="buyer" />
          </>
        }
      />
      <main>{children}</main>
      <BuyerBottomNavigation className="fixed inset-x-0 bottom-0 z-20 min-[1200px]:hidden" />
    </div>
  );
}
