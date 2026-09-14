"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-bottom-navigation.module.css";

type BuyerBottomNavigationProps = ComponentPropsWithoutRef<"nav"> & {
  activeHref?: "/" | "/live" | "/categories" | "/my";
};

const CATEGORY_RETURN_PATH_KEY = "buyer-category-return-path";

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
      sessionStorage.removeItem(CATEGORY_RETURN_PATH_KEY);
    } catch {
      returnPath = null;
    }
    router.push(returnPath ?? "/");
  }

  // 홈·라이브·마이는 카테고리 재클릭이 아닌 다른 경로로 카테고리 화면을 떠나는 경우다.
  // 기록을 지워두지 않으면 이번 방문과 무관한 다음 카테고리 진입에서 이 값을 잘못
  // 재사용하게 된다.
  function clearCategoriesReturnPath() {
    try {
      sessionStorage.removeItem(CATEGORY_RETURN_PATH_KEY);
    } catch {
      // 접근 불가 환경에서는 애초에 값도 없으므로 무시한다.
    }
  }

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={`bg-layer-surface-disabled text-text-default flex justify-between px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] ${className}`}
    >
      <Link
        href="/"
        onClick={clearCategoriesReturnPath}
        aria-current={activeHref === "/" ? "page" : undefined}
        className={styles.item}
      >
        <NavigationAsset name="home" />홈
      </Link>
      <Link
        href="/live"
        onClick={clearCategoriesReturnPath}
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
        onClick={clearCategoriesReturnPath}
        aria-current={activeHref === "/my" ? "page" : undefined}
        className={styles.item}
      >
        <Icon name="profile" className="size-5" />
        마이
      </Link>
    </nav>
  );
}
