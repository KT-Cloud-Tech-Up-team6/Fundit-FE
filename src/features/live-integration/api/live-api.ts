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
