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

  // 좌측 SNB에서 카테고리(slug)만 바뀌어도 이 컴포넌트가 리마운트될 수 있어(Next.js
  // RSC 특성상 부모 Server Component가 다시 렌더링되며 자식 클라이언트 컴포넌트가
  // 새 인스턴스로 교체됨) 마운트/언마운트 자체는 "카테고리 영역을 벗어났다"는
  // 신호로 쓸 수 없다. 브라우저 뒤로가기·앞으로가기만 정확히 잡기 위해, replaceState·
  // pushState로는 발생하지 않고 실제 히스토리 이동에서만 발생하는 popstate를 쓴다.
  useEffect(() => {
    if (!isCategoriesActive) return;
    window.addEventListener("popstate", clearCategoryReturnPath);
    return () => window.removeEventListener("popstate", clearCategoryReturnPath);
  }, [isCategoriesActive]);

  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={`bg-layer-surface-disabled text-text-default flex justify-between px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] ${className}`}
    >
      <Link
        href="/"
        onClick={clearCategoryReturnPath}
        aria-current={activeHref === "/" ? "page" : undefined}
        className={styles.item}
      >
        <NavigationAsset name="home" />홈
      </Link>
      <Link
        href="/live"
        onClick={clearCategoryReturnPath}
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
        onClick={clearCategoryReturnPath}
        aria-current={activeHref === "/my" ? "page" : undefined}
        className={styles.item}
      >
        <Icon name="profile" className="size-5" />
        마이
      </Link>
    </nav>
  );
}
