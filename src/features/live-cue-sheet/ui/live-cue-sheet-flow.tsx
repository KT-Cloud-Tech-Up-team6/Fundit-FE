"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { CUE_SHEET_BRIEF_MAX_LENGTH } from "@/entities/live/api/live-cue-sheet-api";
import {
  createDemoScenes,
  demoAnswers,
  demoProject,
  demoQuestions,
  isSkipIntent,
  type CueScene,
  type CueSheetType,
  type CueSheetProject,
  type SavedCueSheet,
} from "../model/cue-sheet-demo";
import { CueSheetEditor } from "./cue-sheet-editor";
import styles from "./cue-sheet.module.css";

type Step =
  "closed" | "chat" | "summary" | "options" | "generating" | "ready" | "editor" | "failed";

/** 다섯 답을 받은 뒤의 정정은 새 답이 아니라 골라둔 답(기본 마지막 답) 뒤에 이 머리말로 붙는다. */
const CORRECTION_PREFIX = "\n정정 사항: ";

/** 원본 FL_S_LVS_AISLT_1~3의 유형 카드. 설명·예시 문구는 원본 그대로다. */
const cueTypeOptions = [
  {
    value: "scenario",
    label: "시나리오",
    description: "시나리오: 진행 순서 + 구간별 주요 내용 + 예상 시간",
    examples: [
      "인사와 오늘 방송에서 다룰 내용 안내",
      "제품명과 오늘 방송의 핵심 한 줄 소개",
      "방송이 10분 진행된다는 점 안내",
      "상품 시연",
    ],
  },
  {
    value: "script",
    label: "대사 완성",
    description: "대사 완성: 시나리오 내용 포함 + 구간별 완성 대사 전문",
    examples: [
      '"안녕하세요, 오늘은 무선 청소기 V3를 소개해 드리려고 합니다."',
      '"무게를 줄이면서도 흡입력은 그대로 유지한 제품인데요, 어떻게 만들었는지부터 보여드릴게요."',
    ],
  },
] as const satisfies readonly {
  value: CueSheetType;
  label: string;
  description: string;
  examples: readonly string[];
}[];

/**
 * 서버가 아는 큐시트 상태. `onGenerate`와 함께 주면 이 화면은 **API 모드**로 동작한다 —
 * 생성은 서버가 하고, 생성 중·성공·실패 단계 전환은 이 값이 끈다.
 */
export type CueSheetGenerationView = {
  phase: "idle" | "generating" | "completed" | "failed";
  scenes: CueScene[];
  type: CueSheetType | null;
  minutes: number | null;
  /** FE가 정한 안내 문구. BE `failureReason` 원문은 싣지 않는다(#403). 없으면 기본 문구를 보인다. */
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
  /** 주면 API 모드다. 데모 장면을 만들지 않고 서버에 생성을 요청한다. `answers`는 질문 순서다. */
  onGenerate?: (request: { type: CueSheetType; minutes: number; answers: string[] }) => void;
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
      {/* 값이 없으면 지어내지 않고 자리만 남긴 채 없다고 적는다. 원본 카드는 기간 한 줄,
          카테고리·참여자 한 줄, 모금액·목표액 순서다. */}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-col gap-2">
          <h4 className="text-body-strong">{project.title}</h4>
          <div className="text-caption-s text-text-secondary flex flex-col gap-1">
            <span className="font-medium">{project.period || "기간 정보 없음"}</span>
            {/* "정보 없음" 문구는 길어 줄이 바뀌므로 구분점은 두 값이 다 있을 때만 둔다. */}
            <span className="flex flex-wrap items-center gap-1">
              {project.category || "카테고리 정보 없음"}
              {project.category && project.participantCount !== null && <span aria-hidden>·</span>}
              <span className="flex items-center gap-1">
                <Icon name="people" className="size-3.5" />
                {project.participantCount === null
                  ? "참여자 정보 없음"
                  : `${project.participantCount}명`}
              </span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-title-s">
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
  /* 정정 대상 — 완료 후 답변 말풍선을 탭해서 고른다. 안 고르면(null) 기존처럼
     마지막 답을 고친다(하위호환 기본값). */
  const [correctingIndex, setCorrectingIndex] = useState<number | null>(null);
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
  /* 정정 대상 인덱스 — 사용자가 답변 말풍선을 탭해서 고르면 그걸, 안 고르면 마지막 답. */
  const correctionTargetIndex = correctingIndex ?? answers.length - 1;
  /* 답 하나가 생성 요청 필드 하나다(BE `@Size(max = 1000)`). 정정은 대상 답에 붙어 함께
     나가므로 합친 길이가 한도를 넘지 않게 남은 만큼만 받는다 — 넘기면 재시도해도 같은 400이다. */
  const draftMaxLength = complete
    ? Math.max(
        0,
        CUE_SHEET_BRIEF_MAX_LENGTH -
          answers[correctionTargetIndex].length -
          CORRECTION_PREFIX.length,
      )
    : CUE_SHEET_BRIEF_MAX_LENGTH;
  const apiMode = Boolean(onGenerate);
  const message = externalNotice || notice;
  const optionsReady = Boolean(type) && minutes >= 1;
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
          index === correctionTargetIndex ? `${answer}${CORRECTION_PREFIX}${draft.trim()}` : answer,
        ),
      );
      setCorrectingIndex(null);
    } else if (isSkipIntent(draft)) {
      // 건너뛰기 버튼과 동일하게 처리 — "스킵할게요" 같은 문장이 그대로 답변으로 저장되지 않게.
      setAnswers([...answers, ""]);
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
      onGenerate({ type, minutes, answers: [...answers] });
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
            /* 원본 FL_S_LVS_AISLT_4(모달 1230:17313): 500px 내용 칸 가운데 456×286 상자에
               제목과 로고를 40px 간격으로 두고, 흰 원(160)은 로고 뒤에 따로 놓는다. */
            <div role="status" aria-live="polite" className="mt-6 flex h-[500px] justify-center">
              <div className="relative flex h-[286px] w-[456px] flex-col items-center gap-10 self-center px-4 pt-8">
                <span
                  aria-hidden
                  className="bg-layer-surface-default absolute top-[82.5px] left-[146.5px] size-40 rounded-full"
                />
                <h3 className="text-title-s relative text-center">AI가 큐시트를 생성중이에요...</h3>
                <Image
                  src="/images/seller-live/loading-logo.svg"
                  alt=""
                  width={144}
                  height={121}
                  className={`relative ${styles.loadingLogo}`}
                />
                {/* 원본에는 제목과 로고뿐이라 문구 자리가 없다. 다만 실제 생성이 평균 1분 26초·
                    최대 2분 남짓 걸려 안내 없이는 멈춘 화면으로 보인다. 원본의 제목·원·로고 자리를
                    그대로 두려고 원 아래에 둔다. */}
                <p className="text-body-s text-text-secondary text-center">
                  보통 1분 30초, 길게는 2분 정도 걸려요
                </p>
              </div>
            </div>
          ) : step === "failed" ? (
            /* FL_S_LVS_AIC_FAIL — 원본에 실패 화면이 없어 새로 부여한 화면 ID다.
               생성 중 화면(FL_S_LVS_AISLT_4)과 같은 자리·배경을 쓰고 사유와 재시도만 둔다 —
               생성 중·성공과 구분되지 않으면 판매자가 기다리기만 하게 된다(#289 필수 계약 2). */
            <div
              role="alert"
              className="mt-6 flex h-[500px] flex-col items-center justify-center gap-6 px-6 text-center"
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
                                <button
                                  type="button"
                                  disabled={!complete}
                                  aria-pressed={correctingIndex === index}
                                  aria-label={
                                    complete
                                      ? `${question.label} 답변 — 눌러서 정정 대상으로 선택`
                                      : undefined
                                  }
                                  onClick={complete ? () => setCorrectingIndex(index) : undefined}
                                  className={`bg-layer-surface-primary text-text-inverse text-body-s ml-auto block w-fit max-w-[85%] rounded-[16px] rounded-br-none p-4 text-left whitespace-pre-wrap ${
                                    complete ? "cursor-pointer" : "cursor-default"
                                  } ${
                                    correctingIndex === index
                                      ? "ring-border-primary-live ring-2 ring-offset-2"
                                      : ""
                                  }`}
                                >
                                  {answers[index] || "건너뛰었습니다."}
                                </button>
                              )}
                            </div>
                          ))}
                        {/* 원본 FL_S_LVS_AIC_3의 완료 안내도 질문과 같은 chat_dialogue_unit이라
                            avatar가 붙고 문항 번호만 없다. */}
                        {complete && (
                          <div className="flex items-start gap-3">
                            <Image
                              src="/icons/funding-story/avatar.svg"
                              alt=""
                              width={28}
                              height={32}
                              className="h-8 w-7 shrink-0"
                            />
                            <p className="bg-layer-surface-default border-border-default text-body-s max-w-[85%] rounded-[16px] rounded-tl-none border p-4">
                              필수 항목 입력을 완료했어요. 다음으로 이동하거나, 고칠 답변을 탭하고
                              정정할 내용을 입력해주세요(안 고르면 마지막 답이 고쳐져요).
                            </p>
                          </div>
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
                            complete
                              ? `"${demoQuestions[correctionTargetIndex].label}" 정정 내용을 작성해주세요`
                              : "답변을 작성해주세요"
                          }
                          maxLength={draftMaxLength}
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
                    /* 원본 FL_S_LVS_AISLT_1~3: 유형 카드 두 장(338px) 아래 48px 띄워 방송 시간 줄을 둔다. */
                    <div className={`${styles.panel} flex flex-col gap-12 p-4`}>
                      <fieldset className="grid h-[338px] shrink-0 grid-cols-2 gap-3">
                        <legend className="sr-only">큐시트 유형</legend>
                        {cueTypeOptions.map((option) => {
                          const selected = type === option.value;
                          return (
                            <div key={option.value} className="flex min-h-0 flex-col gap-2">
                              <p
                                id={`cue-type-${option.value}`}
                                className="text-label-s text-text-secondary font-medium"
                              >
                                {option.description}
                              </p>
                              {/* 테두리 1.5px만큼 안쪽 여백을 줄여 원본의 16px 안쪽 선을 맞춘다. */}
                              <label
                                className={`flex min-h-0 flex-1 cursor-pointer flex-col gap-6 overflow-y-auto rounded-xs border-[1.5px] p-[14.5px] ${selected ? "bg-status-accent border-border-primary-live" : "bg-layer-bg border-transparent"}`}
                              >
                                <span className="flex flex-col gap-2">
                                  <span className="flex items-center justify-between">
                                    <Badge variant={selected ? "primaryLive" : "info"}>
                                      {option.label}
                                    </Badge>
                                    {/* 카드 전체가 label이라 공용 Radio(자체 label)를 넣지 못한다.
                                        같은 모양을 그대로 그린다. */}
                                    <span className="relative flex size-7 shrink-0 items-center justify-center p-1">
                                      <input
                                        type="radio"
                                        name="cue-type"
                                        value={option.value}
                                        checked={selected}
                                        aria-label={option.label}
                                        aria-describedby={`cue-type-${option.value}`}
                                        onChange={() => setType(option.value)}
                                        className="peer sr-only"
                                      />
                                      <span
                                        aria-hidden
                                        className="border-border-default peer-checked:bg-layer-surface-primary peer-focus-visible:outline-border-primary after:border-text-inverse relative size-5 shrink-0 rounded-full border peer-checked:border-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 after:absolute after:top-1/2 after:left-1/2 after:h-2.5 after:w-1.5 after:-translate-x-1/2 after:-translate-y-[60%] after:rotate-45 after:border-r-2 after:border-b-2 after:opacity-0 peer-checked:after:opacity-100"
                                      />
                                    </span>
                                  </span>
                                  <span className="text-label-m text-text-secondary font-medium">
                                    예시)
                                  </span>
                                </span>
                                <span className="flex flex-col gap-4">
                                  <span className="text-label-l">오프닝</span>
                                  <span className="flex flex-col">
                                    <span className="text-body-s flex flex-col gap-4 font-medium">
                                      {option.examples.map((example) => (
                                        <span key={example}>{example}</span>
                                      ))}
                                    </span>
                                    <span aria-hidden className="text-body-s w-[252px] text-center">
                                      .<br />.
                                    </span>
                                  </span>
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </fieldset>
                      <div className="flex items-center justify-between">
                        <div className="w-[221px]">
                          <label htmlFor="cue-minutes" className="text-body-emphasis block">
                            방송 시간 설정
                          </label>
                          <p id="cue-minutes-help" className="text-caption-s">
                            최대 10분 분량의 큐시트 제공이 가능합니다
                          </p>
                        </div>
                        {/* 원본은 0분일 때 회색 칸(input_disabled), 고른 뒤 흰 칸(input_filled)과
                            위·아래 버튼이다. 고르기 전에도 입력은 받는다. */}
                        <div className="flex items-center gap-1">
                          <div
                            className={`${styles.minutesField} flex h-9 w-35 items-center justify-center rounded-xs border px-4 ${minutes > 0 ? "bg-layer-surface-default border-border-default text-body-m" : "bg-layer-surface-disabled text-body-s text-text-secondary border-transparent"}`}
                          >
                            <input
                              id="cue-minutes"
                              aria-describedby="cue-minutes-help"
                              type="number"
                              min={1}
                              max={10}
                              step={1}
                              value={minutes}
                              className="w-[2ch] [appearance:textfield] bg-transparent text-right [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              onChange={(event) =>
                                setMinutes(
                                  Math.max(0, Math.min(10, Math.floor(Number(event.target.value)))),
                                )
                              }
                            />
                            <span>분</span>
                          </div>
                          <div className="flex w-8 flex-col gap-0.5">
                            <button
                              type="button"
                              aria-label="방송 시간 1분 늘리기"
                              disabled={minutes >= 10}
                              className="border-border-default text-text-secondary disabled:text-text-disabled flex h-[17px] items-center justify-center rounded-xs border disabled:cursor-not-allowed"
                              onClick={() => setMinutes(Math.min(10, Math.max(1, minutes + 1)))}
                            >
                              <Icon name="arrowDown" className="size-2 rotate-180" />
                            </button>
                            <button
                              type="button"
                              aria-label="방송 시간 1분 줄이기"
                              disabled={minutes <= 1}
                              className="border-border-default text-text-secondary disabled:text-text-disabled flex h-[17px] items-center justify-center rounded-xs border disabled:cursor-not-allowed"
                              onClick={() => setMinutes(Math.max(1, minutes - 1))}
                            >
                              <Icon name="arrowDown" className="size-2" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-6 flex justify-between gap-4">
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
                    {/* 원본은 유형·시간을 다 고르기 전엔 "다음으로", 고른 뒤 LIVE 색 "큐시트 생성"이다.
                        비활성 면은 원본 버튼(color=disabled)의 #cdced4로 LIVE 생성 화면과 맞춘다. */}
                    <Button
                      size="md"
                      variant={step === "options" && optionsReady ? "primaryLive" : "primary"}
                      className="text-body-s! h-10! w-36 disabled:bg-[#cdced4]!"
                      disabled={
                        step === "chat" ? !complete : step === "options" ? !optionsReady : false
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
                      {step === "options" && optionsReady ? "큐시트 생성" : "다음으로"}
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
