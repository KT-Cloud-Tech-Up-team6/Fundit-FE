"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Icon } from "@/shared/components/ui/icon";
import { Toast } from "@/shared/components/ui/toast";
import {
  completeStage,
  daysSinceLastRecord,
  demoFulfillmentState,
  fulfillmentStages,
  initialStage,
  stageLabel,
  isStale,
  todayValue,
} from "../model/fulfillment-demo";
import type {
  FulfillmentRecord,
  FulfillmentStage,
  FulfillmentState,
  MediaItem,
} from "../model/fulfillment-demo";
import { DelayReasonModal } from "./delay-reason-modal";
import { MediaLightbox } from "./media-lightbox";
import { RecordComposer } from "./record-composer";
import { StageTabs } from "./stage-tabs";
import { StageTimeline } from "./stage-timeline";
import { StaleBanner } from "./stale-banner";

/* 사이드바 탭 라벨(project-sidebar.tsx)·다른 breadcrumb(shipping-board.tsx)과 표기를 맞춘다.
   Figma는 이 프레임에서만 공백 없이 "제작·배송"이라 썼지만, 같은 화면에 나란히 보이는
   사이드바 항목은 "제작 · 배송"이라 그대로 따르면 같은 화면 안에서 표기가 갈린다. */
const breadcrumb = ["내 프로젝트", "제작 · 배송"];

/** Figma 잠긴 단계 안내(1319:40983, empty_state) 그래픽. 데스크톱 792px 컨테이너 전용이다. */
const lockedGraphic = (
  // eslint-disable-next-line @next/next/no-img-element -- 장식 일러스트, 최적화 대상 아님
  <img alt="" className="mx-auto size-28" src="/images/fulfillment/stage-locked.svg" />
);

/**
 * Figma "button"(1319:40817 / 1319:40735) — 14px Medium. shared Button의 cta 사이즈는
 * 16px SemiBold만 지원해 이 크기 조합만 직접 그린다. disabled 배경은 Button과 같은
 * layer-surface-primary-disabled를 쓴다(Figma 원본 hex #cdced4 대신 이 토큰이 실측값,
 * globals.css의 "Figma Button/primary_disabled 실측값은 charcoal-200이다" 주석 참고).
 */
const stageActionButtonClasses =
  "bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover disabled:bg-layer-surface-primary-disabled disabled:text-text-disabled disabled:cursor-not-allowed focus-visible:outline-border-primary flex h-10 shrink-0 items-center justify-center rounded-xs px-4 text-body-s font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";

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
  const [editing, setEditing] = useState<FulfillmentRecord | null>(null);
  const [notice, setNotice] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  /* Figma "과정이 등록되었다는 토스트가 뜨고 사라집니다"(interaction_spec 1319:40700). */
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const stage = state[selected];
  const staleDays = isStale(stage, today) ? daysSinceLastRecord(stage.records, today) : null;
  const selectedIndex = fulfillmentStages.findIndex((item) => item.value === selected);
  const previousLabel =
    selectedIndex > 0 ? fulfillmentStages[selectedIndex - 1].label : stageLabel(selected);

  /* 수정 대상은 선택한 단계의 기록이다. 단계가 바뀌면 다른 단계의 records에서
     그 id를 찾다가 아무것도 못 고치고 입력만 날아가므로 같이 버린다. */
  function selectStage(next: FulfillmentStage) {
    setSelected(next);
    setEditing(null);
  }

  function notify(message: string) {
    setNotice(message);
    setToast(message);
  }

  function handleComplete() {
    const nextState = completeStage(state, selected);
    if (nextState === state) return;

    const stages = fulfillmentStages.map((item) => item.value);
    const next = stages[stages.indexOf(selected) + 1];

    setState(nextState);
    setEditing(null);
    if (next && nextState[next].status === "active") setSelected(next);
    notify(`${stageLabel(selected)} 단계를 완료했어요.`);
  }

  return (
    /* Figma page_main_container(1319:40716 등, 22개 프레임 전부)는 792px 고정폭이다.
       flex-1만 두면 남는 공간만큼 계속 늘어나 넓은 화면에서 카드가 지나치게 넓어진다. */
    <div className="max-w-[792px] min-w-0 flex-1">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-l">제작·배송</h1>
        <Link
          className="bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary text-body-s flex h-10 w-[180px] shrink-0 items-center justify-center gap-1 rounded-xs font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/seller/projects/${projectId}/shipping`}
        >
          발송 정보
          <Icon className="size-5" name="transferVan" />
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <StageTabs onSelect={selectStage} selected={selected} state={state} />

        <section
          aria-label={`${stageLabel(selected)} 단계 진행 내용`}
          className="border-w-xs border-border-default overflow-hidden rounded-xs"
        >
          <div className="bg-layer-bg flex h-[61px] items-center justify-between gap-2 px-4">
            <div className="flex items-center gap-2">
              <h2 className="text-body-strong text-text-default">{stageLabel(selected)}</h2>
              <p className="text-caption-s text-text-default">기록 {stage.records.length} 건</p>
            </div>
            {stage.status === "active" && (
              <button className={stageActionButtonClasses} onClick={handleComplete} type="button">
                단계 완료 처리
              </button>
            )}
            {stage.status === "done" && (
              <button className={stageActionButtonClasses} disabled type="button">
                단계 완료
              </button>
            )}
          </div>

          {staleDays !== null && <StaleBanner days={staleDays} />}

          {stage.status === "todo" ? (
            <div className="bg-layer-surface-default flex h-[380px] items-center justify-center p-4">
              <EmptyState
                className="w-[390px]"
                graphic={lockedGraphic}
                message={`${previousLabel} 완료 후 업데이트 할 수 있습니다`}
              />
            </div>
          ) : (
            <>
              <div className="bg-layer-surface-default p-4">
                <StageTimeline
                  /* 완료된 단계에는 작성영역이 없어 수정해도 반영할 곳이 없다. */
                  onEditRecord={stage.status === "active" ? setEditing : undefined}
                  onSelectMedia={setPreview}
                  records={stage.records}
                />
              </div>

              {stage.status === "active" ? (
                <div className="bg-layer-surface-default border-border-default border-t">
                  <RecordComposer
                    initialDate={editing?.date}
                    initialMedia={editing?.media}
                    initialText={editing?.text}
                    key={editing?.id ?? selected}
                    onOpenDelay={() => setDelayOpen(true)}
                    onPreviewMedia={setPreview}
                    onSubmit={({ date, text, media }) => {
                      setState((current) => ({
                        ...current,
                        [selected]: {
                          ...current[selected],
                          records: editing
                            ? current[selected].records.map((record) =>
                                record.id === editing.id
                                  ? { ...record, date, text, media, edited: true }
                                  : record,
                              )
                            : [
                                ...current[selected].records,
                                { id: crypto.randomUUID(), date, text, media },
                              ],
                        },
                      }));
                      setEditing(null);
                      notify(editing ? "진행 내용을 수정했어요." : "진행 내용을 등록했어요.");
                    }}
                  />
                </div>
              ) : (
                <div className="bg-layer-surface-disabled border-border-default flex h-[49px] items-center border-t px-4">
                  <p className="text-body-emphasis text-text-disabled">
                    {stageLabel(selected)} 단계는 완료 되었습니다
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <p aria-live="polite" className="sr-only">
        {notice}
      </p>
      {toast && <Toast className="fixed top-16 left-1/2 z-50 -translate-x-1/2">{toast}</Toast>}

      <DelayReasonModal
        onClose={() => setDelayOpen(false)}
        onSave={({ reason }) => {
          /* ponytail: 지연 사유 저장 API가 없어 알림 발송도 목업이다. 계약이 생기면 여기서 보낸다. */
          setDelayOpen(false);
          notify(reason ? `지연 사유 "${reason}"를 등록했어요.` : "지연 사유를 등록했어요.");
        }}
        onSkip={() => setDelayOpen(false)}
        open={delayOpen}
      />

      <MediaLightbox media={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
