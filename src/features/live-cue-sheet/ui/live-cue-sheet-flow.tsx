"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import {
  createDemoScenes,
  demoAnswers,
  demoProject,
  demoQuestions,
  type CueScene,
  type CueSheetType,
  type CueSheetProject,
  type SavedCueSheet,
} from "../model/cue-sheet-demo";
import { CueSheetEditor } from "./cue-sheet-editor";
import styles from "./cue-sheet.module.css";

type Step =
  "closed" | "chat" | "summary" | "options" | "generating" | "ready" | "editor" | "failed";

/**
 * 서버가 아는 큐시트 상태. `onGenerate`와 함께 주면 이 화면은 **API 모드**로 동작한다 —
 * 생성은 서버가 하고, 생성 중·성공·실패 단계 전환은 이 값이 끈다.
 */
export type CueSheetGenerationView = {
  phase: "idle" | "generating" | "completed" | "failed";
  scenes: CueScene[];
  type: CueSheetType | null;
  minutes: number | null;
  failureReason: string | null;
};

type LiveCueSheetFlowProps = {
  liveId?: string;
  project?: CueSheetProject;
  onClose?: () => void;
  onSave?: (saved: SavedCueSheet) => void;
  initialStep?: Step;
  initialAnswers?: string[];
  initialType?: CueSheetType;
  initialMinutes?: number;
  initialSavedCueSheet?: SavedCueSheet;
  autoAdvanceGeneration?: boolean;
  generation?: CueSheetGenerationView;
  /** 주면 API 모드다. 데모 장면을 만들지 않고 서버에 생성을 요청한다. */
  onGenerate?: (request: { type: CueSheetType; minutes: number }) => void;
  saving?: boolean;
  /** 저장·생성 결과처럼 화면 밖에서 온 안내. 내부 안내보다 우선한다. */
  notice?: string;
};

function ProjectInfo({ project }: { project: CueSheetProject }) {
  return (
    <div className="border-border-default rounded-xs border p-4 md:h-[468px]">
      {project.image ? (
        <Image
          src={project.image}
          alt=""
          width={162}
          height={122}
          className="mb-4 aspect-[4/3] w-full rounded-xs object-cover max-md:hidden"
        />
      ) : (
        <div className="bg-layer-bg text-caption-s text-text-secondary mb-4 flex aspect-[4/3] w-full items-center justify-center rounded-xs max-md:hidden">
          이미지 없음
        </div>
      )}
      {/* 값이 없으면 지어내지 않고 자리만 남긴 채 없다고 적는다. */}
      <div className="min-w-0">
        <h4 className="text-body-strong">{project.title}</h4>
        <div className="text-caption-s text-text-secondary flex flex-col gap-1">
          <span>{project.category || "카테고리 정보 없음"}</span>
          <span>{project.period || "기간 정보 없음"}</span>
          <span className="flex items-center gap-1">
            <Icon name="people" className="size-3.5" />
            {project.participantCount === null
              ? "참여자 정보 없음"
              : `${project.participantCount}명`}
          </span>
        </div>
        <p className="text-title-s mt-2">
          {project.currentAmount === null
            ? "모금액 정보 없음"
            : `${project.currentAmount.toLocaleString("ko-KR")}원`}
        </p>
        <p className="text-body-s text-text-secondary">
          {project.goalAmount === null
            ? "목표액 정보 없음"
            : `/ ${project.goalAmount.toLocaleString("ko-KR")}원`}
        </p>
      </div>
    </div>
  );
}

export function LiveCueSheetFlow({
  liveId = "demo-live",
  project = demoProject,
  onClose,
  onSave,
  initialStep = "chat",
  initialAnswers = [],
  initialType,
  initialMinutes,
  initialSavedCueSheet,
  autoAdvanceGeneration = true,
  generation,
  onGenerate,
  saving = false,
  notice: externalNotice = "",
}: LiveCueSheetFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [answers, setAnswers] = useState(initialSavedCueSheet?.answers ?? initialAnswers);
  const [draft, setDraft] = useState("");
  const [type, setType] = useState<CueSheetType | null>(
    initialType ?? initialSavedCueSheet?.type ?? (initialStep === "editor" ? "script" : null),
  );
  const [minutes, setMinutes] = useState(
    initialMinutes ?? initialSavedCueSheet?.minutes ?? (initialStep === "editor" ? 10 : 0),
  );
  const [scenes, setScenes] = useState<CueScene[]>(() =>
    initialSavedCueSheet
      ? initialSavedCueSheet.scenes.map((scene) => ({ ...scene }))
      : createDemoScenes(
          minutes || 10,
          initialAnswers.length ? initialAnswers : project === demoProject ? demoAnswers : [],
          project,
        ),
  );
  const [saved, setSaved] = useState<SavedCueSheet | null>(initialSavedCueSheet ?? null);
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDListElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const open = step !== "closed";
  const complete = answers.length === demoQuestions.length;
  const apiMode = Boolean(onGenerate);
  const message = externalNotice || notice;
  /* 서버 상태가 "바뀐 순간"에만 단계를 옮긴다. 매 렌더마다 옮기면 판매자가 편집기에서
     뒤로 간 직후 다시 편집기로 끌려온다. */
  const [appliedPhase, setAppliedPhase] = useState(generation?.phase ?? null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const openButton = openButtonRef.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) {
      dialog.close();
      openButton?.focus();
    }
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previous;
      openButton?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (open && step !== "editor") headingRef.current?.focus();
  }, [step, open]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [answers, step]);

  /* API 모드의 단계 전환. 폴링이 GENERATING → COMPLETED/FAILED를 알려주면 여기서 받는다.
     렌더 중에 맞추는 이유는 React 문서의 "prop이 바뀔 때 state 조정"과 같다 — effect로
     하면 생성 화면이 한 번 그려진 뒤에야 편집기로 바뀐다.
     COMPLETED여도 구간이 비어 있으면 toCueSheetState가 failed로 넘겨 주므로
     빈 편집기가 열리는 일은 없다. */
  if (generation && generation.phase !== appliedPhase) {
    const previous = appliedPhase;
    setAppliedPhase(generation.phase);
    if (generation.phase === "generating") setStep("generating");
    /* 생성을 기다리던 중일 때만 화면을 뺏는다. 판매자가 채팅·요약을 다시 보고 있는데
       뒤늦게 도착한 결과가 편집기를 열어버리면 안 된다. */
    else if (previous === "generating") {
      if (generation.phase === "completed" && generation.scenes.length) {
        setScenes(generation.scenes.map((scene) => ({ ...scene })));
        if (generation.type) setType(generation.type);
        if (generation.minutes) setMinutes(generation.minutes);
        setStep("editor");
      }
      if (generation.phase === "failed") setStep("failed");
    }
  }

  useEffect(() => {
    if (!autoAdvanceGeneration || (step !== "generating" && step !== "ready")) return;
    const timer = window.setTimeout(
      () => setStep(step === "generating" ? "ready" : "editor"),
      step === "generating" ? 1600 : 900,
    );
    return () => window.clearTimeout(timer);
  }, [step, autoAdvanceGeneration]);

  function answerQuestion() {
    if (!draft.trim()) return;
    if (complete) {
      setAnswers(
        answers.map((answer, index) =>
          index === answers.length - 1 ? `${answer}\n정정 사항: ${draft.trim()}` : answer,
        ),
      );
    } else {
      setAnswers([...answers, draft.trim()]);
    }
    setDraft("");
  }

  function generate() {
    if (!type || minutes < 1 || minutes > 10) return;
    if (onGenerate) {
      /* 서버가 GENERATING을 확인해 줄 때까지 기다리지 않고 먼저 생성 화면으로 넘긴다 —
         요청이 거절되면 컨테이너가 notice로 사유를 준다. */
      setStep("generating");
      setNotice("");
      onGenerate({ type, minutes });
      return;
    }
    setScenes(createDemoScenes(minutes, answers, project));
    setStep("generating");
  }

  function loadSaved() {
    if (!saved) {
      setNotice("아직 저장된 큐시트가 없습니다.");
      return;
    }
    setScenes(saved.scenes.map((scene) => ({ ...scene })));
    setType(saved.type);
    setMinutes(saved.minutes);
    setAnswers(saved.answers ?? initialAnswers);
    setNotice("");
    setStep("editor");
  }

  function close() {
    setStep("closed");
    onClose?.();
  }

  function save() {
    const next: SavedCueSheet = {
      scenes: scenes.map((scene) => ({ ...scene })),
      type: type ?? "script",
      minutes,
      answers: [...answers],
    };
    setSaved(next);
    if (apiMode) {
      /* 서버 저장 결과를 모른 채 닫지 않는다. 성공·실패 안내는 컨테이너가 notice로 준다. */
      setNotice("");
      onSave?.(next);
      return;
    }
    setNotice("큐시트를 목업으로 저장했습니다. 새로고침 시 초기화됩니다.");
    setStep("closed");
    onSave?.(next);
  }

  return (
    <>
      {!onClose && (
        <section className="space-y-4 py-9">
          <h1 className="text-heading-s">AI 큐시트</h1>
          <p className="text-body-s">
            {apiMode
              ? `LIVE ${liveId}`
              : `목업 큐시트 · ${liveId} · 실제 AI 생성 및 서버 저장은 하지 않습니다.`}
          </p>
          <Link href="/seller/live" className="text-body-s underline">
            LIVE 스튜디오로 돌아가기
          </Link>
          <Button ref={openButtonRef} onClick={() => (saved ? loadSaved() : setStep("chat"))}>
            큐시트 열기
          </Button>
          <p role="status" className="text-body-s">
            {message}
          </p>
        </section>
      )}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="cue-sheet-title"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div
          className={`${styles.frame} ${
            step === "generating" || step === "ready" || step === "failed" ? styles.loading : ""
          }`}
        >
          <header className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2">
            <span />
            <h2
              id="cue-sheet-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-heading-m text-center outline-none"
            >
              AI 큐시트 생성
            </h2>
            <button
              type="button"
              aria-label="닫기"
              className="flex size-9 items-center justify-center rounded-xs"
              onClick={() => close()}
            >
              <Icon name="close" className="size-5" />
            </button>
          </header>

          {step === "generating" || step === "ready" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[540px] flex-col items-center justify-center gap-10"
            >
              <div className="flex flex-col items-center gap-3">
                <h3 className="text-title-s text-center">AI가 큐시트를 생성중이에요...</h3>
                {/* 원본(FL_S_LVS_AIC)에는 제목과 로고뿐이라 문구 자리가 없다. 다만 실제
                    생성이 평균 1분 26초·최대 2분 남짓 걸려 안내 없이는 멈춘 화면으로 보인다. */}
                <p className="text-body-s text-text-secondary text-center">
                  보통 1분 30초, 길게는 2분 정도 걸려요
                </p>
              </div>
              <div className="bg-layer-surface-default flex size-40 items-center justify-center rounded-full">
                <Image
                  src="/images/seller-live/loading-logo.svg"
                  alt=""
                  width={144}
                  height={121}
                  className={styles.loadingLogo}
                />
              </div>
            </div>
          ) : step === "failed" ? (
            /* FL_S_LVS_AIC_FAIL — 원본에 실패 화면이 없어 새로 부여한 화면 ID다.
               생성 중 화면(FL_S_LVS_AIC)과 같은 자리·배경을 쓰고 사유와 재시도만 둔다 —
               생성 중·성공과 구분되지 않으면 판매자가 기다리기만 하게 된다(#289 필수 계약 2). */
            <div
              role="alert"
              className="flex min-h-[540px] flex-col items-center justify-center gap-6 px-6 text-center"
            >
              <h3 className="text-title-s">AI 큐시트를 만들지 못했어요</h3>
              <p className="text-body-s text-text-secondary max-w-md break-words">
                {generation?.failureReason || "잠시 후 다시 시도해 주세요."}
              </p>
              {/* 직전 조건(유형·길이)이 남아 있으면 그대로 다시 요청한다. 유형을 고르려고
                  돌아가는 건 실패했을 때 사용자가 원하는 동작이 아니다. 조건이 비어 있을
                  때만 선택 화면으로 보낸다. */}
              <Button
                size="md"
                className="text-body-s! h-10! w-36"
                onClick={() => (type && minutes >= 1 ? generate() : setStep("options"))}
              >
                다시 시도
              </Button>
            </div>
          ) : step === "editor" ? (
            <CueSheetEditor
              scenes={scenes}
              type={type ?? "script"}
              saving={saving}
              notice={message}
              onChange={setScenes}
              onBack={() => setStep("options")}
              onRegenerate={generate}
              onSave={save}
            />
          ) : (
            step !== "closed" && (
              <div className={styles.body}>
                <aside>
                  <h3 className="text-body-strong mb-2">프로젝트 정보</h3>
                  <ProjectInfo project={project} />
                </aside>
                <section className="min-w-0">
                  <h3 className="text-body-strong mb-2">
                    {step === "chat"
                      ? "AI에게 추가 정보를 알려주세요"
                      : step === "summary"
                        ? "요약된 내용을 확인해주세요"
                        : "큐시트 유형과 방송 시간을 선택해주세요"}
                  </h3>
                  {step === "chat" ? (
                    <div className={`${styles.panel} bg-layer-bg flex flex-col p-4`}>
                      <div
                        ref={chatRef}
                        role="log"
                        aria-label="AI 추가 질문"
                        className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-4"
                      >
                        {demoQuestions
                          .slice(0, Math.min(answers.length + 1, demoQuestions.length))
                          .map((question, index) => (
                            <div key={question.label} className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Image
                                  src="/icons/funding-story/avatar.svg"
                                  alt=""
                                  width={28}
                                  height={32}
                                  className="h-8 w-7 shrink-0"
                                />
                                <div className="max-w-[85%]">
                                  <div className="bg-layer-surface-default border-border-default text-body-s rounded-[16px] rounded-tl-none border p-4">
                                    <p>{question.question}</p>
                                    <p className="text-caption-s text-text-secondary mt-1 text-right">
                                      {index + 1}/5
                                    </p>
                                  </div>
                                  {index === answers.length && index > 0 && (
                                    <button
                                      type="button"
                                      className="border-border-default text-caption-s text-text-secondary mt-2 rounded-full border px-2 py-1"
                                      onClick={() => {
                                        setAnswers([...answers, ""]);
                                        setDraft("");
                                      }}
                                    >
                                      건너뛰기
                                    </button>
                                  )}
                                </div>
                              </div>
                              {index < answers.length && (
                                <p className="bg-layer-surface-primary text-text-inverse text-body-s ml-auto w-fit max-w-[85%] rounded-[16px] rounded-br-none p-4 whitespace-pre-wrap">
                                  {answers[index] || "건너뛰었습니다."}
                                </p>
                              )}
                            </div>
                          ))}
                        {complete && (
                          <p className="bg-layer-surface-default border-border-default text-body-s rounded-[16px] rounded-tl-none border p-4">
                            필수 항목 입력을 완료했어요. 다음으로 이동하거나 정정할 내용을
                            입력해주세요.
                          </p>
                        )}
                      </div>
                      <form
                        className="mt-3 flex gap-2"
                        onSubmit={(event) => {
                          event.preventDefault();
                          answerQuestion();
                        }}
                      >
                        <input
                          aria-label="AI에게 답변"
                          className="bg-layer-surface-default border-border-default text-body-s min-w-0 flex-1 rounded-full border px-4 py-3"
                          placeholder={
                            complete ? "정정할 내용을 작성해주세요" : "답변을 작성해주세요"
                          }
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && event.nativeEvent.isComposing)
                              event.preventDefault();
                          }}
                        />
                        <button
                          type="submit"
                          aria-label="답변 보내기"
                          disabled={!draft.trim()}
                          className="bg-layer-surface-primary text-text-inverse disabled:bg-border-default flex size-11 shrink-0 items-center justify-center rounded-full"
                        >
                          <Icon name="send" className="size-5" />
                        </button>
                      </form>
                    </div>
                  ) : step === "summary" ? (
                    <div className={`${styles.panel} relative flex flex-col p-4`}>
                      <p className="text-caption-s mb-4">
                        다음 정보로 큐시트가 생성돼요. 틀린 부분이 있으면 뒤로가기를 눌러 채팅으로
                        정정해 주세요.
                      </p>
                      <dl
                        ref={summaryRef}
                        className="bg-layer-bg min-h-0 flex-1 overflow-y-auto p-3"
                      >
                        {[
                          ["제품명", project.title],
                          ["카테고리", project.category],
                          ...demoQuestions.map((question, index) => [
                            question.label,
                            answers[index] || "입력하지 않음",
                          ]),
                          ["스펙", project.description],
                          ["리워드", project.reward || "입력하지 않음"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="border-border-default text-caption-s grid grid-cols-[80px_minmax(0,1fr)] gap-3 border-b py-3"
                          >
                            <dt className="font-semibold">{label}</dt>
                            <dd className="whitespace-pre-wrap">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      <button
                        type="button"
                        aria-label="요약 끝으로 이동"
                        className="bg-border-default absolute bottom-5 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full"
                        onClick={() =>
                          summaryRef.current?.scrollTo({
                            top: summaryRef.current.scrollHeight,
                            behavior: "smooth",
                          })
                        }
                      >
                        <span
                          aria-hidden
                          className="size-4 bg-current [mask-image:url('/images/live-cue-sheet/down.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                        />
                      </button>
                    </div>
                  ) : (
                    <div className={`${styles.panel} flex flex-col gap-6 p-4`}>
                      <fieldset className="grid min-h-0 flex-1 grid-cols-2 gap-3">
                        <legend className="sr-only">큐시트 유형</legend>
                        {(["scenario", "script"] as const).map((value) => (
                          <label
                            key={value}
                            className={`cursor-pointer overflow-y-auto rounded-xs border p-4 ${type === value ? "border-border-primary-live bg-layer-surface-primary-live/5" : "bg-layer-bg border-transparent"}`}
                          >
                            <span className="text-body-s flex items-center justify-between gap-2 font-medium">
                              {value === "scenario" ? "시나리오" : "대사 완성"}
                              <input
                                type="radio"
                                name="cue-type"
                                value={value}
                                checked={type === value}
                                onChange={() => setType(value)}
                                className="accent-layer-surface-primary size-4 shrink-0"
                              />
                            </span>
                            <div className="text-body-s mt-2 space-y-4">
                              <p>예시)</p>
                              <p className="pt-2 underline">오프닝</p>
                              {value === "scenario" ? (
                                <>
                                  <p>인사와 오늘 방송에서 다룰 내용 안내</p>
                                  <p>제품명과 오늘 방송의 핵심 한 줄 소개</p>
                                  <p>방송이 10분 진행된다는 점 안내</p>
                                  <p>상품 시연</p>
                                </>
                              ) : (
                                <>
                                  <p>
                                    “안녕하세요, 오늘은 무선 청소기 V3를 소개해 드리려고 합니다.”
                                  </p>
                                  <p>
                                    “무게를 줄이면서도 흡입력은 그대로 유지한 제품인데요, 어떻게
                                    만들었는지부터 보여드릴게요.”
                                  </p>
                                </>
                              )}
                            </div>
                          </label>
                        ))}
                      </fieldset>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <label htmlFor="cue-minutes" className="text-body-m">
                            방송 시간 설정
                          </label>
                          <p id="cue-minutes-help" className="text-caption-s">
                            최대 10분 분량의 큐시트 제공이 가능합니다
                          </p>
                        </div>
                        <div className="bg-layer-surface-disabled flex items-center rounded-xs px-3">
                          <input
                            id="cue-minutes"
                            aria-describedby="cue-minutes-help"
                            type="number"
                            min={1}
                            max={10}
                            step={1}
                            value={minutes}
                            className="h-10 w-16 text-center"
                            onChange={(event) =>
                              setMinutes(
                                Math.max(0, Math.min(10, Math.floor(Number(event.target.value)))),
                              )
                            }
                          />
                          <span>분</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-5 flex justify-between gap-4">
                    <button
                      type="button"
                      className={`${styles.secondary} w-36`}
                      onClick={
                        step === "chat"
                          ? loadSaved
                          : () => setStep(step === "summary" ? "chat" : "summary")
                      }
                    >
                      {step === "chat" ? "큐시트 불러오기" : "뒤로가기"}
                    </button>
                    <Button
                      size="md"
                      variant={
                        step === "options" && type && minutes > 0 ? "primaryLive" : "primary"
                      }
                      className="text-body-s! h-10! w-36"
                      disabled={
                        step === "chat"
                          ? !complete
                          : step === "options"
                            ? !type || minutes < 1
                            : false
                      }
                      onClick={
                        step === "options"
                          ? generate
                          : () => {
                              setNotice("");
                              setStep(step === "chat" ? "summary" : "options");
                            }
                      }
                    >
                      {step === "options" ? "큐시트 생성하기" : "다음으로"}
                    </Button>
                  </div>
                  <p role="status" className="sr-only">
                    {message}
                  </p>
                </section>
              </div>
            )
          )}
        </div>
      </dialog>
    </>
  );
}
