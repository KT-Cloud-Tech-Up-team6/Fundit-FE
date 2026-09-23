import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { Icon } from "@/shared/components/ui/icon";
import { PendingDestination } from "@/shared/components/ui/pending-destination";

/**
 * 구매자 계정 화면(마이페이지 하위)의 공용 셸.
 * 1199px 이하는 Figma 모바일 원본의 52px 헤더 + 가용 폭,
 * 1200px 이상은 제작·배송 현황(FL_B_MY_DLVR_1)과 같은 70px 웹 헤더 + 793px 콘텐츠 열이다.
 */
export function BuyerAccountScreen({
  title,
  backHref = "/my",
  backLabel,
  breadcrumb,
  children,
  className = "",
  fullPage = false,
}: {
  title: string;
  backHref?: string;
  /** 모바일 헤더 뒤로가기 링크가 이동할 목적지를 설명한다. */
  backLabel?: string;
  /** 데스크톱 현재 위치 표시. 마지막 항목이 현재 화면이다. 기본값은 `마이페이지 > {title}`. */
  breadcrumb?: string[];
  children: ReactNode;
  className?: string;
  /** 조회 실패처럼 제목 없이 자식이 화면 전체를 대체할 때 사용한다. */
  fullPage?: boolean;
}) {
  const crumbs = breadcrumb ?? ["마이페이지", title];
  const resolvedBackLabel =
    backLabel ??
    (backHref === "/my"
      ? "마이페이지로 돌아가기"
      : backHref === "/"
        ? "홈으로 돌아가기"
        : "이전 화면으로 돌아가기");

  return (
    <div className="bg-layer-surface-default min-h-dvh w-full">
      <BuyerDesktopHeader />
      <main
        className={`bg-layer-surface-default text-text-default [&_a:focus-visible]:outline-border-primary [&_button:focus-visible]:outline-border-primary [&_summary:focus-visible]:outline-border-primary mx-auto min-h-dvh w-full overflow-x-clip min-[1200px]:min-h-[calc(100dvh-70px)] min-[1200px]:max-w-[793px] [&_a:focus-visible]:outline-2 [&_button:focus-visible]:outline-2 [&_summary:focus-visible]:outline-2 ${fullPage ? "flex flex-col" : ""} ${className}`}
      >
        {!fullPage && (
          <header className="bg-layer-surface-default sticky top-0 z-10 grid h-[52px] grid-cols-[40px_1fr_40px] items-center px-3 min-[1200px]:hidden">
            <Link
              href={backHref}
              aria-label={resolvedBackLabel}
              className="flex size-10 items-center justify-center"
            >
              <Icon name="arrowLeft" className="size-5" />
            </Link>
            <h1 className="text-title-s text-center">{title}</h1>
            <PendingDestination label="알림함" className="flex size-10 items-center justify-center">
              <Icon name="bell" className="size-6" />
            </PendingDestination>
          </header>
        )}
        {/* 데스크톱 제목 블록. 모바일 헤더와 배타적으로 표시돼 h1은 항상 한 개다.
            px-5는 아래 콘텐츠 블록이 유지하는 모바일 좌우 여백과 시작선을 맞춘다. */}
        {!fullPage && (
          <div className="hidden px-5 pt-3 min-[1200px]:block">
            <nav
              aria-label="현재 위치"
              className="text-label-m text-text-secondary flex h-6 items-center gap-2 font-medium"
            >
              {crumbs.map((crumb, index) => (
                <Fragment key={crumb}>
                  {index > 0 && <span aria-hidden>&gt;</span>}
                  <span>{crumb}</span>
                </Fragment>
              ))}
            </nav>
            <h1 className="text-heading-l text-text-title mt-1 py-2">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
