"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderAuthLink } from "./header-auth-link";
import { HeaderWeb } from "./header-web";
import { Icon } from "../ui/icon";
import { setCategoryReturnPath } from "@/shared/lib/category-return-path";
import { PendingDestination } from "../ui/pending-destination";

/* 메뉴 아이콘은 SVG를 mask로 깔고 bg-current로 칠해 파일마다 다른 stroke 색과 무관하게 글자색을 따른다.
   활성 LIVE의 fill 아이콘만 Figma(`1419:51907`)대로 파랑이다. */
function MenuIcon({ src, className = "bg-current" }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`size-5 shrink-0 ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

function menuClass(active: boolean) {
  return `hover:bg-layer-surface-disabled flex items-center gap-2 rounded-xs px-2 py-1 transition-colors ${active ? "text-text-default" : "text-text-secondary"}`;
}

export function BuyerDesktopHeader({ exitHref }: { exitHref?: string }) {
  /* Figma 홈 `2315:71553`·LIVE `1419:51918`: 메뉴는 기본 line 아이콘과 보조 글자색이고, 지금 화면의 메뉴만
     fill 아이콘과 기본 글자색이다. 활성 기준은 하단 메뉴(BuyerBottomNavigation)와 같은 경로 앞부분이다.
     Next 라우터 밖(단위 테스트의 서버 렌더)에서는 경로가 null이라 둘 다 비활성으로 둔다. */
  const pathname = usePathname() ?? "";
  const categoriesActive = pathname.startsWith("/categories");
  const liveActive = pathname.startsWith("/live");
  return (
    <HeaderWeb
      className="hidden min-[1200px]:block"
      logo={
        <Link href="/" aria-label="Fundit 홈">
          <Image src="/logo.svg" alt="Fundit" width={100} height={36} />
        </Link>
      }
      nav={
        <nav aria-label="구매자 주요 메뉴" className="text-body-strong flex items-center gap-4">
          <Link
            href="/categories/tech-appliances"
            aria-current={categoriesActive ? "page" : undefined}
            onClick={() => setCategoryReturnPath(window.location.pathname + window.location.search)}
            className={menuClass(categoriesActive)}
          >
            <MenuIcon
              src={
                categoriesActive
                  ? "/icons/buyer-account/a80a9.svg"
                  : "/icons/buyer-desktop/category.svg"
              }
            />
            카테고리
          </Link>
          <Link
            href="/live"
            aria-current={liveActive ? "page" : undefined}
            className={menuClass(liveActive)}
          >
            {liveActive ? (
              <MenuIcon
                src="/images/buyer-live/c4001.svg"
                className="bg-layer-surface-primary-live"
              />
            ) : (
              <MenuIcon src="/icons/buyer-live/live-navigation.svg" />
            )}
            라이브
          </Link>
        </nav>
      }
      actions={
        <>
          <HeaderAuthLink />
          <Link
            href="/my/wishlist"
            aria-label="관심 목록"
            className="hover:bg-layer-surface-disabled flex size-9 items-center justify-center rounded-full transition-colors"
          >
            {/* 하트 SVG는 25.3×21.3이라 24×24 이미지로 그리면 찌그러진다. 알림·마이처럼 mask로 비율을 지킨다. */}
            <Icon name="heart" className="size-6" />
          </Link>
          <PendingDestination label="알림함" className="flex size-9 items-center justify-center">
            <Icon name="bell" className="size-6" />
          </PendingDestination>
          <Link
            href="/my"
            aria-label="마이페이지"
            className="hover:bg-layer-surface-disabled flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Icon name="profile" className="size-6" />
          </Link>
          <Link
            href={exitHref ?? "/seller/projects"}
            className="bg-layer-surface-disabled hover:bg-layer-surface-disabled-hover text-body-s text-text-default ml-3 flex h-10 items-center gap-2 rounded-xs px-3 transition-colors"
          >
            {exitHref ? "나가기" : "창작자 전환"}
            <Icon name={exitHref ? "close" : "modeSwitch"} className="size-4" />
          </Link>
        </>
      }
    />
  );
}
