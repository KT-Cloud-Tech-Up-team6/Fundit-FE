"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-bottom-navigation.module.css";

type BuyerBottomNavigationProps = ComponentPropsWithoutRef<"nav"> & {
  activeHref?: "/" | "/live" | "/categories" | "/my";
};

const CATEGORY_RETURN_PATH_KEY = "buyer-category-return-path";

function clearCategoryReturnPath() {
  try {
    sessionStorage.removeItem(CATEGORY_RETURN_PATH_KEY);
  } catch {
    // 접근 불가 환경에서는 애초에 값도 없으므로 무시한다.
  }
}

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

  // history.length는 외부 페이지·이전 세션 항목도 포함해 앱 내 진입 여부를 판별할 수
  // 없다. 카테고리 탭으로 들어갈 때 현재 경로를 직접 기록해두고, 다시 누르면 그 경로로
  // 돌아간다. 기록이 없으면(딥링크·새로고침 등 앱 내 이전 화면이 없는 경우) 홈으로 간다.
  function handleCategoriesTabEnter() {
    try {
      sessionStorage.setItem(
        CATEGORY_RETURN_PATH_KEY,
        window.location.pathname + window.location.search,
      );
    } catch {
      // sessionStorage 접근 불가(프라이빗 모드 등)여도 홈 폴백으로 정상 동작한다.
    }
  }

  function handleCategoriesTabClick() {
    let returnPath: string | null = null;
    try {
      returnPath = sessionStorage.getItem(CATEGORY_RETURN_PATH_KEY);
    } catch {
      returnPath = null;
    }
    clearCategoryReturnPath();
    router.push(returnPath ?? "/");
  }

  // 카테고리 화면을 떠나는 방법(탭 클릭, 다른 탭, 브라우저 뒤로가기·앞으로가기 등)과
  // 무관하게, 이 컴포넌트가 "카테고리 활성" 상태로 마운트돼 있다가 언마운트되는
  // 시점에 복귀 기록을 정리한다. onClick으로는 브라우저 뒤로가기를 잡을 수 없지만
  // 언마운트는 (buyer-live)·(buyer-category) 그룹 간 이동에서 어떤 방식으로 떠나든
  // 항상 일어난다.
  useEffect(() => {
    if (!isCategoriesActive) return;
    return () => clearCategoryReturnPath();
  }, [isCategoriesActive]);

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
