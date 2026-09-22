"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";

import { getMe, refreshAccessToken, revokeSession } from "@/features/auth/api/auth-api";
import type { AuthUser } from "@/features/auth/api/auth-types";
import { authTokenStore } from "@/shared/api/auth-token-store";
import { ApiError } from "@/shared/api/api-error";

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

export type AuthContextValue = {
  authenticate: (accessToken: string) => Promise<void>;
  clearSession: () => void;
  /** 사용자가 직접 로그아웃할 때 쓴다. 회원 전용 화면이라 그 자리에 남을 수 없으면 `to`로 갈 곳을
      준다(세션 종료와 이동을 한 transition에 묶어 게이트의 로그인 이동보다 먼저 반영한다).
      공개 화면이면 주지 않아 보던 곳에 그대로 둔다. */
  logout: (to?: string) => void;
  state: AuthSessionState;
};

/* 컴포넌트 단위 렌더 테스트(예: buyer-refunds.test.mjs)가 헤더를 거칠 때 AuthProvider 전체
   (QueryClientProvider·Next 라우터까지 요구) 없이 useAuth()만 채울 수 있도록 export한다. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/* 네트워크·CORS·5xx는 일시적 장애라 유효한 세션을 지울 근거가 못 된다(refreshOnce도 401에서만 토큰을 지운다).
   한 번만 더 시도하고, 그래도 실패하면 호출자가 비로그인으로 내려 화면이 checking에 갇히지 않게 한다. */
type RestoreSuperseded = { current: boolean };

export async function restoreAccessToken(
  superseded: RestoreSuperseded,
  waitForRetry = () => new Promise<void>((resolve) => setTimeout(resolve, 1000)),
) {
  try {
    return (await refreshAccessToken()).accessToken;
  } catch (error) {
    if (superseded.current || (error instanceof ApiError && error.status < 500)) throw error;
    await waitForRetry();
    // 대기 중 로그인·로그아웃이 끝났다면 이전 세션의 refresh가 새 토큰을 덮어쓰지 않게 한다.
    if (superseded.current) throw new DOMException("Session changed", "AbortError");
    return (await refreshAccessToken()).accessToken;
  }
}

export async function getRestoredUser() {
  try {
    return await getMe();
  } catch (error) {
    /* getMe는 첫 401에서 refresh 후 재시도한다. 재시도도 401이면 토큰이 더는 유효하지 않으므로,
       일시 장애와 달리 세션을 종료한다. */
    if (error instanceof ApiError && error.status === 401) {
      authTokenStore.clear();
      throw error;
    }
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, {
    accessToken: null,
    status: "checking",
    user: null,
  });
  const restoreStarted = useRef(false);
  /* authenticate()·clearSession()이 먼저 끝나면 배경 세션 복구가 그 결과를 덮어쓰지 않게 막는다. */
  const restoreSupersededRef = useRef(false);

  // 다른 탭의 세션 변경과 백그라운드 refresh 실패 모두 사용자 상태·캐시를 비운다.
  useEffect(() => {
    return authTokenStore.subscribe((accessToken) => {
      if (accessToken === null) {
        restoreSupersededRef.current = true;
        queryClient.clear();
        dispatch({ type: "SESSION_FAILED" });
      }
    });
  }, [queryClient]);

  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    void (async () => {
      let accessToken: string;
      try {
        accessToken = await restoreAccessToken(restoreSupersededRef);
      } catch {
        /* 서버가 확인한 실패(401·쿠키 없음)와, 재시도까지 실패한 장애만 여기 온다. checking에 두면 화면이
           영영 진행되지 않으므로 비로그인으로 내린다. 쿠키는 그대로라 새로고침하면 다시 복구를 시도한다. */
        if (!restoreSupersededRef.current) dispatch({ type: "SESSION_FAILED" });
        return;
      }
      if (restoreSupersededRef.current) return;
      let user: AuthUser | null = null;
      try {
        user = await getRestoredUser();
      } catch {
        // 최종 401은 getRestoredUser가 store를 비우고 구독자가 guest로 전환한다.
        return;
      }
      if (restoreSupersededRef.current) return;
      // getMe()가 401을 만나 토큰이 회전했을 수 있다. "다시 시도"가 store와 대조하므로 현재 토큰을 싣는다.
      dispatch({ accessToken: authTokenStore.get() ?? accessToken, type: "AUTHENTICATED" });
      if (user) dispatch({ type: "USER_LOADED", user });
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      async authenticate(accessToken) {
        restoreSupersededRef.current = true;
        if (authTokenStore.get() !== accessToken) {
          throw new DOMException("Session changed", "AbortError");
        }
        const generation = authTokenStore.getSessionGeneration();
        queryClient.clear();
        dispatch({ accessToken, type: "AUTHENTICATED" });

        try {
          const user = await getMe();
          if (authTokenStore.getSessionGeneration() !== generation) {
            throw new DOMException("Session changed", "AbortError");
          }
          dispatch({ type: "USER_LOADED", user });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") throw error;
          // Access Token 발급은 성공했으므로 사용자 요약 실패와 세션 실패를 구분한다.
        }
      },
      clearSession() {
        restoreSupersededRef.current = true;
        /* 로컬 무효화를 먼저 확정한다. 서버 응답을 기다리면 그 사이의 refresh가 세션을 되살리고,
           네트워크 장애 때는 화면이 로그인 상태로 남는다. */
        const generation = authTokenStore.changeSession();
        queryClient.clear();
        dispatch({ type: "SESSION_FAILED" });
        /* 서버 폐기가 없으면 쿠키가 남아 새로고침 때 세션이 복구된다. 실패해도 로컬은 이미
           비로그인이고 BE 로그아웃은 멱등이라 화면 오류로 올리지 않는다. */
        void revokeSession(generation).catch(() => {});
      },
      logout(to?: string) {
        restoreSupersededRef.current = true;
        /* 이동과 세션 정리를 같은 transition 안에서 실행해야 한다. changeSession()은 아래
           authTokenStore.subscribe 구독자(SESSION_FAILED 디스패치)를 동기 호출하므로, transition
           밖에서 부르면 그 디스패치가 일반 우선순위로 먼저 반영되어 회원 전용 화면이 비회원
           상태로 먼저 그려지고, 게이트의 로그인 이동이 아래 이동보다 먼저 커밋돼버린다.
           공개 화면(to 없음)에서는 이동하지 않고 그 자리에 남는다. */
        startTransition(() => {
          if (to) router.replace(to);
          const generation = authTokenStore.changeSession();
          void revokeSession(generation).catch(() => {});
        });
      },
      state,
    }),
    [queryClient, router, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
