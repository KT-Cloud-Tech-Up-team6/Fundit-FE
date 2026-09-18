"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Icon, type IconName } from "@/shared/components/ui/icon";
import { demoFundingDetail } from "@/features/funding-history/model/funding-history";
import {
  demoBuyerFulfillmentState,
  formatShippingDate,
  fulfillmentStages,
  initialStage,
  stageLabel,
  type BuyerFulfillmentState,
  type FulfillmentStage,
  type MediaItem,
  type StageStatus,
} from "../model/fulfillment-demo";
import { BuyerTimeline } from "./buyer-timeline";
import { BuyerStageStepper } from "./buyer-stage-stepper";
import { MediaLightbox } from "./media-lightbox";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";

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

type BuyerFulfillmentHistoryProps = {
  fundingId: string;
  initialState?: BuyerFulfillmentState;
};

export function BuyerFulfillmentHistory({ fundingId, initialState }: BuyerFulfillmentHistoryProps) {
  const product = demoFundingDetail(fundingId);
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

  const [desktopOpen, setDesktopOpen] = useState<Record<FulfillmentStage, boolean>>(() =>
    fulfillmentStages.reduce(
      (opened, { value }) => ({ ...opened, [value]: state.stages[value].status !== "todo" }),
      {} as Record<FulfillmentStage, boolean>,
    ),
  );
  const currentStageKey = initialStage(state.stages);
  const currentStage = state.stages[currentStageKey];
  const currentLabel = stageLabel(currentStageKey);
  const desktopStages = [
    currentStageKey,
    ...fulfillmentStages
      .map(({ value }) => value)
      .filter((value) => value !== currentStageKey && state.stages[value].status === "done")
      .reverse(),
  ];

  return (
    <>
      <BuyerDesktopHeader />
      <div
        data-layout="mobile"
        className="bg-layer-bg min-h-dvh w-full min-w-0 pb-[calc(32px+env(safe-area-inset-bottom))] min-[1200px]:hidden"
      >
        <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
          <Link
            href={`/my/fundings/${fundingId}/fulfillment`}
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

        <div className="bg-layer-surface-default flex flex-col gap-1 px-5 py-4">
          <p className="text-body-s text-text-default truncate leading-[1.42]">
            {product.projectTitle}
          </p>
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
      </div>
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
            <span aria-hidden>&gt;</span>
            <span>전체보기</span>
          </nav>
          <h1 className="text-heading-l text-text-title mt-1 py-2">제작·배송 현황</h1>
          <section>
            <p className="text-body-l text-text-default">
              {currentStage.status === "active" ? (
                <>
                  현재 <strong className="font-semibold">{currentLabel}</strong> 중 이에요
                </>
              ) : currentStage.status === "todo" ? (
                <>
                  <strong className="font-semibold">{currentLabel}</strong> 시작 전이에요
                </>
              ) : (
                <>제작·배송이 완료됐어요</>
              )}
            </p>
            <div className="mt-2">
              <BuyerStageStepper state={state.stages} showStatusBadge showExpectedStartTooltip />
            </div>
            <div className="mt-8">
              {currentStage.expectedEndDate && currentStage.status === "active" && (
                <p className="text-body-strong text-text-default">
                  {currentLabel} 완료 예정일 {formatShippingDate(currentStage.expectedEndDate)}
                </p>
              )}
              {currentStage.startDate && (
                <p className="text-body-s text-text-secondary font-medium">
                  {formatShippingDate(currentStage.startDate)} {currentLabel} 시작
                </p>
              )}
            </div>
          </section>
          <div className="mt-8 flex flex-col gap-4">
            {desktopStages.map((value) => {
              const label = fulfillmentStages.find((stage) => stage.value === value)!.label;
              const stage = state.stages[value];
              const expanded = desktopOpen[value];
              const badge = statusBadge[stage.status];
              const heading = value === "production" ? "제작" : label;
              const dates =
                stage.status === "done"
                  ? [stage.startDate, stage.expectedEndDate]
                      .filter((date): date is string => Boolean(date))
                      .map(formatShippingDate)
                      .join(" - ")
                  : stage.startDate
                    ? `${formatShippingDate(stage.startDate)} ${label} 시작`
                    : "예정 시작일 미정";
              return (
                <section
                  key={value}
                  className="border-border-default overflow-hidden rounded-xs border"
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={`desktop-fulfillment-stage-${value}`}
                    onClick={() =>
                      setDesktopOpen((previous) => ({ ...previous, [value]: !previous[value] }))
                    }
                    className="border-border-default flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-4 border-b px-3 py-3 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <h2 className="text-body-strong text-text-default shrink-0">{heading}</h2>
                      {badge && stage.status === "done" && (
                        <Badge shape="rounded" variant="info">
                          {badge}
                        </Badge>
                      )}
                      <p className="text-body-s text-text-secondary truncate">{dates}</p>
                    </div>
                    <span
                      className="flex size-[22px] shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      <Image
                        src="/images/fulfillment/arrow-down.svg"
                        width={14}
                        height={14}
                        alt=""
                        className={expanded ? "rotate-180" : ""}
                      />
                    </span>
                  </button>
                  {expanded && (
                    <div
                      id={`desktop-fulfillment-stage-${value}`}
                      className="bg-layer-bg px-6 py-4"
                    >
                      <BuyerTimeline
                        records={stage.records}
                        onSelectMedia={setPreview}
                        showLatestBadge={stage.status === "active"}
                        variant="desktop"
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </>
  );
}
