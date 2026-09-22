"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { BuyerLiveDesktop } from "@/features/buyer-live-room/ui/buyer-live-desktop";
import { BuyerLiveReplay } from "@/features/buyer-live-replay/ui/buyer-live-replay";
import { BuyerLiveRoom } from "@/features/buyer-live-room/ui/buyer-live-room";
import styles from "@/features/live-console/ui/console.module.css";
import { useAuth } from "@/providers/auth-provider";
import { ApiError } from "@/shared/api/api-error";
import { SellerShell } from "@/shared/components/layout/seller-shell";
import {
  getAnsweredQuestions,
  getInsights,
  getOriginals,
  getPlayback,
  getPublicHighlights,
  getUnanswered,
  getVod,
  getVodChat,
  likeLive,
  requestAnswer,
  unlikeLive,
  type PendingQuestion,
} from "../api/live-api";
import { LivePlayer, type LivePlayerHandle } from "./live-player";
import { chapterRange, toChapters } from "../model/vod-chapters";

function QueryError({
  error,
  retry,
  disabled = false,
}: {
  error: unknown;
  retry: () => void;
  disabled?: boolean;
}) {
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    <div role="alert" className="border-border-default rounded border p-4">
      {status === 409
        ? "VOD를 준비 중입니다. 잠시 후 다시 시도해 주세요."
        : status === 401 || status === 403
          ? "로그인이 필요하거나 이 라이브에 접근할 권한이 없습니다."
          : `정보를 불러오지 못했습니다${status ? ` (${status})` : ""}.`}{" "}
      <button
        type="button"
        className="ml-2 underline disabled:opacity-50"
        onClick={retry}
        disabled={disabled}
      >
        다시 시도
      </button>
    </div>
  );
}

function answeredByLabel(value: string) {
  return value === "AI" ? "AI 답변" : value === "SELLER" ? "판매자 답변" : "답변자 미확인";
}

const realProduct = {
  title: "라이브 방송",
  seller: "판매자",
  poster: "/images/buyer-project/live-poster.png",
  avatar: "/images/buyer-live/seller-4.png",
  productImage: "/images/buyer-live/413b1.png",
};

export function RealBuyerLive({
  liveId,
  replay = false,
  clip = false,
  desktop = false,
}: {
  liveId: string;
  replay?: boolean;
  /** 모바일 다시보기의 숏 클립 화면(`?view=clip`). */
  clip?: boolean;
  desktop?: boolean;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const { state } = useAuth();
  const playbackKey = ["live", liveId, replay ? "vod" : "playback"];
  const playback = useQuery({
    queryKey: playbackKey,
    queryFn: ({ signal }) => (replay ? getVod(liveId, signal) : getPlayback(liveId, signal)),
    retry: false,
  });
  const isVod = replay || playback.data?.type === "VOD";

  /* 좋아요 응답이 204라 갱신된 수를 받을 수 없고, "내가 눌렀는지"를 주는 경로도 없다.
     낙관적으로 그린 뒤 playback을 다시 읽어 서버 수에 맞춘다. */
  const [liked, setLiked] = useState(false);
  const [likeDelta, setLikeDelta] = useState(0);
  const toggleLike = useMutation({
    mutationFn: (next: boolean) => (next ? likeLive(liveId) : unlikeLive(liveId)),
    onSuccess: async () => {
      /* 갱신된 수가 playback으로 돌아오면 낙관적 보정은 걷는다. 안 걷으면 +1이 두 번 더해진다. */
      await client.invalidateQueries({ queryKey: playbackKey });
      setLikeDelta(0);
    },
  });
  function onToggleLike() {
    /* 좋아요는 인증이 필요하다. 비로그인이면 로그인으로 보내고 끝난 뒤 이 화면으로 돌아온다.
       확인 중에는 아직 알 수 없어 아무것도 하지 않는다. */
    if (state.status === "checking") return;
    if (state.status === "guest") {
      const returnTo = window.location.pathname + window.location.search;
      router.push(`/auth/login?${new URLSearchParams({ returnTo })}`);
      return;
    }
    if (toggleLike.isPending) return;
    const next = !liked;
    setLiked(next);
    /* 서버 수는 아직 이전 값이라 누르면 +1, 취소하면 -1로 그린다. 실패하면 서버 값 그대로 둔다. */
    setLikeDelta(next ? 1 : -1);
    toggleLike.mutate(next, {
      onError: () => {
        setLiked(!next);
        setLikeDelta(0);
      },
    });
  }
  const likeCount = (playback.data?.likeCount ?? 0) + likeDelta;

  /* 구간 조회는 조회 수로 잡히는 호출이라(BE 주석) 다시보기에서 한 번만 읽는다. */
  const seekRef = useRef<LivePlayerHandle | null>(null);
  const [position, setPosition] = useState({ currentSec: 0, durationSec: 0 });
  const highlights = useQuery({
    queryKey: ["live", liveId, "highlights-public"],
    /* 이 호출이 조회 수로 잡힌다(BE 주석). signal을 넘기지 않는다 — 뷰포트 전환(LiveViewport가
       모바일로 먼저 그린 뒤 데스크톱으로 바꾼다)으로 언마운트되면 요청이 취소되고 새 요청이
       나가는데, 서버는 이미 첫 요청을 받아 조회가 두 번 잡힌다. staleTime으로 재조회도 막는다. */
    queryFn: () => getPublicHighlights(liveId),
    enabled: isVod,
    retry: false,
    staleTime: Infinity,
  });
  const markers = highlights.data?.markers ?? [];
  const chapters = toChapters(markers, position.durationSec);
  const progress = position.durationSec
    ? Math.min(100, (position.currentSec / position.durationSec) * 100)
    : 0;
  const range = chapterRange(markers, position.currentSec, position.durationSec);
  const vodChat = useQuery({
    queryKey: ["live", liveId, "vod-chat", range?.fromSec, range?.toSec],
    queryFn: ({ signal }) => getVodChat(liveId, range!.fromSec, range!.toSec, signal),
    enabled: isVod && range !== null,
    retry: false,
  });
  /* 렌더마다 새 배열을 만들면 이 트리가 초당 한 번(timeupdate) 다시 그려질 때 다시보기
     화면의 채팅 자동 스크롤이 매번 다시 돌아 사용자가 위로 올려 둔 위치가 풀린다. */
  const vodChatMessages = useMemo(
    () =>
      (vodChat.data ?? []).map((message, index) => ({
        id: `${message.offsetSec}:${index}`,
        author: "시청자",
        text: message.content,
      })),
    [vodChat.data],
  );
  const questions = useQuery({
    queryKey: ["live", liveId, "answered-questions"],
    queryFn: ({ signal }) => getAnsweredQuestions(liveId, signal),
    retry: false,
  });
  const video = playback.isPending ? (
    <p>영상을 불러오는 중입니다.</p>
  ) : playback.isError ? (
    <QueryError error={playback.error} retry={() => void playback.refetch()} />
  ) : (
    <LivePlayer
      src={playback.data.playbackUrl}
      title={playback.data.type === "VOD" ? "다시보기" : "라이브"}
      handleRef={seekRef}
      onProgress={(currentSec, durationSec) =>
        setPosition((previous) =>
          /* timeupdate는 초당 여러 번 온다. 화면이 쓰는 단위는 1초라 같은 초면 그대로 둬서
             이 트리 전체가 다시 그려지지 않게 한다. */
          previous.currentSec === Math.floor(currentSec) && previous.durationSec === durationSec
            ? previous
            : { currentSec: Math.floor(currentSec), durationSec },
        )
      }
    />
  );
  const questionData =
    questions.data?.map((question) => ({
      id: question.questionId,
      title: question.summaryText,
      count: question.questionCount,
      answer: question.answerText,
      answeredBy: answeredByLabel(question.answeredBy),
    })) ?? [];
  const questionState = questions.isPending ? (
    <p>질문을 불러오는 중입니다.</p>
  ) : questions.isError ? (
    <QueryError error={questions.error} retry={() => void questions.refetch()} />
  ) : questions.data?.length ? undefined : (
    <p>등록된 답변이 없습니다.</p>
  );
  if (desktop)
    return (
      <BuyerLiveDesktop
        key={liveId}
        liveId={liveId}
        replay={isVod}
        product={realProduct}
        rewardSummary={null}
        questions={questionData}
        questionsState={questionState}
        onRefreshQuestions={() => void questions.refetch()}
        chapters={chapters}
        progress={progress}
        onSeek={(percent) => seekRef.current?.seek((percent / 100) * position.durationSec)}
        liked={liked}
        likeCount={likeCount}
        onToggleLike={onToggleLike}
        replayMessages={isVod ? vodChatMessages : undefined}
        video={video}
        videoConnected={playback.isSuccess}
        demoMode={false}
      />
    );
  if (isVod)
    return (
      <BuyerLiveReplay
        key={liveId}
        liveId={liveId}
        clip={clip}
        product={{ ...realProduct, title: "다시보기" }}
        demoMode={false}
        video={video}
        chapters={chapters}
        progress={progress}
        onSeek={(percent) => seekRef.current?.seek((percent / 100) * position.durationSec)}
        liked={liked}
        onToggleLike={onToggleLike}
        replayMessages={vodChatMessages}
        questionsData={questionData}
        questionsState={questionState}
        onRefreshQuestions={() => void questions.refetch()}
      />
    );
  return (
    <BuyerLiveRoom
      liveId={liveId}
      product={{ ...realProduct, title: "라이브 방송" }}
      video={video}
      questionsData={questionData}
      questionsState={questionState}
      demoMode={false}
      onRefreshQuestions={() => void questions.refetch()}
      liked={liked}
      likeCount={likeCount}
      onToggleLike={onToggleLike}
    />
  );
}

function SellerQuestion({
  liveId,
  ownerId,
  question,
}: {
  liveId: string;
  ownerId: string;
  question: PendingQuestion;
}) {
  const [draft, setDraft] = useState("");
  const [sentError, setSentError] = useState("");
  const [originals, setOriginals] = useState(false);
  const draftChangedWhileGenerating = useRef(false);
  const requestPending = useRef(false);
  const cache = useQueryClient();
  const originalQuery = useQuery({
    queryKey: ["live", liveId, "owner", ownerId, "originals", question.questionId],
    queryFn: ({ signal }) => getOriginals(liveId, question.questionId, signal),
    enabled: originals,
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: (body: { action: "GENERATE" | "SEND"; finalAnswer?: string }) =>
      requestAnswer(liveId, question.questionId, body),
    onSuccess: (result, body) => {
      if (body.action === "GENERATE") {
        if (result.draftAnswer !== null && !draftChangedWhileGenerating.current)
          setDraft(result.draftAnswer);
        return;
      }
      if (result.sent) {
        cache.invalidateQueries({ queryKey: ["live", liveId, "owner", ownerId] });
        cache.invalidateQueries({ queryKey: ["live", liveId, "answered-questions"] });
      } else setSentError("답변 등록을 확인하지 못했습니다. 입력 내용은 유지됩니다.");
    },
    onSettled: () => {
      requestPending.current = false;
    },
  });
  function submit(action: "GENERATE" | "SEND") {
    if (requestPending.current || (action === "SEND" && !draft.trim())) return;
    requestPending.current = true;
    setSentError("");
    if (action === "GENERATE") draftChangedWhileGenerating.current = false;
    const request = action === "SEND" ? { action, finalAnswer: draft } : { action };
    mutation.mutate(request);
  }
  return (
    <article className="border-border-default rounded-sm border p-3">
      <p className="font-semibold">{question.representativeText}</p>
      <p className="text-sm">질문 {question.count}건</p>
      <div className="mt-2 flex gap-3">
        <button type="button" className="underline" onClick={() => setOriginals((value) => !value)}>
          원문 보기
        </button>
        <button
          type="button"
          className="underline"
          disabled={mutation.isPending}
          onClick={() => submit("GENERATE")}
        >
          초안 생성
        </button>
      </div>
      {originals &&
        (originalQuery.isPending ? (
          <p>원문을 불러오는 중입니다.</p>
        ) : originalQuery.isError ? (
          <QueryError error={originalQuery.error} retry={() => void originalQuery.refetch()} />
        ) : (
          <ul className="mt-2 list-disc pl-5">
            {originalQuery.data.map((item) => (
              <li key={item.commentId}>{item.content}</li>
            ))}
          </ul>
        ))}
      {mutation.data?.referenceChunks?.length ? (
        <ul className="mt-3 text-sm">
          <li>AI 참고 내용</li>
          {mutation.data.referenceChunks.map((chunk, index) => (
            <li key={`${index}-${chunk}`}>{chunk}</li>
          ))}
        </ul>
      ) : null}
      <textarea
        aria-label={`${question.representativeText} 답변 초안`}
        className="mt-3 w-full rounded border p-2"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          draftChangedWhileGenerating.current = true;
          setSentError("");
        }}
      />
      <button
        type="button"
        disabled={mutation.isPending || !draft.trim()}
        className="bg-layer-surface-primary text-text-inverse mt-2 rounded px-3 py-2 disabled:opacity-50"
        onClick={() => submit("SEND")}
      >
        답변 등록
      </button>
      {mutation.isError && (
        <QueryError
          error={mutation.error}
          disabled={mutation.isPending || (mutation.variables?.action === "SEND" && !draft.trim())}
          retry={() => {
            if (mutation.variables) submit(mutation.variables.action);
          }}
        />
      )}
      {sentError && <p role="alert">{sentError}</p>}
      {mutation.isSuccess && mutation.data.sent && <p role="status">답변이 등록되었습니다.</p>}
    </article>
  );
}

export function RealSellerLive({ liveId }: { liveId: string }) {
  const { state } = useAuth();
  const ownerId = state.status === "authenticated" ? state.user?.memberId : undefined;
  const privateEnabled = Boolean(ownerId);
  const [selectedInsight, setSelectedInsight] = useState<{
    liveId: string;
    ownerId: string;
    id: string;
  } | null>(null);
  const selectedInsightId =
    selectedInsight?.liveId === liveId && selectedInsight?.ownerId === ownerId
      ? selectedInsight.id
      : null;
  const playback = useQuery({
    queryKey: ["live", liveId, "playback"],
    queryFn: ({ signal }) => getPlayback(liveId, signal),
    retry: false,
  });
  const insights = useQuery({
    queryKey: ["live", liveId, "owner", ownerId, "insights"],
    queryFn: ({ signal }) => getInsights(liveId, signal),
    enabled: privateEnabled,
    retry: false,
  });
  const unanswered = useQuery({
    queryKey: ["live", liveId, "owner", ownerId, "unanswered"],
    queryFn: ({ signal }) => getUnanswered(liveId, signal),
    enabled: privateEnabled,
    retry: false,
  });
  const insightOriginals = useQuery({
    queryKey: ["live", liveId, "owner", ownerId, "insight-originals", selectedInsightId],
    queryFn: ({ signal }) => getOriginals(liveId, selectedInsightId!, signal),
    enabled: privateEnabled && selectedInsightId !== null,
    retry: false,
  });
  if (state.status === "guest")
    return (
      <SellerShell>
        <p className="p-6" role="alert">
          판매자 Q&amp;A를 보려면 로그인해야 합니다.
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
  return (
    <SellerShell>
      <div className={styles.console} aria-label={`LIVE 콘솔 ${liveId}`}>
        <div className={styles.grid}>
          <section
            className={`${styles.panel} p-4`}
            style={{ overflowY: "auto" }}
            aria-label="집계 Q&A"
          >
            <div className="mb-3 flex justify-between">
              <h1 className="text-title-s">집계 Q&A</h1>
              <button className="underline" type="button" onClick={() => void insights.refetch()}>
                새로고침
              </button>
            </div>
            {insights.isPending ? (
              <p>인사이트를 불러오는 중입니다.</p>
            ) : insights.isError ? (
              <QueryError error={insights.error} retry={() => void insights.refetch()} />
            ) : insights.data?.qna?.length ? (
              <ul className="space-y-2">
                {insights.data.qna.map((item) => (
                  <li key={item.questionId} className="rounded border p-2">
                    {item.summaryText}
                    <br />
                    <span className="text-sm">
                      질문 {item.count}건 · {answeredByLabel(item.answeredBy)}
                    </span>
                    {item.answerText && <p className="mt-1 text-sm">답변: {item.answerText}</p>}
                    <button
                      type="button"
                      className="mt-1 block text-sm underline"
                      onClick={() => setSelectedInsight({ liveId, ownerId, id: item.questionId })}
                    >
                      원문 보기
                    </button>
                    {selectedInsightId === item.questionId &&
                      (insightOriginals.isPending ? (
                        <p className="mt-1 text-sm">원문을 불러오는 중입니다.</p>
                      ) : insightOriginals.isError ? (
                        <QueryError
                          error={insightOriginals.error}
                          retry={() => void insightOriginals.refetch()}
                        />
                      ) : (
                        <ul className="mt-1 list-disc pl-5 text-sm">
                          {insightOriginals.data?.map((original) => (
                            <li key={original.commentId}>{original.content}</li>
                          ))}
                        </ul>
                      ))}
                  </li>
                ))}
              </ul>
            ) : (
              <p>인사이트가 없습니다.</p>
            )}
          </section>
          <section className={`${styles.panel} p-4`} aria-label="송출 모니터링">
            <h2 className="text-title-s mb-3">송출 모니터링</h2>
            {playback.isPending ? (
              <p>영상을 불러오는 중입니다.</p>
            ) : playback.isError ? (
              <QueryError error={playback.error} retry={() => void playback.refetch()} />
            ) : (
              <LivePlayer src={playback.data.playbackUrl} title="판매자 모니터링" />
            )}
            <p className="text-text-secondary mt-4 text-sm">
              실시간 채팅 게시, 큐시트와 하이라이트 생성은 제공하지 않습니다.
            </p>
          </section>
          <section
            className={`${styles.panel} p-4`}
            style={{ overflowY: "auto" }}
            aria-label="미답변 질문"
          >
            <div className="mb-3 flex justify-between">
              <h2 className="text-title-s">미답변 질문</h2>
              <button className="underline" type="button" onClick={() => void unanswered.refetch()}>
                새로고침
              </button>
            </div>
            {unanswered.isPending ? (
              <p>질문을 불러오는 중입니다.</p>
            ) : unanswered.isError ? (
              <QueryError error={unanswered.error} retry={() => void unanswered.refetch()} />
            ) : unanswered.data?.pending?.length ? (
              <div className="space-y-3">
                {unanswered.data.pending.map((question) => (
                  <SellerQuestion
                    key={`${liveId}:${ownerId}:${question.questionId}`}
                    liveId={liveId}
                    ownerId={ownerId}
                    question={question}
                  />
                ))}
              </div>
            ) : (
              <p>미답변 질문이 없습니다.</p>
            )}
          </section>
        </div>
      </div>
    </SellerShell>
  );
}
