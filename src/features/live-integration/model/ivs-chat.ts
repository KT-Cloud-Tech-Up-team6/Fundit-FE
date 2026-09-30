/*
 * IVS Chat Messaging API(WebSocket) 프레임과 채팅 표시 규칙(#470). 공급자 형식(`Type`·`Sender` 등)은
 * 이 파일과 연결 훅(`use-live-chat.ts`) 안에서만 다루고, 화면에는 `ChatRow`만 넘긴다.
 * 형식: https://docs.aws.amazon.com/ivs/latest/chatmsgapireference/welcome.html
 */

/** 받은 채팅 한 건. 공급자와 무관한 형태다. */
export type ChatEntry =
  /** `nickname`은 BE가 토큰 속성으로 싣는다. 조회 실패·탈퇴 회원이면 없다(BE #197). */
  | { kind: "message"; id: string; senderId: string; nickname?: string; text: string }
  /** BE가 판매자 답변 등록 뒤 올리는 이벤트. 속성 한도(4KB)를 넘으면 `answer` 없이 온다. */
  | { kind: "seller-answer"; id: string; questionId: string; answer?: string }
  /** BE가 근거를 찾은 AI 답변을 올리는 이벤트. `commentId`는 BE DB id라 IVS 메시지와 맞출 수 없다. */
  | { kind: "ai-answer"; id: string; answer: string };

export type ChatFrame =
  | { type: "entry"; entry: ChatEntry; requestId?: string }
  /** 시스템 이벤트 `aws:DELETE_MESSAGE`. 그 메시지를 목록에서 뺀다. */
  | { type: "delete"; messageId: string }
  | { type: "error"; code: number; requestId?: string };

/** 화면 한 줄. `ai`면 라벨을 윗줄에 두고 본문을 초록으로 그린다(Figma 295:50452). */
export type ChatRow = { id: string; author: string; text: string; ai?: boolean };

export type SendResult = "sent" | "rejected" | "failed";

/** 한 화면에 들고 있는 채팅 수. 긴 방송에서 목록이 끝없이 늘지 않게 오래된 것부터 버린다. */
export const MAX_CHAT_ENTRIES = 300;

/** 메시지 길이 한도. IVS 기본값이 500 코드 포인트라 입력칸도 500자로 막는다. */
export const MAX_CHAT_LENGTH = 500;

/** 방(`arn:aws:ivschat:<region>:<account>:room/<id>`)과 같은 리전의 메시징 엔드포인트. 형식이 다르면 null이다. */
export function chatEndpoint(roomArn: string) {
  const region = /^arn:aws:ivschat:([a-z0-9-]+):[^:]*:room\/./.exec(roomArn)?.[1];
  return region ? `wss://edge.ivschat.${region}.amazonaws.com` : null;
}

export function sendMessageFrame(requestId: string, content: string) {
  return JSON.stringify({ Action: "SEND_MESSAGE", RequestId: requestId, Content: content });
}

type FrameRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is FrameRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/** 받은 텍스트 프레임을 읽는다. 화면이 쓰지 않는 이벤트나 알 수 없는 형식은 null이다. */
export function parseChatFrame(data: string): ChatFrame | null {
  let frame: unknown;
  try {
    frame = JSON.parse(data);
  } catch {
    return null;
  }
  if (!isRecord(frame)) return null;
  const id = text(frame.Id);
  const requestId = text(frame.RequestId);
  if (frame.Type === "ERROR")
    return {
      type: "error",
      code: typeof frame.ErrorCode === "number" ? frame.ErrorCode : 0,
      requestId,
    };
  if (!id) return null;
  if (frame.Type === "MESSAGE") {
    const content = text(frame.Content);
    if (content === undefined) return null;
    const sender = isRecord(frame.Sender) ? frame.Sender : {};
    const senderId = text(sender.UserId) ?? "";
    const nickname = isRecord(sender.Attributes) ? text(sender.Attributes.nickname) : undefined;
    return {
      type: "entry",
      requestId,
      entry: {
        kind: "message",
        id,
        senderId,
        ...(nickname?.trim() ? { nickname } : {}),
        text: content,
      },
    };
  }
  if (frame.Type !== "EVENT") return null;
  const attributes = isRecord(frame.Attributes) ? frame.Attributes : {};
  /* 답변은 BE가 원문 그대로 싣는다(정책 항목 가공 금지). 비어 있을 때만 없는 것으로 본다. */
  const rawAnswer = text(attributes.answer);
  const answer = rawAnswer?.trim() ? rawAnswer : undefined;
  if (frame.EventName === "seller-answer") {
    const questionId = text(attributes.questionId);
    return questionId
      ? { type: "entry", entry: { kind: "seller-answer", id, questionId, answer } }
      : null;
  }
  if (frame.EventName === "ai-answer")
    return answer ? { type: "entry", entry: { kind: "ai-answer", id, answer } } : null;
  if (frame.EventName === "aws:DELETE_MESSAGE") {
    /* `MessageID`는 AWS가 폐기 예정으로 둔 옛 이름이다. */
    const messageId = text(attributes.MessageId) ?? text(attributes.MessageID);
    return messageId ? { type: "delete", messageId } : null;
  }
  return null;
}

/** 서버 거절 코드 → 전송 결과. 406(메시지 검토 거절)만 부적절한 단어 안내이고 나머지는 재시도 안내다. */
export function sendResultOf(errorCode: number): SendResult {
  return errorCode === 406 ? "rejected" : "failed";
}

/**
 * 작성자 라벨(2026-09-30 사용자 결정). 판매자 "판매자", 본인 "나"(소비자 Prototype 295:50208), 그 밖은
 * 아이디 자리(Figma 1408:42073)에 닉네임이고 닉네임이 없으면 "시청자"다. 판매자를 먼저 본다 — 콘솔에서는
 * 로그인한 판매자 자신의 메시지도 "판매자"로 보여야 한다.
 */
export function authorLabel(
  senderId: string,
  nickname: string | undefined,
  viewer: { memberId?: string; sellerId?: string },
) {
  if (viewer.sellerId && senderId === viewer.sellerId) return "판매자";
  if (viewer.memberId && senderId === viewer.memberId) return "나";
  return nickname ?? "시청자";
}

/**
 * 받은 채팅 → 화면 줄. 판매자 답변은 "판매자 @everyone 본문"(판매자 Prototype 170:72652), AI 답변은
 * "AI 매니저" 라벨 줄 아래 본문(Figma 295:50452)이다. 본문 없이 온 판매자 답변은 답변된 질문 목록에서
 * 찾고, 아직 없으면(목록을 다시 받는 중) 그 줄을 그리지 않는다.
 */
export function toChatRows(
  entries: ChatEntry[],
  viewer: {
    memberId?: string;
    sellerId?: string;
    answered?: { questionId: string; answerText: string }[];
  },
): ChatRow[] {
  const rows: ChatRow[] = [];
  for (const entry of entries) {
    if (entry.kind === "message")
      rows.push({
        id: entry.id,
        author: authorLabel(entry.senderId, entry.nickname, viewer),
        text: entry.text,
      });
    else if (entry.kind === "ai-answer")
      rows.push({ id: entry.id, author: "AI 매니저", text: entry.answer, ai: true });
    else {
      const answer =
        entry.answer ??
        viewer.answered?.find((item) => item.questionId === entry.questionId)?.answerText;
      if (answer) rows.push({ id: entry.id, author: "판매자", text: `@everyone ${answer}` });
    }
  }
  return rows;
}

/** 받은 채팅을 덧붙인다. 한도를 넘으면 오래된 것부터 버린다. */
export function appendEntry(entries: ChatEntry[], entry: ChatEntry) {
  const next = [...entries, entry];
  return next.length > MAX_CHAT_ENTRIES ? next.slice(-MAX_CHAT_ENTRIES) : next;
}

export function removeEntry(entries: ChatEntry[], messageId: string) {
  return entries.some((entry) => entry.id === messageId)
    ? entries.filter((entry) => entry.id !== messageId)
    : entries;
}

/**
 * 입장 전 채팅을 받을 구간(초). BE 구간 상한(600초)이 방송 길이 상한(요구사항 6.2.3, 10분)과 같아 한 번에
 * 방송 전체를 읽는다. 구매자가 방송 시작 시각을 받을 단건 API가 없어 경과 초 대신 상한을 쓴다.
 */
export const HISTORY_RANGE_SEC = 600;

/** BE 구간 채팅(`vod/chat`) 한 줄 → 받은 채팅. `messageId`는 IVS 메시지 `Id`와 같은 값이다(BE #197). */
export function historyEntries(
  messages: { messageId: string; senderId: string; nickname?: string | null; content: string }[],
): ChatEntry[] {
  return messages.map(({ messageId, senderId, nickname, content }) => ({
    kind: "message",
    id: messageId,
    senderId,
    ...(nickname?.trim() ? { nickname } : {}),
    text: content,
  }));
}

/**
 * 입장 전 채팅을 앞에 채운다. IVS는 새로 연결한 클라이언트에 지난 메시지를 주지 않는다. 연결이 열린 뒤
 * 조회하므로 그사이 받은 메시지와 겹칠 수 있어 메시지 id로 거른다. 겹치지 않는 줄은 모두 연결 전에 온
 * 것이라 받은 줄보다 앞에 둔다. 한도를 넘으면 오래된 것부터 버린다. `added`는 새로 채운 줄 수다.
 */
export function prependHistory(entries: ChatEntry[], history: ChatEntry[]) {
  const received = new Set(entries.map((entry) => entry.id));
  const earlier = history.filter((entry) => !received.has(entry.id));
  const next = [...earlier, ...entries];
  return {
    entries: next.length > MAX_CHAT_ENTRIES ? next.slice(-MAX_CHAT_ENTRIES) : next,
    added: earlier.length,
  };
}

/**
 * 토큰 API 오류 중 다시 받아도 같은 결과라 재연결을 멈출 것. 401(회원의 로그인 만료, 갱신도 실패),
 * 404(없거나 DRAFT인 LIVE), 409(방송 중이 아님 — 시작 전·종료)다. 503 등은 잠시 뒤 다시 시도한다.
 */
export function stopsReconnect(status: number | undefined) {
  return status === 401 || status === 404 || status === 409;
}

/** 이만큼 열려 있다 끊긴 연결은 정상 종료(세션 60분 만료 등)로 보고 실패 횟수를 되돌린다. */
export const STABLE_CONNECTION_MS = 30_000;

/**
 * 끊기거나 토큰을 받지 못한 뒤의 재연결 계획. 연속 실패마다 1초에서 두 배씩 늘려 30초에서 멈춘다.
 * `openedMs`는 직전 연결이 열려 있던 시간이다(열리지 못했으면 0).
 */
export function nextReconnect(failures: number, openedMs: number) {
  const streak = openedMs >= STABLE_CONNECTION_MS ? 0 : failures;
  return { delayMs: Math.min(30_000, 1_000 * 2 ** streak), failures: streak + 1 };
}
