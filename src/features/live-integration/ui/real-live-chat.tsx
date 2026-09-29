"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/providers/auth-provider";
import { getPlayback } from "../api/live-api";
import { useLiveChat, type LiveChatConnection } from "../model/use-live-chat";

const LiveChatContext = createContext<LiveChatConnection | null>(null);

/**
 * 구매자 LIVE 화면의 채팅 연결(#470). `LiveViewport`는 모바일 트리를 먼저 그린 뒤 넓은 화면이면 데스크톱
 * 트리로 바꾸므로 `RealBuyerLive`가 두 번 마운트된다. 연결을 그 위에 두어 토큰 요청과 소켓을 한 번만 연다.
 * 방송 중(LIVE)이고 로그인해 회원 정보가 있을 때만 붙는다. 다시보기 주소면 부르지 않는다.
 */
export function RealLiveChatProvider({
  liveId,
  replay,
  children,
}: {
  liveId: string;
  replay: boolean;
  children: ReactNode;
}) {
  const { state } = useAuth();
  const memberId = state.status === "authenticated" ? state.user?.memberId : undefined;
  /* RealBuyerLive와 같은 키·조회라 요청은 한 번이고 캐시를 함께 쓴다. */
  const playback = useQuery({
    queryKey: ["live", liveId, "playback"],
    queryFn: ({ signal }) => getPlayback(liveId, signal),
    enabled: !replay,
    retry: false,
  });
  const chat = useLiveChat({
    liveId,
    memberId,
    enabled: !replay && playback.data?.type === "LIVE",
  });
  return <LiveChatContext.Provider value={chat}>{children}</LiveChatContext.Provider>;
}

/** 이 페이지의 채팅 연결. 제공자 밖(데모 경로)이면 null이다. */
export function useLiveChatConnection() {
  return useContext(LiveChatContext);
}
