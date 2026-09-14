"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-bottom-navigation.module.css";

type BuyerBottomNavigationProps = ComponentPropsWithoutRef<"nav"> & {
  activeHref?: "/" | "/live" | "/categories" | "/my";
};

function NavigationAsset({ name }: { name: "home" | "live-navigation" | "categories" }) {
  return (
    <span
      aria-hidden
      className="inline-block size-5 shrink-0 bg-current"
      style={{
        maskImage: `url(/icons/buyer-live/${name}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

export function BuyerBottomNavigation({
  activeHref,
  className = "",
  "aria-label": ariaLabel = "구매자 하단 메뉴",
  ...props
}: BuyerBottomNavigationProps) {
  const router = useRouter();
  const isCategoriesActive = activeHref === "/categories";

  // ponytail: 딥링크·새로고침 등 앱 내 이전 화면이 없을 때는 history.length 휴리스틱으로
  // 판단해 홈으로 대체한다. 정확한 "앱 내 진입 여부" 추적이 필요해지면 그때 보강한다.
  function handleCategoriesTabClick() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={`bg-layer-surface-disabled text-text-default flex justify-between px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] ${className}`}
    >
      <Link href="/" aria-current={activeHref === "/" ? "page" : undefined} className={styles.item}>
        <NavigationAsset name="home" />홈
      </Link>
      <Link
        href="/live"
        aria-current={activeHref === "/live" ? "page" : undefined}
        className={styles.item}
      >
        <NavigationAsset name="live-navigation" />
        라이브
      </Link>
      {isCategoriesActive ? (
        <button
          type="button"
          aria-current="page"
          className={styles.item}
          onClick={handleCategoriesTabClick}
        >
          <NavigationAsset name="categories" />
          카테고리
        </button>
      ) : (
        <Link href="/categories/tech-appliances" className={styles.item}>
          <NavigationAsset name="categories" />
          카테고리
        </Link>
      )}
      <Link
        href="/my"
        aria-current={activeHref === "/my" ? "page" : undefined}
        className={styles.item}
      >
        <Icon name="profile" className="size-5" />
        마이
      </Link>
    </nav>
  );
}
