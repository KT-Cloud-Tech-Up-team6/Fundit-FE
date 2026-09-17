"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import {
  clearCategoryReturnPath,
  getCategoryReturnPath,
  setCategoryReturnPath,
} from "@/shared/lib/category-return-path";

type BuyerBottomNavigationProps = ComponentPropsWithoutRef<"nav"> & {
  activeHref?: "/" | "/live" | "/categories" | "/my";
  compact?: boolean;
  flat?: boolean;
};

function NavigationAsset({
  name,
  compact,
  flat,
  selected,
}: {
  name: "home" | "live-navigation" | "categories" | "profile";
  compact?: boolean;
  flat?: boolean;
  selected?: boolean;
}) {
  if (name === "profile" && !compact) return <Icon name="profile" className="size-5" />;
  const compactAssets = {
    home: "d2d1b",
    "live-navigation": "7e176",
    categories: selected ? "a80a9" : "b7b53",
    profile: selected ? "165c4" : "4d935",
  };
  return (
    <span
      aria-hidden
      className="inline-block size-5 shrink-0 bg-current"
      style={{
        maskImage: compact
          ? `url(/icons/buyer-account/${compactAssets[name]}.svg)`
          : flat && name === "live-navigation" && selected
            ? "url(/images/buyer-live/c4001.svg)"
            : `url(/icons/buyer-live/${name}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

/** `pathname`이 세 세그먼트 중 무엇의 하위 경로인지로 활성 탭을 고른다. 어디에도 안 속하면 undefined. */
function deriveActiveHref(pathname: string): BuyerBottomNavigationProps["activeHref"] {
  if (pathname === "/") return "/";
  if (pathname.startsWith("/live")) return "/live";
  if (pathname.startsWith("/categories")) return "/categories";
  if (pathname.startsWith("/my")) return "/my";
  return undefined;
}

function itemClass(compact: boolean, flat: boolean, active: boolean) {
  return [
    "relative flex w-[39px] flex-col items-center text-[11px] font-medium leading-[1.3] focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
    compact ? "gap-1 text-text-disabled" : "gap-2",
    compact && active && "text-text-default",
    !compact &&
      !flat &&
      active &&
      "after:absolute after:-bottom-2 after:right-0 after:left-0 after:h-0.5 after:bg-layer-surface-primary after:content-['']",
  ]
    .filter(Boolean)
    .join(" ");
}

function ActiveCategoriesTab({ compact, flat }: { compact: boolean; flat: boolean }) {
  const router = useRouter();
  const hasReturnedRef = useRef(false);
  function handleClick() {
    if (hasReturnedRef.current) return;
    hasReturnedRef.current = true;
    const returnPath = getCategoryReturnPath();
    clearCategoryReturnPath();
    router.push(returnPath ?? "/");
  }
  return (
    <button
      type="button"
      aria-current="page"
      className={itemClass(compact, flat, true)}
      onClick={handleClick}
    >
      <NavigationAsset name="categories" compact={compact} flat={flat} selected />
      카테고리
    </button>
  );
}

function BuyerBottomNavigationContent({
  activeHref,
  compact = false,
  flat = false,
  className = "",
  "aria-label": ariaLabel = "구매자 하단 메뉴",
  ...props
}: BuyerBottomNavigationProps) {
  const isCategoriesActive = activeHref === "/categories";
  return (
    <nav
      {...props}
      aria-label={ariaLabel}
      className={`${compact || flat ? "bg-layer-surface-default border-border-default h-[calc(54px+env(safe-area-inset-bottom))] items-center border-t pb-[env(safe-area-inset-bottom)]" : "bg-layer-surface-disabled pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"} ${flat ? "[&_a]:text-text-secondary [&_a[aria-current='page']]:text-text-default" : "text-text-default"} flex justify-between px-5 ${className}`}
    >
      <Link
        href="/"
        aria-current={activeHref === "/" ? "page" : undefined}
        className={itemClass(compact, flat, activeHref === "/")}
      >
        <NavigationAsset name="home" compact={compact} flat={flat} selected={activeHref === "/"} />
        홈
      </Link>
      <Link
        href="/live"
        aria-current={activeHref === "/live" ? "page" : undefined}
        className={itemClass(compact, flat, activeHref === "/live")}
      >
        <NavigationAsset
          name="live-navigation"
          compact={compact}
          flat={flat}
          selected={activeHref === "/live"}
        />
        라이브
      </Link>
      {isCategoriesActive ? (
        <ActiveCategoriesTab compact={compact} flat={flat} />
      ) : (
        <Link
          href="/categories/tech-appliances"
          onClick={() => setCategoryReturnPath(window.location.pathname + window.location.search)}
          className={itemClass(compact, flat, false)}
        >
          <NavigationAsset name="categories" compact={compact} flat={flat} />
          카테고리
        </Link>
      )}
      <Link
        href="/my"
        aria-current={activeHref === "/my" ? "page" : undefined}
        className={itemClass(compact, flat, activeHref === "/my")}
      >
        <NavigationAsset
          name="profile"
          compact={compact}
          flat={flat}
          selected={activeHref === "/my"}
        />
        마이
      </Link>
    </nav>
  );
}

function BuyerBottomNavigationWithDerivedActive(props: BuyerBottomNavigationProps) {
  return <BuyerBottomNavigationContent {...props} activeHref={deriveActiveHref(usePathname())} />;
}

export function BuyerBottomNavigation(props: BuyerBottomNavigationProps) {
  return props.activeHref === undefined ? (
    <BuyerBottomNavigationWithDerivedActive {...props} />
  ) : (
    <BuyerBottomNavigationContent {...props} />
  );
}
