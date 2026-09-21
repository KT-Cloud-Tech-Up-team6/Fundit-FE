"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { BuyerLiveDesktop } from "@/features/buyer-live-room/ui/buyer-live-desktop";
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
  getUnanswered,
  getVod,
  requestAnswer,
  type PendingQuestion,
} from "../api/live-api";
import { LivePlayer } from "./live-player";

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
  desktop = false,
}: {
  liveId: string;
  replay?: boolean;
  desktop?: boolean;
}) {
  const playback = useQuery({
    queryKey: ["live", liveId, replay ? "vod" : "playback"],
    queryFn: ({ signal }) => (replay ? getVod(liveId, signal) : getPlayback(liveId, signal)),
    retry: false,
  });
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
  const isVod = replay || playback.data?.type === "VOD";
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
        chapters={[]}
        video={video}
        videoConnected={playback.isSuccess}
        demoMode={false}
      />
    );
  return (
    <BuyerLiveRoom
      liveId={liveId}
      product={{ ...realProduct, title: isVod ? "다시보기" : "라이브 방송" }}
      video={video}
      questionsData={questionData}
      questionsState={questionState}
      demoMode={false}
      onRefreshQuestions={() => void questions.refetch()}
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
      {mutation.data?.referenceChunks.length ? (
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
            ) : insights.data?.qna.length ? (
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
            ) : unanswered.data?.pending.length ? (
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
