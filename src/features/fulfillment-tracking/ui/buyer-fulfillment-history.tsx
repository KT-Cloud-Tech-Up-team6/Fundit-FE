"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Icon, type IconName } from "@/shared/components/ui/icon";
import {
  demoBuyerFulfillmentState,
  formatShippingDate,
  fulfillmentStages,
  initialStage,
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
};

export function BuyerFulfillmentHistory({ fundingId, initialState }: BuyerFulfillmentHistoryProps) {
  const [state] = useState<BuyerFulfillmentState>(
    () => initialState ?? demoBuyerFulfillmentState(),
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
    <div className="bg-layer-bg mx-auto min-h-dvh w-full max-w-[390px] min-w-0 pb-[calc(32px+env(safe-area-inset-bottom))]">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href={`/my/fundings/${fundingId}/fulfillment`}
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center px-1"
        >
          <Image src="/images/fulfillment/arrow-left.svg" width={20} height={20} alt="" />
        </Link>
        <h1 className="text-title-s text-text-title min-w-0 flex-1 truncate text-center leading-[1.42]">
          {DEMO_TITLE}
        </h1>
        <span aria-hidden className="size-10 shrink-0" />
      </header>

      <div className="bg-layer-surface-default flex flex-col gap-1 px-5 py-4">
        <p className="text-body-s text-text-default truncate leading-[1.42]">{DEMO_TITLE}</p>
        {state.expectedShippingDate && (
          <p className="text-body-strong text-text-default">
            예상 발송일 {formatShippingDate(state.expectedShippingDate)}
          </p>
        )}
      </div>

      <ul className="mt-3 flex flex-col">
        {fulfillmentStages.map(({ value, label }) => {
          const stage = state.stages[value];
          const filled = stage.status !== "todo";
          const isOpen = open[value];
          const badge = statusBadge[stage.status];
          const panelId = `fulfillment-stage-${value}`;

          return (
            <li key={value} className="bg-layer-surface-default border-border-default border-b">
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
                    className={`size-4 ${filled ? "text-text-inverse" : "text-text-default"}`}
                  />
                </span>
                <span className="text-body-strong text-text-default flex-1">{label}</span>
                {badge && (
                  <Badge
                    shape="rounded"
                    variant="neutral"
                    className={
                      stage.status === "active"
                        ? "bg-layer-surface-primary! text-text-inverse! shrink-0"
                        : "shrink-0 bg-[#eeeef0]! text-[#53545c]!"
                    }
                  >
                    {badge}
                  </Badge>
                )}
                <span className="flex size-[22px] shrink-0 items-center justify-center">
                  <Image
                    src="/images/fulfillment/arrow-down.svg"
                    width={14}
                    height={14}
                    alt=""
                    className={`text-text-secondary size-3.5 shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              <div
                id={panelId}
                hidden={!isOpen}
                className="-mt-1.5 flex flex-col gap-2.5 px-4 pb-4"
              >
                {isOpen &&
                  (stage.status === "todo" ? (
                    <p className="text-body-s text-text-secondary leading-[1.42] font-medium">
                      예상 시작일 {stage.startDate ? formatShippingDate(stage.startDate) : "미정"}
                    </p>
                  ) : (
                    <>
                      {(stage.startDate || stage.expectedEndDate) && (
                        <p className="text-body-s text-text-secondary leading-[1.42] font-medium">
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
                      <BuyerTimeline
                        records={stage.records}
                        onSelectMedia={setPreview}
                        showLatestBadge={stage.status === "active"}
                      />
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
