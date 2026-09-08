"use client";

import Link from "next/link";
import { useState } from "react";
import {
  daysSinceLastRecord,
  demoFulfillmentState,
  fulfillmentStages,
  initialStage,
  stageLabel,
  isStale,
  todayValue,
} from "../model/fulfillment-demo";
import type { FulfillmentStage, FulfillmentState, MediaItem } from "../model/fulfillment-demo";
import { DelayReasonModal } from "./delay-reason-modal";
import { MediaLightbox } from "./media-lightbox";
import { RecordComposer } from "./record-composer";
import { StageStepper } from "./stage-stepper";
import { StageTimeline } from "./stage-timeline";
import { StaleBanner } from "./stale-banner";

const breadcrumb = ["내 프로젝트", "제작 · 배송"];

type FulfillmentBoardProps = {
  /** `발송 정보` 링크를 만들 때만 쓴다. */
  projectId: string;
  /** Storybook에서 단계 상태를 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  initialState?: FulfillmentState;
  /** 정체 경고처럼 날짜에 기대는 상태를 고정 렌더하기 위한 자리. */
  today?: string;
};

/* ponytail: 저장 API가 없어(docs/OPEN_DECISIONS.md P1) 상태를 useState 목업으로만 들고 있다.
   새로고침하면 사라진다. 계약이 정해지면 이 훅 자리를 서버 상태로 바꾼다. */
export function FulfillmentBoard({
  projectId,
  initialState,
  today: fixedToday,
}: FulfillmentBoardProps) {
  /* 오늘 날짜는 렌더마다 바뀌면 안 되고 화면 수명 동안 고정이면 충분하다. */
  const [today] = useState(() => fixedToday ?? todayValue());
  const [state, setState] = useState<FulfillmentState>(
    () => initialState ?? demoFulfillmentState(today),
  );
  const [selected, setSelected] = useState<FulfillmentStage>(() => initialStage(state));
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [delayOpen, setDelayOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const stage = state[selected];
  const staleDays = isStale(stage, today) ? daysSinceLastRecord(stage.records, today) : null;

  function completeStage() {
    const stages = fulfillmentStages.map((item) => item.value);
    const next = stages[stages.indexOf(selected) + 1];

    setState((current) => ({
      ...current,
      [selected]: { ...current[selected], status: "done" },
      ...(next ? { [next]: { ...current[next], status: "active" as const } } : null),
    }));
    if (next) setSelected(next);
    setNotice(`${stageLabel(selected)} 단계를 완료했어요.`);
  }

  return (
    <div className="min-w-0 flex-1">
      <nav aria-label="이동 경로" className="text-label-m text-text-secondary">
        <ol className="flex items-center gap-2">
          {breadcrumb.map((crumb, index) => (
            <li key={crumb} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>{">"}</span>}
              <span
                aria-current={index === breadcrumb.length - 1 ? "page" : undefined}
                className={index === breadcrumb.length - 1 ? "text-text-default" : undefined}
              >
                {crumb}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-l">제작 · 배송</h1>
        {/* ponytail: Figma의 트럭 아이콘 asset이 public/icons에 없어 라벨만 둔다.
            아이콘이 들어오면 Icon으로 앞에 붙인다. */}
        <Link
          className="text-title-s bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary flex h-[46px] shrink-0 items-center justify-center rounded-xs px-6 font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/seller/projects/${projectId}/shipping`}
        >
          발송 정보
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <StageStepper state={state} selected={selected} onSelect={setSelected} />

        <section
          aria-label={`${stageLabel(selected)} 단계 진행 내용`}
          className="border-w-xs border-border-default bg-layer-surface-default overflow-hidden rounded-xs"
        >
          <div className="bg-layer-surface-disabled flex flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-title-s text-text-default">{stageLabel(selected)}</h2>
            {/* 헤더가 이미 disabled 면이라 secondaryButtonClasses를 그대로 쓰면 버튼이 배경에 묻는다.
                Figma처럼 흰 면 + 테두리로 띄운다. */}
            <button
              className="border-w-xs border-border-default bg-layer-surface-default text-body-s text-text-default enabled:hover:bg-layer-surface-disabled-hover focus-visible:outline-border-primary disabled:text-text-disabled flex h-9 shrink-0 items-center justify-center rounded-xs px-4 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
              disabled={stage.status === "done"}
              onClick={completeStage}
              type="button"
            >
              {stage.status === "done" ? "완료된 단계" : "이 단계 완료"}
            </button>
          </div>

          {staleDays !== null && <StaleBanner days={staleDays} />}

          <div className="border-border-default border-b p-6">
            <StageTimeline records={stage.records} onSelectMedia={setPreview} />
          </div>

          <RecordComposer
            key={selected}
            onOpenDelay={() => setDelayOpen(true)}
            onPreviewMedia={setPreview}
            onSubmit={({ date, text, media }) => {
              setState((current) => ({
                ...current,
                [selected]: {
                  ...current[selected],
                  records: [
                    ...current[selected].records,
                    { id: crypto.randomUUID(), date, text, media },
                  ],
                },
              }));
              setNotice("진행 내용을 등록했어요.");
            }}
          />
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>

      <DelayReasonModal
        open={delayOpen}
        onBack={() => setDelayOpen(false)}
        onClose={() => setDelayOpen(false)}
        onSkip={() => setDelayOpen(false)}
        onSave={({ reason }) => {
          /* ponytail: 지연 사유 저장 API가 없어 알림 발송도 목업이다. 계약이 생기면 여기서 보낸다. */
          setDelayOpen(false);
          setNotice(reason ? `지연 사유 "${reason}"를 등록했어요.` : "지연 사유를 등록했어요.");
        }}
      />

      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
