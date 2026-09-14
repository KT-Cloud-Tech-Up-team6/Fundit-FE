"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "@/shared/components/ui/icon";
import {
  demoBuyerFulfillmentState,
  formatShippingDate,
  fulfillmentStages,
  initialStage,
  todayValue,
  type BuyerFulfillmentState,
  type FulfillmentStage,
  type MediaItem,
  type StageStatus,
} from "../model/fulfillment-demo";
import { BuyerTimeline } from "./buyer-timeline";
import { MediaLightbox } from "./media-lightbox";

/* ponytail: 서버 계약 전이라(docs/OPEN_DECISIONS.md P1 — 5단계 ↔ 배송/배송완료 enum 미확정)
   상태는 목업 + useState로만 들고 있다. 각 아코디언은 독립 토글이고 초기값은 현재 단계만 열림.
   새로고침하면 초기화된다. */

const stageIcon: Record<FulfillmentStage, IconName> = {
  prep: "stagePrep",
  production: "stageProduction",
  inspection: "stageInspection",
  release: "stageRelease",
  delivery: "stageDelivery",
};

/** done="완료", active="진행중", todo=뱃지 없음(Figma 824:8216 / 824:8227). */
const statusBadge: Record<StageStatus, string | null> = {
  done: "완료",
  active: "진행중",
  todo: null,
};

const DEMO_TITLE = "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기";

type BuyerFulfillmentHistoryProps = {
  fundingId: string;
  initialState?: BuyerFulfillmentState;
  today?: string;
};

export function BuyerFulfillmentHistory({
  fundingId,
  initialState,
  today: fixedToday,
}: BuyerFulfillmentHistoryProps) {
  const [today] = useState(() => fixedToday ?? todayValue());
  const [state] = useState<BuyerFulfillmentState>(
    () => initialState ?? demoBuyerFulfillmentState(today),
  );
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [open, setOpen] = useState<Record<FulfillmentStage, boolean>>(() => {
    const current = initialStage(state.stages);
    return {
      prep: current === "prep",
      production: current === "production",
      inspection: current === "inspection",
      release: current === "release",
      delivery: current === "delivery",
    };
  });

  return (
    <div className="bg-layer-bg mx-auto min-h-dvh w-full max-w-[390px] min-w-0">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href={`/my/fundings/${fundingId}/fulfillment`}
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="arrowLeft" className="text-text-default size-5" />
        </Link>
        <h1 className="text-title-s text-text-default flex-1 text-center">제작·배송 현황</h1>
        <span aria-hidden className="size-10 shrink-0" />
      </header>

      <div className="bg-layer-surface-default flex flex-col gap-1 px-5 py-4">
        <p className="text-body-emphasis text-text-default truncate">{DEMO_TITLE}</p>
        {state.expectedShippingDate && (
          <p className="text-body-strong text-text-default">
            예상 발송일 {formatShippingDate(state.expectedShippingDate)}
          </p>
        )}
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {fulfillmentStages.map(({ value, label }) => {
          const stage = state.stages[value];
          const filled = stage.status !== "todo";
          const isOpen = open[value];
          const badge = statusBadge[stage.status];
          const panelId = `fulfillment-stage-${value}`;

          return (
            <li key={value} className="bg-layer-surface-default">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen((prev) => ({ ...prev, [value]: !prev[value] }))}
                className="flex w-full cursor-pointer items-center gap-2.5 p-4 text-left"
              >
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                    filled ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"
                  }`}
                >
                  <Icon
                    name={stageIcon[value]}
                    className={`size-4 ${filled ? "text-text-inverse" : "text-text-secondary"}`}
                  />
                </span>
                <span className="text-body-strong text-text-default flex-1">{label}</span>
                {badge && (
                  <span className="bg-layer-surface-disabled text-label-m text-text-default shrink-0 rounded-full px-2 py-1">
                    {badge}
                  </span>
                )}
                {/* frequently/arrow_up는 arrow_down 셰브런을 뒤집은 것과 같다(별도 에셋 없음). */}
                <Icon
                  name="arrowDown"
                  className={`text-text-secondary size-3.5 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              <div id={panelId} hidden={!isOpen} className="flex flex-col gap-2.5 px-4 pb-4">
                {isOpen &&
                  (stage.status === "todo" ? (
                    <p className="text-caption-m text-text-secondary">
                      예상 시작일 {stage.startDate ? formatShippingDate(stage.startDate) : "미정"}
                    </p>
                  ) : (
                    <>
                      {(stage.startDate || stage.expectedEndDate) && (
                        <p className="text-caption-m text-text-secondary">
                          {stage.startDate ? formatShippingDate(stage.startDate) : "미정"}
                          {" - "}
                          {stage.status === "done"
                            ? stage.expectedEndDate
                              ? formatShippingDate(stage.expectedEndDate)
                              : "미정"
                            : `예상 종료일 ${
                                stage.expectedEndDate
                                  ? formatShippingDate(stage.expectedEndDate)
                                  : "미정"
                              }`}
                        </p>
                      )}
                      <BuyerTimeline records={stage.records} onSelectMedia={setPreview} />
                    </>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>

      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
