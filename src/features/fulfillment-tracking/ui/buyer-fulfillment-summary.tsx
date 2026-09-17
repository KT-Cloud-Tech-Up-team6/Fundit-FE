"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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

/* ponytail: 서버 계약 전이라(docs/OPEN_DECISIONS.md P1 — 5단계 ↔ 배송/배송완료 enum 미확정)
   상태는 목업 + useState로만 들고 있다. 라이트박스·타임라인 펼침 외 상호작용은 없고
   새로고침하면 초기화된다. 계약이 생기면 useState 자리를 서버 상태로 바꾼다. */

const DEMO_PRODUCT = {
  title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
};

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

  return (
    <div className="bg-layer-bg mx-auto min-h-dvh w-full max-w-[390px] min-w-0 pb-[calc(32px+env(safe-area-inset-bottom))]">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href={`/my/fundings/${fundingId}`}
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center px-1"
        >
          <Image src="/images/fulfillment/arrow-left.svg" width={20} height={20} alt="" />
        </Link>
        <h1 className="text-title-s text-text-title min-w-0 flex-1 truncate text-center leading-[1.42]">
          {DEMO_PRODUCT.title}
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
        <h2 className="text-title-s text-text-default px-5 pt-4 leading-[1.42]">세부 진행 기록</h2>
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

      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
