"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/shared/components/ui/icon";
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
import { BuyerTimeline } from "./buyer-timeline";
import { MediaLightbox } from "./media-lightbox";
import { StaleBanner } from "./stale-banner";

/* ponytail: 서버 계약 전이라(docs/OPEN_DECISIONS.md P1 — 5단계 ↔ 배송/배송완료 enum 미확정)
   상태는 목업 + useState로만 들고 있다. 라이트박스·타임라인 펼침 외 상호작용은 없고
   새로고침하면 초기화된다. 계약이 생기면 useState 자리를 서버 상태로 바꾼다. */

const DEMO_PRODUCT = {
  title: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
  rewardOption: "[얼리버드] 가장 먼저 만나는 스타터 세트",
  rewardCount: 1,
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
    () => initialState ?? demoBuyerFulfillmentState(today),
  );
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const current = initialStage(state.stages);
  const currentStage = state.stages[current];
  const staleDays = isStale(currentStage, today)
    ? daysSinceLastRecord(currentStage.records, today)
    : null;

  return (
    <div className="bg-layer-bg mx-auto min-h-dvh w-full max-w-[390px] min-w-0">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href={`/my/fundings/${fundingId}`}
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="arrowLeft" className="text-text-default size-5" />
        </Link>
        <h1 className="text-title-s text-text-default flex-1 text-center">제작·배송 현황</h1>
        <span aria-hidden className="size-10 shrink-0" />
      </header>

      <section className="bg-layer-surface-default flex flex-col gap-4 px-5 py-4">
        <div className="flex gap-3">
          <div className="bg-layer-surface-disabled text-caption-m text-text-secondary flex aspect-square size-[42px] shrink-0 items-center justify-center rounded-xs">
            IMG
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-body-emphasis text-text-default truncate">{DEMO_PRODUCT.title}</p>
            <p className="text-caption-s text-text-secondary flex gap-1">
              <span className="truncate">{DEMO_PRODUCT.rewardOption}</span>
              <span aria-hidden>·</span>
              <span className="shrink-0">{DEMO_PRODUCT.rewardCount}개</span>
            </p>
          </div>
        </div>

        <p className="text-body-l text-text-default">
          현재 <span className="text-title-s">{stageLabel(current)}</span> 중 이에요
        </p>

        <BuyerStageStepper state={state.stages} />

        <div className="flex flex-col gap-1">
          {currentStage.startDate && (
            <p className="text-caption-m text-text-secondary">
              {formatShippingDate(currentStage.startDate)} {stageLabel(current)} 시작
            </p>
          )}
          {currentStage.expectedEndDate && (
            <p className="text-body-strong text-text-default">
              {stageLabel(current)} 완료 예정일 {formatShippingDate(currentStage.expectedEndDate)}
            </p>
          )}
        </div>
      </section>

      <section className="bg-layer-surface-default mt-2 px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-title-s text-text-default">세부 진행 기록</h2>
          <Link
            href={`/my/fundings/${fundingId}/fulfillment/history`}
            aria-label="세부 진행 기록 더보기"
            className="text-caption-s text-text-secondary p-1"
          >
            더보기
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <p className="text-body-strong text-text-default">{stageLabel(current)}</p>
          {(currentStage.startDate || currentStage.expectedEndDate) && (
            <p className="text-caption-m text-text-secondary">
              {currentStage.startDate ? formatShippingDate(currentStage.startDate) : "미정"} - 예정{" "}
              {currentStage.expectedEndDate
                ? formatShippingDate(currentStage.expectedEndDate)
                : "미정"}
            </p>
          )}
          {/* Figma 프레임에는 없지만 이슈 #70 P2(미갱신 안내) 요구로 판매자 화면의
              정체 경고 패턴(StaleBanner)을 재사용한다. 현재 단계가 7일+ 미갱신이면 노출. */}
          {staleDays !== null && <StaleBanner days={staleDays} />}
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
