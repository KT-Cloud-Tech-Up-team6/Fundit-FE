"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/shared/api/api-error";
import { endLive, getLiveDetail } from "@/entities/live/api/live-session-api";
import { getCueSheet } from "@/entities/live/api/live-cue-sheet-api";
import { toCueSheetState } from "@/entities/live/model/live-cue-sheet";
import { createLiveVerification } from "@/entities/project/api/seller-project-api";
import {
  CuePanel,
  MonitoringPanel,
  SellerChatPanel,
} from "@/features/live-console/ui/console-panels";
import styles from "@/features/live-console/ui/console.module.css";
import { LiveCheckFlow, type CheckDialog } from "@/features/live-console/ui/live-check-flow";
import {
  AggregatedAnswer,
  ManagerFrame,
  ManagerSubheading,
  OriginalQuestions,
  QuestionSummaryRow,
  UnavailableAnswer,
  type ManagerView,
} from "@/features/live-console/ui/question-manager";
import { useAuth } from "@/providers/auth-provider";
import { SellerShell } from "@/shared/components/layout/seller-shell";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import {
  getAnsweredQuestions,
  getInsights,
  getOriginals,
  getPlayback,
  getUnanswered,
  requestAnswer,
  type AnswerDraft,
  type AnsweredQuestion,
  type PendingQuestion,
} from "../api/live-api";
import {
  answeredByName,
  formatElapsed,
  formatUpdatedAgo,
  formatViewers,
  publishLiveChecks,
  questionSummaryState,
  toCheckQuestions,
  toConsoleCues,
} from "../model/seller-console";
import { LivePlayer } from "./live-player";
import { MutationError, QueryError } from "./query-error";

/* AI 집계는 3분 창이다. 새 질문이 늦게 보이지 않도록 그보다 짧게 다시 부른다. 인사이트 호출이
   BE에 AI 집계를 가져오게 하므로 이 갱신이 곧 집계 반영 주기다. */
const POLL_MS = 30_000;

/* 실제 채팅이 연결되지 않아 늘 빈 목록이다. 렌더마다 새 배열을 넘기면 채팅 패널의 스크롤 처리가 매번 돈다. */
const noMessages: { id: string; author: string; text: string }[] = [];

const placeholderBox =
  "bg-layer-surface-disabled text-caption-s text-text-secondary flex flex-1 items-center justify-center rounded-xs p-4 text-center";

export function RealSellerConsole({ liveId }: { liveId: string }) {
  const { state } = useAuth();
  const ownerId = state.status === "authenticated" ? state.user?.memberId : undefined;
  if (state.status === "guest")
    return (
      <SellerShell>
        <p className="p-6" role="alert">
          LIVE 콘솔을 보려면 로그인해야 합니다.
        </p>
      </SellerShell>
    );
  if (state.status === "checking")
    return (
      <SellerShell>
        <p className="p-6">사용자 정보를 확인하는 중입니다.</p>
      </SellerShell>
    );
  if (!ownerId)
    return (
      <SellerShell>
        <p role="alert" className="p-6">
          사용자 정보를 불러오지 못했습니다.{" "}
          <button type="button" className="underline" onClick={() => window.location.reload()}>
            새로고침
          </button>
        </p>
      </SellerShell>
    );
  return <ConsoleBody key={ownerId} liveId={liveId} ownerId={ownerId} />;
}

function ConsoleBody({ liveId, ownerId }: { liveId: string; ownerId: string }) {
  const cache = useQueryClient();
  const ownerKey = ["live", liveId, "owner", ownerId];
  const consoleRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<ManagerView>({ kind: "summary" });
  const [dialog, setDialog] = useState<CheckDialog | null>(null);
  const [notice, setNotice] = useState("");
  const [endError, setEndError] = useState<unknown>(null);
  const [publishedIds, setPublishedIds] = useState<string[]>([]);
  /* 요청 중 표시는 다음 렌더에 반영된다. 그 사이 두 번 누르면 종료가 두 번 나가 성공 뒤 409를 띄운다. */
  const ending = useRef(false);

  const detail = useQuery({
    queryKey: [...ownerKey, "detail"],
    queryFn: ({ signal }) => getLiveDetail(liveId, signal),
    refetchInterval: (query) => (query.state.data?.status === "ENDED" ? false : POLL_MS),
    retry: false,
  });
  /* 종료가 확인되면 더 모일 질문이 없다. 인사이트 호출은 BE가 AI를 부르게 하므로 멈춘다. */
  const questionPoll = detail.data?.status === "ENDED" ? false : POLL_MS;
  const playback = useQuery({
    queryKey: ["live", liveId, "playback"],
    queryFn: ({ signal }) => getPlayback(liveId, signal),
    retry: false,
  });
  const cueSheet = useQuery({
    queryKey: [...ownerKey, "cue-sheet"],
    /* 한 번도 만들지 않은 LIVE는 404다. 오류가 아니라 "큐시트 없음"이다. */
    queryFn: ({ signal }) =>
      getCueSheet(liveId, signal).catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }),
    retry: false,
  });
  const insights = useQuery({
    queryKey: [...ownerKey, "insights"],
    queryFn: ({ signal }) => getInsights(liveId, signal),
    refetchInterval: questionPoll,
    retry: false,
  });
  const unanswered = useQuery({
    queryKey: [...ownerKey, "unanswered"],
    queryFn: ({ signal }) => getUnanswered(liveId, signal),
    refetchInterval: questionPoll,
    retry: false,
  });
  const answered = useQuery({
    queryKey: ["live", liveId, "answered-questions"],
    queryFn: ({ signal }) => getAnsweredQuestions(liveId, signal),
    refetchInterval: questionPoll,
    retry: false,
  });
  const end = useMutation({
    mutationFn: () => endLive(liveId),
    onSuccess: () => {
      setDialog({ kind: "ended" });
      void cache.invalidateQueries({ queryKey: [...ownerKey, "detail"] });
    },
    onError: setEndError,
    onSettled: () => {
      ending.current = false;
    },
  });

  const live = detail.data?.status === "LIVE";
  const projectId = detail.data?.projectId;
  const checkQuestions = toCheckQuestions(answered.data ?? []);
  const cues = toConsoleCues(toCueSheetState(cueSheet.data).segments);

  function closeDialog() {
    setDialog(null);
    consoleRef.current?.focus();
  }

  function refreshQuestions() {
    void insights.refetch();
    void unanswered.refetch();
    void answered.refetch();
  }

  return (
    <SellerShell
      headerAction={
        <Button
          variant="secondary"
          size="md"
          className="text-body-s h-10! gap-2 px-3!"
          disabled={!live || end.isPending}
          onClick={() => {
            if (ending.current) return;
            ending.current = true;
            setEndError(null);
            end.mutate();
          }}
        >
          LIVE 종료
          <Icon name="close" className="size-4" />
        </Button>
      }
    >
      <div
        className={styles.console}
        ref={consoleRef}
        tabIndex={-1}
        aria-label={`LIVE 콘솔 ${liveId}`}
      >
        <p role="status" className={notice ? "text-body-s mx-auto max-w-300 pt-4" : "sr-only"}>
          {notice}
        </p>
        {endError !== null && (
          <p role="alert" className="text-body-s text-text-warning mx-auto max-w-300 pt-4">
            {endError instanceof ApiError && endError.status === 409
              ? "진행 중인 방송이 아니어서 종료할 수 없습니다."
              : "LIVE를 종료하지 못했습니다. 다시 시도해 주세요."}
          </p>
        )}
        <div className={styles.grid}>
          <QuestionPanel
            liveId={liveId}
            ownerKey={ownerKey}
            view={view}
            onView={setView}
            insights={insights}
            unanswered={unanswered}
            answered={answered}
            live={live}
            onRefresh={refreshQuestions}
            onNotice={setNotice}
          />
          <Monitoring
            playbackUrl={playback.data?.playbackUrl}
            playbackState={playback.isPending ? "pending" : playback.isError ? "error" : "ready"}
            onRetry={() => void playback.refetch()}
            viewerCount={detail.data?.viewerCount}
            elapsedSeconds={detail.data?.elapsedSeconds}
            elapsedAt={detail.dataUpdatedAt}
            live={live}
            onCheckStream={() => setNotice("스트림 상태 확인은 준비 중입니다.")}
          />
          <div className="flex min-w-0 flex-col gap-4">
            {cueSheet.isError ? (
              <section
                aria-label="큐시트"
                className="border-border-default flex h-100 items-center rounded-sm border p-4"
              >
                <QueryError error={cueSheet.error} retry={() => void cueSheet.refetch()} />
              </section>
            ) : (
              <CuePanel
                key={cueSheet.dataUpdatedAt}
                cues={cues}
                emptyMessage={
                  cueSheet.isPending ? "큐시트를 불러오는 중입니다." : "저장된 큐시트가 없습니다."
                }
              />
            )}
            <SellerChatPanel
              messages={noMessages}
              countLabel="-"
              onSend={() => {
                setNotice("실시간 채팅은 준비 중입니다.");
                return false;
              }}
            />
          </div>
        </div>
        {dialog && (
          <LiveCheckFlow
            dialog={dialog}
            onDialog={setDialog}
            questions={checkQuestions}
            listFallback={
              answered.isPending ? (
                <p className="text-body-s">답변한 질문을 불러오는 중입니다.</p>
              ) : answered.isError ? (
                <QueryError error={answered.error} retry={() => void answered.refetch()} />
              ) : undefined
            }
            renderOriginals={(questionId) => (
              <Originals liveId={liveId} ownerKey={ownerKey} questionId={questionId} />
            )}
            publishedIds={publishedIds}
            onPublish={async (ids) => {
              if (!projectId) return ids;
              const failed = await publishLiveChecks(ids, checkQuestions, (body) =>
                createLiveVerification(projectId, body),
              );
              setPublishedIds((current) => [
                ...new Set([...current, ...ids.filter((id) => !failed.includes(id))]),
              ]);
              return failed;
            }}
            projectHref={projectId ? `/projects/${projectId}?tab=live-proof` : undefined}
            onClose={closeDialog}
          />
        )}
      </div>
    </SellerShell>
  );
}

/** 1초마다 경과 시간을 올리는 부분만 따로 다시 그린다. 서버 값은 받은 시각 기준으로 이어 센다. */
function Monitoring({
  playbackUrl,
  playbackState,
  onRetry,
  viewerCount,
  elapsedSeconds,
  elapsedAt,
  live,
  onCheckStream,
}: {
  playbackUrl?: string;
  playbackState: "pending" | "error" | "ready";
  onRetry: () => void;
  viewerCount?: number | null;
  elapsedSeconds?: number | null;
  elapsedAt: number;
  live: boolean;
  onCheckStream: () => void;
}) {
  const now = useNow(live && elapsedSeconds != null ? 1000 : null);
  const elapsed =
    elapsedSeconds == null
      ? null
      : elapsedSeconds + (live ? Math.max(0, Math.floor((now - elapsedAt) / 1000)) : 0);
  return (
    <MonitoringPanel
      media={
        playbackState === "ready" && playbackUrl ? (
          /* 송출 화면 전체가 보이도록 영역을 채우되 영상은 맞춤(contain)으로 두고 남는 여백은 검정이다. */
          <div className="absolute inset-0 [&>*]:aspect-auto [&>*]:h-full [&>*]:rounded-none [&>*]:bg-[black]!">
            <LivePlayer src={playbackUrl} title="판매자 모니터링" />
          </div>
        ) : (
          <div className="text-caption-s text-text-secondary absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {playbackState === "error" ? (
              <>
                <p>송출 영상을 불러오지 못했습니다.</p>
                <button type="button" className="underline" onClick={onRetry}>
                  다시 시도
                </button>
              </>
            ) : (
              <p>송출 영상을 불러오는 중입니다.</p>
            )}
          </div>
        )
      }
      viewers={formatViewers(viewerCount)}
      funding="-"
      elapsed={formatElapsed(elapsed)}
      onCheckStream={onCheckStream}
    />
  );
}

function useNow(intervalMs: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (intervalMs === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Figma "2분 전 ⟳" 자리. 누르면 질문 목록을 바로 다시 받는다. */
function UpdatedAgo({
  updatedAt,
  fetching,
  onRefresh,
}: {
  updatedAt: number;
  fetching: boolean;
  onRefresh: () => void;
}) {
  const now = useNow(30_000);
  const ago = formatUpdatedAgo(updatedAt, Math.max(now, updatedAt));
  return (
    <button
      type="button"
      aria-label={`질문 새로고침${ago ? ` · ${ago} 갱신` : ""}`}
      disabled={fetching}
      onClick={onRefresh}
      className="text-caption-s text-text-secondary flex items-center gap-1 disabled:opacity-60"
    >
      {fetching ? "갱신 중" : ago} <Icon name="swap" className="size-3.5" />
    </button>
  );
}

type SummaryItem = PendingQuestion & { complete: boolean };

function QuestionPanel({
  liveId,
  ownerKey,
  view,
  onView,
  insights,
  unanswered,
  answered,
  live,
  onRefresh,
  onNotice,
}: {
  liveId: string;
  ownerKey: string[];
  view: ManagerView;
  onView: (view: ManagerView) => void;
  insights: UseQueryResult<Awaited<ReturnType<typeof getInsights>>>;
  unanswered: UseQueryResult<Awaited<ReturnType<typeof getUnanswered>>>;
  answered: UseQueryResult<AnsweredQuestion[]>;
  live: boolean;
  onRefresh: () => void;
  onNotice: (message: string) => void;
}) {
  const cache = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) headingRef.current?.focus();
    previousView.current = view;
  }, [view]);
  const byCount = (a: PendingQuestion, b: PendingQuestion) => b.count - a.count;
  const pending = [...(unanswered.data?.pending ?? [])].sort(byCount);
  const done = [...(unanswered.data?.answered ?? [])].sort(byCount);
  const items: SummaryItem[] = [
    ...pending.map((item) => ({ ...item, complete: false })),
    ...done.map((item) => ({ ...item, complete: true })),
  ];
  const question =
    "questionId" in view ? items.find((item) => item.questionId === view.questionId) : undefined;
  const draftKey = (questionId: string) => [...ownerKey, "draft", questionId];
  /* 초안을 받아 본 질문만 알 수 있다. 근거가 없어 초안이 비면(null) 목록에서도 경고로 표시한다. */
  const unavailable = (questionId: string) =>
    cache.getQueryData<AnswerDraft>(draftKey(questionId))?.draftAnswer === null;
  const aggregated = answered.data ?? [];
  const back = () => onView({ kind: "summary" });

  return (
    <ManagerFrame
      headingRef={headingRef}
      status={
        <UpdatedAgo
          updatedAt={unanswered.dataUpdatedAt}
          fetching={unanswered.isFetching || insights.isFetching}
          onRefresh={onRefresh}
        />
      }
    >
      {"questionId" in view && !question ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ManagerSubheading title="선택한 요약 질문" onBack={back} />
          <p className={placeholderBox}>목록에서 사라진 질문입니다. 돌아가서 다시 선택해 주세요.</p>
        </div>
      ) : question && view.kind === "originals" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ManagerSubheading title={`질문 전체 보기 (${question.count})`} onBack={back} />
          <Originals liveId={liveId} ownerKey={ownerKey} questionId={question.questionId} />
        </div>
      ) : question ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ManagerSubheading title="선택한 요약 질문" onBack={back} />
          <p className="bg-layer-bg text-body-s mb-3 rounded-xs px-4 py-3">
            {question.representativeText}
          </p>
          <AnswerView
            key={question.questionId}
            liveId={liveId}
            ownerKey={ownerKey}
            draftKey={draftKey(question.questionId)}
            question={question}
            registered={
              aggregated.find((item) => item.questionId === question.questionId)?.answerText
            }
            disabled={!live}
            onNotice={onNotice}
          />
        </div>
      ) : view.kind === "aggregated" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <ManagerSubheading title={`집계된 Q&A (${aggregated.length})`} onBack={back} />
          {answered.isPending ? (
            <p className={placeholderBox}>집계된 Q&amp;A를 불러오는 중입니다.</p>
          ) : answered.isError ? (
            <QueryError error={answered.error} retry={() => void answered.refetch()} />
          ) : aggregated.length ? (
            <ul className="min-h-0 space-y-4 overflow-y-auto">
              {aggregated.map((item) => (
                <AggregatedAnswer
                  key={item.questionId}
                  count={item.questionCount}
                  title={item.summaryText}
                  answer={item.answerText}
                  author={answeredByName(item.answeredBy)}
                />
              ))}
            </ul>
          ) : (
            <p className={placeholderBox}>아직 답변한 질문이 없습니다.</p>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <h3 className="text-body-emphasis">질문 요약</h3>
            {unanswered.isPending ? (
              <p className={placeholderBox}>질문을 불러오는 중입니다.</p>
            ) : unanswered.isError ? (
              <QueryError error={unanswered.error} retry={() => void unanswered.refetch()} />
            ) : questionSummaryState(insights.data?.aiStatus, items.length) === "preparing" ? (
              <p className={placeholderBox}>
                AI가 상품 정보를 준비하는 중입니다.
                <br />
                준비가 끝나면 시청자 질문을 모아 보여드려요
              </p>
            ) : !items.length ? (
              <p className={placeholderBox}>요약할 질문이 부족합니다</p>
            ) : (
              <>
                <p className="text-caption-s text-text-secondary -mt-2">
                  AI가 자동 답변하지 않은 질문 중 상위 누적된 질문들입니다
                </p>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  {[pending, done].map((list, index) => {
                    const complete = index === 1;
                    return (
                      <div key={String(complete)}>
                        <h4 className="text-caption-s mb-1">
                          {complete ? "답변 완료" : "미 답변 질문"}({list.length})
                        </h4>
                        <ul className="space-y-2">
                          {list.map((item) => (
                            <QuestionSummaryRow
                              key={item.questionId}
                              title={item.representativeText}
                              label={item.representativeText}
                              count={item.count}
                              complete={complete}
                              unavailable={!complete && unavailable(item.questionId)}
                              onOpen={() => onView({ kind: "answer", questionId: item.questionId })}
                              onOriginals={() =>
                                onView({ kind: "originals", questionId: item.questionId })
                              }
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {unanswered.isSuccess && (
            <Button
              variant="primaryLive"
              size="sm"
              className="text-body-s ml-auto h-10 px-6"
              onClick={() => onView({ kind: "aggregated" })}
            >
              집계된 Q&amp;A 보기 ({aggregated.length})
            </Button>
          )}
        </>
      )}
    </ManagerFrame>
  );
}

function Originals({
  liveId,
  ownerKey,
  questionId,
}: {
  liveId: string;
  ownerKey: string[];
  questionId: string;
}) {
  const originals = useQuery({
    queryKey: [...ownerKey, "originals", questionId],
    queryFn: ({ signal }) => getOriginals(liveId, questionId, signal),
    retry: false,
  });
  if (originals.isPending) return <p className={placeholderBox}>원문을 불러오는 중입니다.</p>;
  if (originals.isError)
    return <QueryError error={originals.error} retry={() => void originals.refetch()} />;
  if (!originals.data.length) return <p className={placeholderBox}>원문이 없습니다.</p>;
  return (
    <OriginalQuestions
      messages={originals.data.map((item) => ({ id: item.commentId, text: item.content }))}
    />
  );
}

/**
 * 질문을 고르면 AI 초안을 바로 받는다(IA: 질문 선택 시 초안 확인). 이미 답변한 질문은 등록한
 * 답변을 보여 주고, 재생성할 때만 초안을 받는다. 판매자가 고친 문구는 새 초안이 덮지 않는다.
 */
function AnswerView({
  liveId,
  ownerKey,
  draftKey,
  question,
  registered,
  disabled,
  onNotice,
}: {
  liveId: string;
  ownerKey: string[];
  draftKey: string[];
  question: SummaryItem;
  registered?: string;
  disabled: boolean;
  onNotice: (message: string) => void;
}) {
  const cache = useQueryClient();
  const [edited, setEdited] = useState<string | null>(null);
  const [notSent, setNotSent] = useState(false);
  const draft = useQuery({
    queryKey: draftKey,
    queryFn: () => requestAnswer(liveId, question.questionId, { action: "GENERATE" }),
    enabled: !question.complete,
    /* 초안은 AI 호출이라 다시 열 때마다 받지 않는다. 목록의 "초안 없음" 경고도 이 캐시로 판단한다. */
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  /* 요청 중 표시는 다음 렌더에 반영된다. 그 사이 두 번 누르면 같은 답변이 두 번 등록된다. */
  const sending = useRef(false);
  function submit(finalAnswer: string) {
    if (sending.current || !finalAnswer.trim()) return;
    sending.current = true;
    setNotSent(false);
    send.mutate(finalAnswer);
  }
  const send = useMutation({
    mutationFn: (finalAnswer: string) =>
      requestAnswer(liveId, question.questionId, { action: "SEND", finalAnswer }),
    onSuccess: (result) => {
      if (!result.sent) {
        setNotSent(true);
        return;
      }
      onNotice("답변이 등록되었습니다. 채팅 게시는 준비 중입니다.");
      void cache.invalidateQueries({ queryKey: [...ownerKey, "unanswered"] });
      void cache.invalidateQueries({ queryKey: [...ownerKey, "insights"] });
      void cache.invalidateQueries({ queryKey: ["live", liveId, "answered-questions"] });
    },
    onSettled: () => {
      sending.current = false;
    },
  });
  const noDraft = draft.data?.draftAnswer === null;
  const value = edited ?? draft.data?.draftAnswer ?? registered ?? "";
  const references = draft.data?.referenceChunks ?? [];
  const generating = draft.isFetching;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-body-emphasis">{noDraft ? "추천 답변" : "답변 초안"}</h3>
        {!noDraft && (
          <button
            type="button"
            disabled={disabled || generating}
            className={`${styles.link} text-caption-s text-text-secondary`}
            onClick={() => {
              setEdited(null);
              void draft.refetch();
            }}
          >
            재생성 하기
          </button>
        )}
      </div>
      {draft.isError ? (
        <MutationError
          error={draft.error}
          disabled={generating}
          retry={() => void draft.refetch()}
        />
      ) : noDraft ? (
        <UnavailableAnswer />
      ) : generating && !draft.data ? (
        <p className={placeholderBox}>답변 초안을 만드는 중입니다.</p>
      ) : (
        <div className="min-h-0 space-y-2 overflow-y-auto">
          {references.length > 0 && (
            <ul aria-label="답변 근거" className="bg-layer-bg text-body-s space-y-1 rounded-xs p-4">
              {references.map((chunk, index) => (
                <li key={`${index}-${chunk}`}>{chunk}</li>
              ))}
            </ul>
          )}
          <textarea
            aria-label="답변 내용"
            value={value}
            onChange={(event) => {
              setEdited(event.target.value);
              setNotSent(false);
            }}
            readOnly={disabled}
            className="border-border-default text-body-s min-h-28 w-full resize-y rounded-xs border p-4"
          />
        </div>
      )}
      {send.isError && (
        <MutationError
          error={send.error}
          disabled={send.isPending || !value.trim()}
          retry={() => submit(value)}
        />
      )}
      {notSent && (
        <p role="alert" className="text-body-s">
          답변 등록을 확인하지 못했습니다. 입력 내용은 유지됩니다.
        </p>
      )}
      <div className="mt-auto flex gap-3 pt-3">
        <Button
          variant="secondary"
          size="sm"
          className="text-body-s h-10 flex-1"
          disabled={disabled}
          onClick={() => onNotice("답변 완료 처리는 준비 중입니다.")}
        >
          답변 완료 처리
        </Button>
        {!noDraft && (
          <Button
            variant="primaryLive"
            size="sm"
            className="text-body-s h-10 flex-1"
            disabled={disabled || send.isPending || generating || !value.trim()}
            onClick={() => submit(value)}
          >
            채팅 보내기
          </Button>
        )}
      </div>
    </div>
  );
}
