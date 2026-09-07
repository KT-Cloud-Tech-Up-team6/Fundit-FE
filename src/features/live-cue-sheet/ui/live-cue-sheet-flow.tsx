"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import {
  createDemoScenes,
  demoAnswers,
  demoProject,
  demoQuestions,
  type CueScene,
  type CueSheetType,
} from "../model/cue-sheet-demo";
import { CueSheetEditor } from "./cue-sheet-editor";
import styles from "./cue-sheet.module.css";

type Step =
  "studio" | "create" | "chat" | "summary" | "options" | "generating" | "ready" | "editor";
type SavedCueSheet = { scenes: CueScene[]; type: CueSheetType; minutes: number };
type LiveCueSheetFlowProps = {
  liveId?: string;
  initialStep?: Step;
  initialAnswers?: string[];
  initialType?: CueSheetType;
  initialMinutes?: number;
  initialSavedCueSheet?: SavedCueSheet;
  autoAdvanceGeneration?: boolean;
};

const loadingLabels = [
  "제품 핵심 스펙과 이미지를 분석 중입니다",
  "입력하신 내용을 확인하는 중",
  "제품 특징을 분석하는 중",
  "필요한 정보를 정리하는 중",
  "한 번 더 검토하는 중",
];
const readyLabels = [
  "제품 핵심 스펙과 이미지를 분석 완료",
  "내용 확인 완료",
  "특징 분석 완료",
  "정보 정리 완료",
  "검토 완료",
];

function ProjectInfo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`border-border-default rounded-xs border p-4 ${compact ? "flex items-center gap-4" : "md:h-[418px]"}`}
    >
      <div
        className={`bg-border-default text-text-primary-live text-body-s flex shrink-0 items-center justify-center rounded-xs ${compact ? "size-[81px]" : "mb-4 aspect-[4/3] w-full max-md:hidden"}`}
      >
        IMG
      </div>
      <div className="min-w-0">
        <h4 className="text-body-strong">{demoProject.title}</h4>
        <div
          className={`text-caption-s text-text-secondary flex gap-1 ${compact ? "flex-wrap" : "flex-col"}`}
        >
          <span>{demoProject.category}</span>
          <span>{demoProject.period}</span>
          <span className="flex items-center gap-1">
            <Icon name="people" className="size-3.5" />
            132명
          </span>
        </div>
        <p className="text-title-s mt-2">6,400,000원</p>
        <p className="text-body-s text-text-secondary">/ 5,000,000원</p>
      </div>
    </div>
  );
}

export function LiveCueSheetFlow({
  liveId = "demo-live",
  initialStep = "chat",
  initialAnswers = [],
  initialType,
  initialMinutes,
  initialSavedCueSheet,
  autoAdvanceGeneration = true,
}: LiveCueSheetFlowProps) {
  const [step, setStep] = useState<Step>(initialStep);
  const [answers, setAnswers] = useState(initialAnswers);
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
      : createDemoScenes(minutes || 10, initialAnswers.length ? initialAnswers : demoAnswers),
  );
  const [saved, setSaved] = useState<SavedCueSheet | null>(initialSavedCueSheet ?? null);
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDListElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const open = step !== "studio";
  const complete = answers.length === demoQuestions.length;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) {
      dialog.close();
      openButtonRef.current?.focus();
    }
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (open) headingRef.current?.focus();
  }, [step, open]);
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [answers, step]);

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
    setScenes(createDemoScenes(minutes, answers));
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
    setNotice("");
    setStep("editor");
  }

  function save() {
    setSaved({ scenes: scenes.map((scene) => ({ ...scene })), type: type ?? "script", minutes });
    setNotice("큐시트를 저장했습니다.");
    setStep("create");
  }

  const demoLives =
    tab === 1
      ? [demoProject.title]
      : tab === 2
        ? [
            "로보락 F25 제품 소개",
            "로보락 F25 기능 시연",
            "로보락 F25 리워드 안내",
            "로보락 F25 사전 안내",
          ]
        : [];
  const visibleLives = demoLives.filter((title) =>
    title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <section className="flex min-h-[calc(100dvh-92px)] flex-col pt-9">
        <h1 className="text-heading-s py-2">LIVE 스튜디오</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabList
            selectedIndex={tab}
            onSelectedIndexChange={setTab}
            className="max-w-full"
            aria-label="LIVE 상태"
          >
            {["진행중", "준비중", "완료"].map((label, index) => (
              <Tab key={label} size="md" id={`live-tab-${index}`} aria-controls="live-list">
                {label} <span>{[0, 1, 4][index]}</span>
              </Tab>
            ))}
          </TabList>
          <div className="flex w-full gap-6 md:w-auto">
            <SearchField
              size="sm"
              className="h-[46px]! md:w-[282px]"
              aria-label="LIVE 검색"
              placeholder="검색하기"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onClear={() => setSearch("")}
            />
            <Button
              ref={openButtonRef}
              className="w-45 shrink-0"
              onClick={() => {
                setStep("create");
                setNotice("");
              }}
            >
              라이브 생성하기
            </Button>
          </div>
        </div>
        <div
          id="live-list"
          role="tabpanel"
          aria-labelledby={`live-tab-${tab}`}
          className="flex flex-1 flex-col"
        >
          {visibleLives.length ? (
            <div className="mt-8 space-y-4">
              {visibleLives.map((title) => (
                <div
                  key={title}
                  className="border-border-default flex items-center justify-between gap-4 rounded-xs border p-5"
                >
                  <p className="text-body-strong">{title}</p>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      setStep("chat");
                      setNotice("");
                    }}
                  >
                    AI 큐시트
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 py-24">
              <div className="bg-layer-surface-disabled flex size-[101px] items-center justify-center">
                <Icon name="live" className="text-text-secondary size-10" />
              </div>
              <p className="text-body-m">
                {search ? "검색 결과가 없습니다" : "진행중인 라이브가 없습니다"}
              </p>
            </div>
          )}
        </div>
        <Pagination currentPage={1} totalPages={1} buildHref={() => "/seller/live"} />
      </section>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        style={step === "create" ? { width: "min(588px, calc(100vw - 32px))" } : undefined}
        aria-labelledby="cue-sheet-title"
        onCancel={(event) => {
          event.preventDefault();
          setStep("studio");
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setStep("studio");
        }}
      >
        <div className={styles.frame}>
          <header className="grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2">
            <span />
            <h2
              id="cue-sheet-title"
              ref={headingRef}
              tabIndex={-1}
              className="text-title-l text-center outline-none"
            >
              {step === "create" ? "LIVE 생성하기" : `‘${demoProject.title}’ AI 큐시트`}
            </h2>
            <button
              type="button"
              aria-label="닫기"
              className="flex size-9 items-center justify-center rounded-xs"
              onClick={() => setStep("studio")}
            >
              <span
                aria-hidden
                className="size-5 bg-current [mask-image:url('/images/live-cue-sheet/close.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
              />
            </button>
          </header>

          {step === "create" ? (
            <div className="mt-12">
              <h3 className="text-body-strong mb-12 text-center">
                입력된 내용이 맞는지 확인해주세요
              </h3>
              <ProjectInfo compact />
              <p className="border-border-default text-body-s mt-2 rounded-xs border p-4">
                {demoProject.description}
              </p>
              <p role="status" className="text-caption-s mt-8 min-h-5 text-center">
                {notice}
              </p>
              <div className="mt-4 grid grid-cols-2 items-end gap-3">
                <div>
                  {saved && (
                    <p className="bg-layer-surface-disabled text-caption-s mx-auto mb-2 w-fit rounded-xs px-3 py-1">
                      저장된 큐시트가 있어요!
                    </p>
                  )}
                  <button
                    type="button"
                    className={`${styles.secondary} w-full`}
                    onClick={() => {
                      if (saved) loadSaved();
                      else {
                        setStep("chat");
                        setNotice("");
                      }
                    }}
                  >
                    AI 큐시트 생성
                  </button>
                </div>
                <Link
                  href={`/seller/live/${encodeURIComponent(liveId)}/console`}
                  className="bg-layer-surface-primary text-text-inverse text-body-s flex h-10 items-center justify-center rounded-xs"
                >
                  라이브 시작
                </Link>
              </div>
            </div>
          ) : step === "generating" || step === "ready" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[540px] flex-col items-center justify-center gap-10"
            >
              <h3 className="text-title-l text-center">
                {step === "generating"
                  ? "AI가 큐시트를 생성중이에요"
                  : "AI가 스토리 준비를 시작할게요"}
              </h3>
              <ul className="space-y-6">
                {(step === "generating" ? loadingLabels : readyLabels).map((label) => (
                  <li key={label} className="text-body-m flex items-center justify-center gap-2">
                    {step === "generating" ? (
                      <span aria-hidden className="motion-safe:animate-pulse">
                        ···
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="size-5 bg-current [mask-image:url('/images/live-cue-sheet/check.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                      />
                    )}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          ) : step === "editor" ? (
            <CueSheetEditor
              scenes={scenes}
              type={type ?? "script"}
              onChange={setScenes}
              onBack={() => setStep("options")}
              onRegenerate={generate}
              onSave={save}
            />
          ) : (
            step !== "studio" && (
              <div className={styles.body}>
                <aside>
                  <h3 className="text-body-strong mb-2">프로젝트 정보</h3>
                  <ProjectInfo />
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
                    <div className={`${styles.panel} bg-layer-surface-disabled flex flex-col p-4`}>
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
                                <span
                                  aria-hidden
                                  className="bg-border-default size-8 shrink-0 rounded-full"
                                />
                                <div className="max-w-[85%]">
                                  <div className="bg-border-default text-body-s rounded-sm p-3">
                                    <p>{question.question}</p>
                                    <p className="text-caption-strong mt-1 text-right">
                                      {index + 1}/5
                                    </p>
                                  </div>
                                  {index === answers.length && (
                                    <button
                                      type="button"
                                      className="bg-border-default text-caption-s mt-2 rounded-full px-4 py-1"
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
                                <p className="bg-layer-surface-default text-body-s ml-auto w-fit max-w-[85%] rounded-sm p-3 whitespace-pre-wrap">
                                  {answers[index] || "건너뛰었습니다."}
                                </p>
                              )}
                            </div>
                          ))}
                        {complete && (
                          <p className="bg-border-default text-body-s rounded-sm p-3">
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
                          className="bg-border-default text-body-s min-w-0 flex-1 rounded-xs px-3 py-2"
                          placeholder={
                            complete ? "정정할 내용을 작성해주세요" : "답변을 작성해주세요"
                          }
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                        />
                        <button
                          type="submit"
                          aria-label="답변 보내기"
                          disabled={!draft.trim()}
                          className="bg-layer-surface-primary text-text-inverse disabled:bg-border-default flex h-10 w-14 items-center justify-center rounded-xs"
                        >
                          <span
                            aria-hidden
                            className="size-5 bg-current [mask-image:url('/images/live-cue-sheet/send.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                          />
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
                        className="bg-layer-surface-disabled min-h-0 flex-1 overflow-y-auto p-3"
                      >
                        {[
                          ["제품명", demoProject.title],
                          ["카테고리", "테크·가전"],
                          ...demoQuestions.map((question, index) => [
                            question.label,
                            answers[index] || "입력하지 않음",
                          ]),
                          ["스펙", demoProject.description],
                          ["리워드", "로보락 F25 본체 단품 699,000원"],
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
                            className={`bg-layer-surface-disabled cursor-pointer overflow-y-auto rounded-xs border p-4 ${type === value ? "border-border-primary" : "border-transparent"}`}
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
                  <p role="status" className="text-caption-s mt-2">
                    {notice}
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
