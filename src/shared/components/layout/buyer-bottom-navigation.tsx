import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-bottom-navigation.module.css";

type BuyerBottomNavigationProps = ComponentPropsWithoutRef<"nav"> & {
  activeHref?: "/" | "/live" | "/my";
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
      <button
        type="button"
        disabled
        title="카테고리 화면 미정"
        aria-label="카테고리 · 화면 미정"
        className={styles.item}
      >
        <NavigationAsset name="categories" />
        카테고리
      </button>
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
