"use client";

import Image from "next/image";
import Link from "next/link";
import { HeaderWeb } from "./header-web";
import { Icon } from "../ui/icon";
import { setCategoryReturnPath } from "@/shared/lib/category-return-path";
import { PendingDestination } from "../ui/pending-destination";

export function BuyerDesktopHeader({ exitHref }: { exitHref?: string }) {
  return (
    <HeaderWeb
      className="hidden min-[1200px]:block"
      logo={
        <Link href="/" aria-label="Fundit 홈">
          <Image src="/logo.svg" alt="Fundit" width={100} height={36} />
        </Link>
      }
      nav={
        <nav aria-label="구매자 주요 메뉴" className="text-body-m flex items-center gap-4">
          <Link
            href="/categories/tech-appliances"
            onClick={() => setCategoryReturnPath(window.location.pathname + window.location.search)}
            className="flex items-center gap-2 px-2"
          >
            <Image src="/icons/buyer-desktop/category.svg" width={20} height={20} alt="" />
            카테고리
          </Link>
          <Link href="/live" className="flex items-center gap-2 px-2">
            <Image src="/images/buyer-live/c4001.svg" width={20} height={20} alt="" />
            라이브
          </Link>
        </nav>
      }
      actions={
        <>
          <Link
            href="/my/wishlist"
            aria-label="관심 목록"
            className="flex size-9 items-center justify-center"
          >
            <Image src="/icons/buyer-live-room/heart.svg" width={24} height={24} alt="" />
          </Link>
          <PendingDestination label="알림함" className="flex size-9 items-center justify-center">
            <Icon name="bell" className="size-6" />
          </PendingDestination>
          <Link
            href="/my"
            aria-label="마이페이지"
            className="flex size-9 items-center justify-center"
          >
            <Icon name="profile" className="size-6" />
          </Link>
          <Link
            href={exitHref ?? "/my"}
            className="bg-layer-surface-disabled text-body-s ml-3 flex h-10 items-center gap-2 rounded-xs px-3"
          >
            {exitHref ? "나가기" : "참여자 센터"}
            <Icon name={exitHref ? "close" : "swap"} className="size-4" />
          </Link>
        </>
      }
    />
  );
}
