import { apiRequest } from "@/shared/api/client";

export type Playback = {
  liveId: string;
  type: "LIVE" | "VOD";
  playbackUrl: string;
  projectId: string;
  likeCount: number;
  vodReadyAt: string | null;
};

export type AnsweredQuestion = {
  questionId: string;
  summaryText: string;
  questionCount: number;
  answerText: string;
  answeredBy: string;
  answeredAt: string | null;
};

export type Insight = {
  questionId: string;
  summaryText: string;
  count: number;
  category: string;
  answeredBy: string;
  answeredAt: string | null;
  answerText: string | null;
  promoted: boolean;
};
export type PendingQuestion = { questionId: string; representativeText: string; count: number };
export type OriginalMessage = { commentId: string; content: string; atMs: number };
/** 초안을 만들지 못하면 BE가 null인 `draftAnswer`를 응답에서 뺀다(non_null). */
export type AnswerDraft = { draftAnswer?: string | null; referenceChunks: string[]; sent: boolean };

const livePath = (liveId: string) => `/api/v1/lives/${encodeURIComponent(liveId)}`;

export const getPlayback = (liveId: string, signal?: AbortSignal) =>
  apiRequest<Playback>(`${livePath(liveId)}/playback`, { signal });
export const getVod = (liveId: string, signal?: AbortSignal) =>
  apiRequest<Playback>(`${livePath(liveId)}/vod`, { signal });
/* BE는 null인 `answerText`를 응답에서 뺀다(non_null, #390). 답변 본문이 없는 행은 구매자 Q&A·콘솔
   집계·LIVE 체크 어디에도 보일 답이 없어 여기서 한 번 거른다. */
export const getAnsweredQuestions = (liveId: string, signal?: AbortSignal) =>
  apiRequest<(Omit<AnsweredQuestion, "answerText"> & { answerText?: string | null })[]>(
    `${livePath(liveId)}/chat/answered-questions`,
    { signal },
  ).then((list) =>
    list.filter((item): item is AnsweredQuestion => Boolean(item.answerText?.trim())),
  );
/* `PREPARING`은 AI 상품정보 색인 전이다. 목록이 비었을 때 "모인 질문 없음"과 다른 문구로
   안내해야 한다(요구사항 6.4.4.4). 이 호출이 BE에 AI 집계를 가져오게 하므로 주기적으로 부른다. */
export type AiStatus = "PREPARING" | "READY";
export const getInsights = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ aiStatus: AiStatus; qna: Insight[] }>(`${livePath(liveId)}/chat/insights?topN=10`, {
    auth: true,
    signal,
  });
export const getUnanswered = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ pending: PendingQuestion[]; answered: PendingQuestion[] }>(
    `${livePath(liveId)}/chat/unanswered?topN=10`,
    { auth: true, signal },
  );
export const getOriginals = (liveId: string, questionId: string, signal?: AbortSignal) =>
  apiRequest<OriginalMessage[]>(
    `${livePath(liveId)}/chat/questions/${encodeURIComponent(questionId)}`,
    { auth: true, signal },
  );
export const requestAnswer = (
  liveId: string,
  questionId: string,
  body: { action: "GENERATE" | "SEND" | "MARK_DONE"; finalAnswer?: string },
  signal?: AbortSignal,
) =>
  apiRequest<AnswerDraft>(
    `${livePath(liveId)}/chat/questions/${encodeURIComponent(questionId)}/ai-answer`,
    { auth: true, method: "POST", body, signal },
  );

/* 좋아요·취소는 갱신된 수를 함께 돌려준다(BE #123 LikeResponse). 둘 다 idempotent다. */
export type LikeResult = { liked: boolean; likeCount: number };
export const likeLive = (liveId: string) =>
  apiRequest<LikeResult>(`${livePath(liveId)}/like`, { auth: true, method: "PUT" });
export const unlikeLive = (liveId: string) =>
  apiRequest<LikeResult>(`${livePath(liveId)}/like`, { auth: true, method: "DELETE" });
/* 목록·재생 응답은 비인증이라 내 좋아요 여부는 이 인증 경로로만 알 수 있다. */
export const getLiveLiked = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ liked: boolean }>(`${livePath(liveId)}/like`, { auth: true, signal });

export type Highlight = {
  highlightId: string;
  sceneLabel: string;
  /** AI 하이라이트 제목은 선택값이라 없으면 BE가 응답에서 뺀다(non_null). */
  title?: string | null;
  startSec: number;
  endSec: number | null;
  clipUrl: string | null;
  caption: string | null;
  isPublic: boolean;
  generationStatus: string;
};

/* 이 호출이 조회 수로 잡힌다(BE 주석). 구간을 고를 때마다 다시 부르지 않는다. */
export const getPublicHighlights = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ markers: Highlight[]; clips: Highlight[] }>(
    `${livePath(liveId)}/highlights/public`,
    { signal },
  );

/* 판매자 검토용 목록. 비공개·생성 중·실패 항목까지 온다. `/public`과 달리 조회 수로 잡히지 않는다. */
export const getHighlights = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ markers: Highlight[]; clips: Highlight[] }>(`${livePath(liveId)}/highlights`, {
    auth: true,
    signal,
  });

/* 204라 본문이 없다. 생성이 끝나지 않은 항목을 공개하면 409, 남의 LIVE·항목이면 404다. */
export const setHighlightVisibility = (liveId: string, highlightId: string, isPublic: boolean) =>
  apiRequest<void>(`${livePath(liveId)}/highlights/${encodeURIComponent(highlightId)}/visibility`, {
    auth: true,
    method: "PATCH",
    body: { isPublic },
  });

/* 쇼츠 클릭 기록(전환 동선 추적). 비인증이고 204라 본문이 없다. 조회 수(`/public`)와 따로 잡힌다. */
export const recordHighlightClick = (liveId: string, highlightId: string) =>
  apiRequest<void>(`${livePath(liveId)}/highlights/${encodeURIComponent(highlightId)}/click`, {
    method: "POST",
  });

export type VodChatMessage = { senderId: string; content: string; offsetSec: number };

/* 시점이 아니라 구간으로 받는다 — 시점마다 왕복하면 요청 수가 방송 길이만큼 늘어난다. */
export const getVodChat = (liveId: string, fromSec: number, toSec: number, signal?: AbortSignal) =>
  apiRequest<VodChatMessage[]>(`${livePath(liveId)}/vod/chat?fromSec=${fromSec}&toSec=${toSec}`, {
    signal,
  });
