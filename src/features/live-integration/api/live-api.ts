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
export type AnswerDraft = { draftAnswer: string | null; referenceChunks: string[]; sent: boolean };

const livePath = (liveId: string) => `/api/v1/lives/${encodeURIComponent(liveId)}`;

export const getPlayback = (liveId: string, signal?: AbortSignal) =>
  apiRequest<Playback>(`${livePath(liveId)}/playback`, { signal });
export const getVod = (liveId: string, signal?: AbortSignal) =>
  apiRequest<Playback>(`${livePath(liveId)}/vod`, { signal });
export const getAnsweredQuestions = (liveId: string, signal?: AbortSignal) =>
  apiRequest<AnsweredQuestion[]>(`${livePath(liveId)}/chat/answered-questions`, { signal });
export const getInsights = (liveId: string, signal?: AbortSignal) =>
  apiRequest<{ qna: Insight[] }>(`${livePath(liveId)}/chat/insights?topN=10`, {
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
  body: { action: "GENERATE" | "SEND"; finalAnswer?: string },
  signal?: AbortSignal,
) =>
  apiRequest<AnswerDraft>(
    `${livePath(liveId)}/chat/questions/${encodeURIComponent(questionId)}/ai-answer`,
    { auth: true, method: "POST", body, signal },
  );

/* 좋아요는 204를 돌려준다(LiveController) — 명세 초안의 `{liked, likeCount}`와 다르다.
   갱신된 수를 받을 수 없어 호출 뒤 playback을 다시 읽어 서버 값에 맞춘다.
   "내가 눌렀는지"를 알려주는 경로도 없어 진입 시에는 항상 꺼진 상태로 시작한다. */
export const likeLive = (liveId: string) =>
  apiRequest<void>(`${livePath(liveId)}/like`, { auth: true, method: "PUT" });
export const unlikeLive = (liveId: string) =>
  apiRequest<void>(`${livePath(liveId)}/like`, { auth: true, method: "DELETE" });

export type Highlight = {
  highlightId: string;
  sceneLabel: string;
  title: string;
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

export type VodChatMessage = { senderId: string; content: string; offsetSec: number };

/* 시점이 아니라 구간으로 받는다 — 시점마다 왕복하면 요청 수가 방송 길이만큼 늘어난다. */
export const getVodChat = (liveId: string, fromSec: number, toSec: number, signal?: AbortSignal) =>
  apiRequest<VodChatMessage[]>(`${livePath(liveId)}/vod/chat?fromSec=${fromSec}&toSec=${toSec}`, {
    signal,
  });
