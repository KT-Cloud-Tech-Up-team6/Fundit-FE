"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import {
  clearCategoryReturnPath,
  getCategoryReturnPath,
  setCategoryReturnPath,
} from "@/shared/lib/category-return-path";
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
  const hasReturnedRef = useRef(false);

  // 카테고리 탭으로 들어갈 때 현재 경로를 기록해두고, 다시 누르면 그 경로로 돌아간다.
  // 기록이 없으면(예: 앱 내에서 카테고리 탭을 거치지 않고 처음 들어온 딥링크) 홈으로 간다.
  // 카테고리 영역을 실제로 벗어났을 때 이 기록을 정리하는 건 클릭·뒤로가기 등
  // 어떤 방식으로 벗어나든 항상 안전하게 동작해야 해서, 이 컴포넌트가 아니라
  // 앱 전체에 한 번만 마운트되는 CategoryReturnPathGuard(providers/)가 담당한다.
  function handleCategoriesTabEnter() {
    setCategoryReturnPath(window.location.pathname + window.location.search);
  }

  function handleCategoriesTabClick() {
    // router.push는 비동기라 전환이 끝나기 전까지 이 버튼이 그대로 남아있다. 빠르게
    // 두 번 누르면 두 번째 호출은 첫 호출이 이미 지운 값을 읽어 홈으로 잘못 이동하므로,
    // 전환을 예약한 뒤에는 같은 인스턴스의 후속 클릭을 무시한다.
    if (hasReturnedRef.current) return;
    hasReturnedRef.current = true;
    const returnPath = getCategoryReturnPath();
    clearCategoryReturnPath();
    router.push(returnPath ?? "/");
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
        <Link
          href="/categories/tech-appliances"
          onClick={handleCategoriesTabEnter}
          className={styles.item}
        >
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
