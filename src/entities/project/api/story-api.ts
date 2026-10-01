import { apiRequest, apiStreamRequest } from "../../../shared/api/client";
import type { ProjectPageSummary } from "./buyer-project-api";
import type { ProjectApiStatus } from "./seller-project-api";

/* 소유자용 미리보기는 구매자 공개 상세와 같은 ProjectDetailResponse를 돌려준다. 스토리 편집에
   필요한 항목 외에 미리보기 모달이 쓰는 판매자·목표 금액·펀딩 현황도 같은 응답에 있다. */
export type StoryPreviewResponse = {
  projectId: string;
  status: ProjectApiStatus;
  title: string | null;
  coverImageUrl: string | null;
  introContent: IntroBlock[];
  goalAmount: number | null;
  fundingStatus: {
    currentAmount: number;
    achievementRate: number;
    participantCount: number;
    /** 마감이 없으면 BE가 null로 계산하고 키를 뺀다(non_null). */
    remainingDays?: number | null;
  };
  hasLiveVerification: boolean;
  seller: { sellerId: string; displayName: string };
  /** 저장된 내용 기준 AI 요약(#407). 초안은 요약 대상이 아니라 늘 빠진다. */
  pageSummary?: ProjectPageSummary | null;
};
export function getStoryPreview(projectId: string, signal?: AbortSignal) {
  return apiRequest<StoryPreviewResponse>(`/api/v1/projects/${projectId}/preview`, {
    auth: true,
    signal,
  });
}

export type IntroBlock =
  | { type: "TEXT"; value: string }
  | { type: "IMAGE"; value: string }
  | { type: "VIDEO_URL"; value: string };
export type StoryRequest = { title: string; coverImageUrl?: string; introContent: IntroBlock[] };
export function saveProjectStory(projectId: string, body: StoryRequest) {
  return apiRequest<{ projectId: string; updatedAt: string }>(
    `/api/v1/projects/${projectId}/story`,
    { auth: true, method: "PATCH", body },
  );
}

export type FundingStoryMessage = { role: "user" | "assistant"; text: string };
export type FundingStorySummary = {
  product: string;
  story: string;
  strengths: { title: string; description: string }[];
};
export type FundingStorySession = {
  session_id: string;
  revision: number;
  confirmed_revision?: number | null;
  messages: FundingStoryMessage[];
  missing: string[];
  summary?: FundingStorySummary | null;
  active_chat_id?: string | null;
};

export function isFundingStorySessionSynchronized(
  session: FundingStorySession,
  minimumRevision: number,
) {
  // BE의 null 생략 응답에서도 진행 중인 채팅이 없다는 뜻은 같다.
  return session.revision >= minimumRevision && session.active_chat_id == null;
}
export type FundingStoryChatAccepted = { chat_id: string; status: "queued" };
export type FundingStoryAsyncError = {
  code: string;
  message: string;
  retryable: boolean;
  detail: unknown;
};
export type FundingStoryFailedSlot = {
  slot_id: string;
  stage: "generation" | "rendering" | "upload";
  error: FundingStoryAsyncError;
};
export type FundingStoryRun = {
  run_id: string;
  status: "queued" | "running" | "succeeded" | "partially_succeeded" | "failed" | "discarded";
  result: null | {
    cover_image_url: string | null;
    intro_content: Extract<IntroBlock, { type: "TEXT" | "IMAGE" }>[];
  };
  failed_slots: FundingStoryFailedSlot[];
  error: FundingStoryAsyncError | null;
};

const projectHeaders = (projectId: string) => ({ "X-Project-Id": projectId });

export function getLatestFundingStorySession(projectId: string, signal?: AbortSignal) {
  return apiRequest<{ session?: FundingStorySession | null }>(`/api/v1/ai/sessions/latest`, {
    auth: true,
    headers: projectHeaders(projectId),
    signal,
  });
}

export function createFundingStorySession(projectId: string, signal?: AbortSignal) {
  return apiRequest<FundingStorySession>(`/api/v1/ai/sessions`, {
    auth: true,
    method: "POST",
    headers: projectHeaders(projectId),
    body: {},
    signal,
  });
}

export function getFundingStorySession(projectId: string, sessionId: string, signal?: AbortSignal) {
  return apiRequest<FundingStorySession>(`/api/v1/ai/sessions/${sessionId}`, {
    auth: true,
    headers: projectHeaders(projectId),
    signal,
  });
}

export function startFundingStorySession(
  projectId: string,
  sessionId: string,
  signal?: AbortSignal,
) {
  return apiRequest<FundingStoryChatAccepted>(`/api/v1/ai/sessions/${sessionId}/start`, {
    auth: true,
    method: "POST",
    headers: projectHeaders(projectId),
    signal,
  });
}

export function sendFundingStoryMessage(
  projectId: string,
  sessionId: string,
  revision: number,
  text: string,
  signal?: AbortSignal,
) {
  return apiRequest<FundingStoryChatAccepted>(`/api/v1/ai/sessions/${sessionId}/messages`, {
    auth: true,
    method: "POST",
    headers: projectHeaders(projectId),
    body: { message_id: crypto.randomUUID(), revision, text },
    signal,
  });
}

export type FundingStoryChatDone = {
  chat_id: string;
  status: "succeeded" | "failed";
  session_id: string;
  revision: number;
  error: FundingStoryAsyncError | null;
};

export async function streamFundingStoryChat(
  projectId: string,
  chatId: string,
  onMessage: (text: string) => void,
  signal?: AbortSignal,
): Promise<FundingStoryChatDone> {
  const response = await apiStreamRequest(`/api/v1/ai/chats/${chatId}/events`, {
    auth: true,
    headers: { ...projectHeaders(projectId), Accept: "text/event-stream" },
    signal,
  });
  if (!response.body) throw new Error("AI 응답 스트림을 열지 못했습니다.");
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let done: FundingStoryChatDone | null = null;
  while (!done) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer = `${buffer}${chunk.value}`.replaceAll("\r\n", "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      let event = "message";
      const data: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
      }
      if (data.length) {
        const payload = JSON.parse(data.join("\n")) as Record<string, unknown>;
        if (event === "message" && typeof payload.text === "string") onMessage(payload.text);
        if (event === "done") done = payload as FundingStoryChatDone;
      }
      boundary = buffer.indexOf("\n\n");
    }
  }
  if (!done) throw new Error("AI 응답 스트림이 완료 전에 종료되었습니다.");
  if (done.status === "failed")
    throw new Error(done.error?.message ?? "AI 응답 생성에 실패했습니다.");
  return done;
}

export function confirmFundingStorySession(
  projectId: string,
  sessionId: string,
  revision: number,
  signal?: AbortSignal,
) {
  return apiRequest<{ session_id: string; confirmed_revision: number }>(
    `/api/v1/ai/sessions/${sessionId}/confirm`,
    {
      auth: true,
      method: "POST",
      headers: projectHeaders(projectId),
      body: { revision },
      signal,
    },
  );
}

export function createFundingStoryRun(
  projectId: string,
  sessionId: string,
  confirmedRevision: number,
  idempotencyKey: string,
  signal?: AbortSignal,
) {
  return apiRequest<{ run_id: string; status: "queued" }>(`/api/v1/ai/runs`, {
    auth: true,
    method: "POST",
    headers: projectHeaders(projectId),
    body: {
      session_id: sessionId,
      confirmed_revision: confirmedRevision,
      idempotency_key: idempotencyKey,
    },
    signal,
  });
}

/**
 * AI 서버 작업 자체는 계속될 수 있지만, 이 run의 완료 결과를 프로젝트 스토리에 반영하지 않는다.
 * run ID를 받기 전에는 생성 요청에 사용한 같은 idempotency key를 전달한다.
 */
export function discardFundingStoryRun(
  projectId: string,
  target: { runId: string } | { idempotencyKey: string },
) {
  return apiRequest<void>(`/api/v1/ai/runs/discard`, {
    auth: true,
    method: "POST",
    headers: projectHeaders(projectId),
    body: "runId" in target ? { run_id: target.runId } : { idempotency_key: target.idempotencyKey },
  });
}

export function getFundingStoryRun(projectId: string, runId: string, signal?: AbortSignal) {
  return apiRequest<FundingStoryRun>(`/api/v1/ai/runs/${runId}`, {
    auth: true,
    headers: projectHeaders(projectId),
    signal,
  });
}

const wait = (milliseconds: number, signal?: AbortSignal) => {
  signal?.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      globalThis.clearTimeout(timer);
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };
    const timer = globalThis.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

export async function waitForFundingStoryRun(
  projectId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<FundingStoryRun> {
  for (let attempt = 0; attempt < 200; attempt++) {
    const run = await getFundingStoryRun(projectId, runId, signal);
    if (!["queued", "running"].includes(run.status)) return run;
    await wait(1_500, signal);
  }
  throw new Error("AI 생성 시간이 초과되었습니다. 생성 상태를 다시 확인해주세요.");
}
