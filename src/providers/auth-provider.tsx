"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";

import { getMe, refreshAccessToken } from "@/features/auth/api/auth-api";
import type { AuthUser } from "@/features/auth/api/auth-types";
import { authTokenStore } from "@/shared/api/auth-token-store";

export type AuthSessionState =
  | { accessToken: null; status: "checking"; user: null }
  | { accessToken: null; status: "guest"; user: null }
  | { accessToken: string; status: "authenticated"; user: AuthUser | null };

type AuthEvent =
  | { accessToken: string; type: "AUTHENTICATED" }
  | { type: "USER_LOADED"; user: AuthUser }
  | { type: "SESSION_FAILED" };

function authReducer(state: AuthSessionState, event: AuthEvent): AuthSessionState {
  switch (event.type) {
    case "AUTHENTICATED":
      return { accessToken: event.accessToken, status: "authenticated", user: null };
    case "USER_LOADED":
      return state.status === "authenticated" ? { ...state, user: event.user } : state;
    case "SESSION_FAILED":
      return { accessToken: null, status: "guest", user: null };
  }
}

type AuthContextValue = {
  authenticate: (accessToken: string) => Promise<void>;
  clearSession: () => void;
  state: AuthSessionState;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(authReducer, {
    accessToken: null,
    status: "checking",
    user: null,
  });
  const restoreStarted = useRef(false);
  const statusRef = useRef(state.status);
  /* authenticate()·clearSession()이 먼저 끝나면 배경 세션 복구가 그 결과를 덮어쓰지 않게 막는다. */
  const restoreSupersededRef = useRef(false);

  useEffect(() => {
    statusRef.current = state.status;
  }, [state.status]);

  /* client.ts의 백그라운드 401 refresh 실패는 authTokenStore를 직접 비운다.
     AuthProvider가 구독하지 않으면 이 상태 머신은 그 사실을 모른 채 "authenticated"로
     남아, 토큰 없는 요청만 계속 나가는 화면이 된다. */
  useEffect(() => {
    return authTokenStore.subscribe((accessToken) => {
      if (accessToken === null && statusRef.current === "authenticated") {
        queryClient.clear();
        dispatch({ type: "SESSION_FAILED" });
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    void (async () => {
      try {
        const { accessToken } = await refreshAccessToken();
        if (restoreSupersededRef.current) return;
        const user = await getMe();
        if (restoreSupersededRef.current) return;
        dispatch({ accessToken, type: "AUTHENTICATED" });
        dispatch({ type: "USER_LOADED", user });
      } catch {
        if (restoreSupersededRef.current) return;
        authTokenStore.clear();
        queryClient.clear();
        dispatch({ type: "SESSION_FAILED" });
      }
    })();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      async authenticate(accessToken) {
        restoreSupersededRef.current = true;
        authTokenStore.set(accessToken);
        dispatch({ accessToken, type: "AUTHENTICATED" });

        try {
          const user = await getMe();
          dispatch({ type: "USER_LOADED", user });
        } catch {
          // Access Token 발급은 성공했으므로 사용자 요약 실패와 세션 실패를 구분한다.
        }
      },
      clearSession() {
        restoreSupersededRef.current = true;
        authTokenStore.clear();
        queryClient.clear();
        dispatch({ type: "SESSION_FAILED" });
      },
      state,
    }),
    [queryClient, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
