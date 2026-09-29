"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { ApiError } from "@/shared/api/api-error";
import { createChatToken } from "../api/live-api";
import {
  appendEntry,
  chatEndpoint,
  nextReconnect,
  parseChatFrame,
  removeEntry,
  sendMessageFrame,
  sendResultOf,
  stopsReconnect,
  type ChatEntry,
  type SendResult,
} from "./ivs-chat";

/* 보낸 메시지가 이 안에 되돌아오지 않으면 실패로 안내한다. 입력은 지우지 않아 다시 보낼 수 있다. */
const SEND_TIMEOUT_MS = 5_000;

type ChatState = { memberId: string | undefined; entries: ChatEntry[]; received: number };
type ChatAction =
  | { type: "entry"; memberId: string; entry: ChatEntry }
  | { type: "delete"; memberId: string; messageId: string };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  /* 다른 회원으로 바뀌었으면 이전 회원이 받은 목록을 이어 쓰지 않는다. */
  const current =
    state.memberId === action.memberId
      ? state
      : { memberId: action.memberId, entries: [], received: 0 };
  if (action.type === "delete")
    return { ...current, entries: removeEntry(current.entries, action.messageId) };
  return {
    ...current,
    entries: appendEntry(current.entries, action.entry),
    received: current.received + 1,
  };
}

const emptyState: ChatState = { memberId: undefined, entries: [], received: 0 };

export type LiveChatConnection = {
  entries: ChatEntry[];
  /** 이 화면에서 받은 채팅 수. 지워졌거나 한도로 버린 줄도 센다. */
  received: number;
  /** 서버가 같은 요청 id로 메시지를 되돌려주면 `sent`다. 거절·5초 무응답·연결 없음이면 실패다. */
  send: (text: string) => Promise<SendResult>;
};

/**
 * IVS 채팅 연결(#470). `enabled`(방송 중)이고 회원 정보가 있을 때만 토큰을 받아 브라우저 WebSocket으로
 * 직접 붙는다. 토큰은 한 번만 쓸 수 있어, 끊기면(세션 60분 만료 포함) 새 토큰으로 다시 붙는다. 토큰 API가
 * 401·404·409면 멈추고, 화면을 떠나거나 방송 중이 아니게 되면 닫는다. 연결 실패는 채팅에만 머물러
 * 영상·Q&A를 막지 않는다. 판매자 답변 이벤트가 오면 답변된 질문 목록을 다시 받는다.
 */
export function useLiveChat({
  liveId,
  memberId,
  enabled,
}: {
  liveId: string;
  memberId: string | undefined;
  enabled: boolean;
}): LiveChatConnection {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(chatReducer, emptyState);
  const socketRef = useRef<WebSocket | null>(null);
  /* 요청 id → 결과를 알릴 함수. 되돌아온 메시지·오류·시간 초과·연결 종료 중 먼저 온 것 하나로 끝난다. */
  const pending = useRef(new Map<string, (result: SendResult) => void>());

  useEffect(() => {
    if (!enabled || memberId === undefined) return;
    const member = memberId;
    const waiting = pending.current;
    let stopped = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const failPending = () => {
      for (const settle of waiting.values()) settle("failed");
    };
    const retry = (openedMs: number) => {
      const plan = nextReconnect(failures, openedMs);
      failures = plan.failures;
      timer = setTimeout(() => void connect(), plan.delayMs);
    };

    function receive(data: unknown) {
      if (stopped || typeof data !== "string") return;
      const frame = parseChatFrame(data);
      if (!frame) return;
      if (frame.type === "error") {
        if (frame.requestId) waiting.get(frame.requestId)?.(sendResultOf(frame.code));
        return;
      }
      if (frame.type === "delete") {
        dispatch({ type: "delete", memberId: member, messageId: frame.messageId });
        return;
      }
      dispatch({ type: "entry", memberId: member, entry: frame.entry });
      if (frame.requestId) waiting.get(frame.requestId)?.("sent");
      if (frame.entry.kind === "seller-answer")
        void queryClient.invalidateQueries({ queryKey: ["live", liveId, "answered-questions"] });
    }

    async function connect() {
      let token: Awaited<ReturnType<typeof createChatToken>>;
      try {
        token = await createChatToken(liveId);
      } catch (error) {
        if (stopped || (error instanceof ApiError && stopsReconnect(error.status))) return;
        retry(0);
        return;
      }
      if (stopped) return;
      const endpoint = chatEndpoint(token.roomArn);
      /* BE가 다른 형식의 ARN을 주면 다시 받아도 같다. 붙을 곳이 없어 멈춘다. */
      if (!endpoint) return;
      let current: WebSocket;
      try {
        /* IVS는 토큰을 WebSocket 하위 프로토콜(Sec-WebSocket-Protocol)로 받는다. */
        current = new WebSocket(endpoint, token.token);
      } catch {
        retry(0);
        return;
      }
      socket = current;
      let openedAt = 0;
      current.onopen = () => {
        if (stopped) return;
        openedAt = Date.now();
        socketRef.current = current;
      };
      current.onmessage = (event) => receive(event.data);
      current.onclose = () => {
        if (socketRef.current === current) socketRef.current = null;
        failPending();
        if (!stopped) retry(openedAt ? Date.now() - openedAt : 0);
      };
    }

    void connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      /* 옛 소켓의 늦은 종료 이벤트가 다음 연결의 전송 대기(`pending`)까지 실패로 끝내지 않게 핸들러를 먼저 뗀다. */
      if (socket) {
        socket.onopen = socket.onmessage = socket.onclose = null;
        socket.close();
      }
      socketRef.current = null;
      failPending();
    };
  }, [enabled, liveId, memberId, queryClient]);

  const send = useCallback(
    (content: string) =>
      new Promise<SendResult>((resolve) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          resolve("failed");
          return;
        }
        /* 보안 맥락이 아닌 주소(사내망 http 등)에서도 쓸 수 있게 crypto.randomUUID 대신 만든다. */
        const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        const settle = (result: SendResult) => {
          clearTimeout(timeout);
          pending.current.delete(requestId);
          resolve(result);
        };
        const timeout = setTimeout(() => settle("failed"), SEND_TIMEOUT_MS);
        pending.current.set(requestId, settle);
        socket.send(sendMessageFrame(requestId, content));
      }),
    [],
  );

  const own = state.memberId === memberId;
  return {
    entries: own ? state.entries : emptyState.entries,
    received: own ? state.received : 0,
    send,
  };
}
