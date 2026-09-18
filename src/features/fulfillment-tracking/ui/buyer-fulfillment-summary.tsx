"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { demoFundingDetail } from "@/features/funding-history/model/funding-history";
import {
  daysSinceLastRecord,
  demoBuyerFulfillmentState,
  formatShippingDate,
  initialStage,
  isStale,
  stageLabel,
  todayValue,
  type BuyerFulfillmentState,
  type MediaItem,
} from "../model/fulfillment-demo";
import { BuyerStageStepper } from "./buyer-stage-stepper";
import { BuyerStaleBanner } from "./buyer-stale-banner";
import { BuyerTimeline } from "./buyer-timeline";
import { MediaLightbox } from "./media-lightbox";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";

/* ponytail: 서버 계약 전이라(docs/OPEN_DECISIONS.md P1 — 5단계 ↔ 배송/배송완료 enum 미확정)
   상태는 목업 + useState로만 들고 있다. 라이트박스·타임라인 펼침 외 상호작용은 없고
   새로고침하면 초기화된다. 계약이 생기면 useState 자리를 서버 상태로 바꾼다. */

type BuyerFulfillmentSummaryProps = {
  fundingId: string;
  /** Storybook에서 단계 상태를 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  initialState?: BuyerFulfillmentState;
  /** 정체 경고처럼 날짜에 기대는 상태를 고정 렌더하기 위한 자리. */
  today?: string;
};

export function BuyerFulfillmentSummary({
  fundingId,
  initialState,
  today: fixedToday,
}: BuyerFulfillmentSummaryProps) {
  const product = demoFundingDetail(fundingId);
  const [today] = useState(() => fixedToday ?? todayValue());
  const [state] = useState<BuyerFulfillmentState>(
    () => initialState ?? demoBuyerFulfillmentState(),
  );
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const current = initialStage(state.stages);
  const currentStage = state.stages[current];
  const staleDays = isStale(currentStage, today)
    ? daysSinceLastRecord(currentStage.records, today)
    : null;

  const statusCopy =
    currentStage.status === "active" ? (
      <>
        현재 <strong className="font-semibold">{stageLabel(current)}</strong> 중 이에요
      </>
    ) : currentStage.status === "todo" ? (
      <>
        <strong className="font-semibold">{stageLabel(current)}</strong> 시작 전이에요
      </>
    ) : (
      <>제작·배송이 완료됐어요</>
    );

  return (
    <>
      <BuyerDesktopHeader />
      {/* 1199px 이하에서는 기존 소비자 모바일 정보 구조를 유지한다. */}
      <div
        data-layout="mobile"
        className="bg-layer-bg min-h-dvh w-full min-w-0 pb-[calc(32px+env(safe-area-inset-bottom))] min-[1200px]:hidden"
      >
        <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
          <Link
            href={`/my/fundings/${fundingId}`}
            aria-label="뒤로"
            className="flex size-10 shrink-0 items-center px-1"
          >
            <Image src="/images/fulfillment/arrow-left.svg" width={20} height={20} alt="" />
          </Link>
          <h1 className="text-title-s text-text-title min-w-0 flex-1 truncate text-center leading-[1.42]">
            {product.projectTitle}
          </h1>
          <span aria-hidden className="size-10 shrink-0" />
        </header>

        <section className="bg-layer-surface-default flex flex-col gap-4 px-5 py-4">
          <div className="flex min-h-10 items-center justify-between gap-3">
            {currentStage.status === "active" ? (
              <p className="text-body-l text-text-default">
                현재 <span className="text-title-s">{stageLabel(current)}</span> 중 이에요
              </p>
            ) : currentStage.status === "todo" ? (
              <p className="text-body-l text-text-default">
                <span className="text-title-s">{stageLabel(current)}</span> 시작 전이에요
              </p>
            ) : (
              <p className="text-title-s text-text-default">제작·배송이 완료됐어요</p>
            )}

            <Link
              href={`/my/fundings/${fundingId}/fulfillment/history`}
              aria-label="세부 진행 기록 더보기"
              className="text-caption-s text-text-secondary flex h-10 shrink-0 items-center px-2 font-medium underline"
            >
              더보기
            </Link>
          </div>

          <BuyerStageStepper state={state.stages} />

          <div className="flex flex-col">
            {currentStage.startDate && currentStage.status === "active" && (
              <p className="text-body-s text-text-secondary leading-[1.42] font-medium">
                {formatShippingDate(currentStage.startDate)} {stageLabel(current)} 시작
              </p>
            )}
            {currentStage.startDate && currentStage.status === "todo" && (
              <p className="text-body-strong text-text-default">
                {stageLabel(current)} 시작 예정일 {formatShippingDate(currentStage.startDate)}
              </p>
            )}
            {currentStage.expectedEndDate && currentStage.status === "active" && (
              <p className="text-body-strong text-text-default">
                {stageLabel(current)} 완료 예정일 {formatShippingDate(currentStage.expectedEndDate)}
              </p>
            )}
          </div>
        </section>

        <section className="bg-layer-surface-default mt-3">
          <h2 className="text-title-s text-text-default px-5 pt-4 leading-[1.42]">
            세부 진행 기록
          </h2>
          <div className="flex flex-col gap-2.5 px-5 py-4">
            <p className="text-body-strong text-text-default">{stageLabel(current)}</p>
            {/* Figma 프레임에는 없지만 이슈 #70 P2(미갱신 안내) 요구로 현재 단계가
              7일 이상 갱신되지 않으면 구매자용 읽기 전용 안내를 노출한다. */}
            {staleDays !== null && <BuyerStaleBanner days={staleDays} />}
            <BuyerTimeline
              records={currentStage.records}
              onSelectMedia={setPreview}
              collapsibleItems
            />
          </div>
        </section>
      </div>
      {/* Figma FL_B_MY_DLVR_1: 데스크톱은 793px 고정 콘텐츠 열, 현재 단계 기록을 펼쳐 둔다. */}
      <main className="bg-layer-surface-default hidden min-h-[calc(100dvh-70px)] min-[1200px]:block">
        <div className="mx-auto w-full max-w-[793px] pt-3 pb-16">
          <nav
            aria-label="현재 위치"
            className="text-label-m text-text-secondary flex h-6 items-center gap-2 font-medium"
          >
            <span>마이페이지</span>
            <span aria-hidden>&gt;</span>
            <span>펀딩내역</span>
            <span aria-hidden>&gt;</span>
            <span>제작·배송 현황</span>
          </nav>
          <h1 className="text-heading-l text-text-title mt-1 py-2">제작·배송 현황</h1>
          <section>
            <div className="flex h-10 items-center justify-between gap-3">
              <p className="text-body-l text-text-default">{statusCopy}</p>
              <Link
                href={`/my/fundings/${fundingId}/fulfillment/history`}
                className="text-caption-s text-text-secondary flex h-10 items-center px-2 font-medium underline"
              >
                자세히 보기
              </Link>
            </div>
            <div className="mt-2">
              <BuyerStageStepper state={state.stages} showStatusBadge showExpectedStartTooltip />
            </div>
            <div className="mt-8">
              {currentStage.expectedEndDate && currentStage.status === "active" && (
                <p className="text-body-strong text-text-default">
                  {stageLabel(current)} 완료 예정일{" "}
                  {formatShippingDate(currentStage.expectedEndDate)}
                </p>
              )}
              {currentStage.startDate && (
                <p className="text-body-s text-text-secondary font-medium">
                  {formatShippingDate(currentStage.startDate)} {stageLabel(current)} 시작
                </p>
              )}
            </div>
          </section>
          <section className="border-border-default mt-5 overflow-hidden rounded-xs border">
            <h2 className="text-body-strong text-text-default border-border-default flex h-[58px] items-center border-b px-3">
              {current === "production" ? "제작" : stageLabel(current)}{" "}
              <span className="text-body-s text-text-secondary ml-3 font-normal">
                {currentStage.startDate &&
                  `${formatShippingDate(currentStage.startDate)} ${stageLabel(current)} 시작`}
              </span>
            </h2>
            <div className="bg-layer-bg px-6 py-4">
              {staleDays !== null && <BuyerStaleBanner days={staleDays} />}
              <BuyerTimeline
                records={currentStage.records}
                onSelectMedia={setPreview}
                variant="desktop"
              />
            </div>
          </section>
        </div>
      </main>
      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </>
  );
}
