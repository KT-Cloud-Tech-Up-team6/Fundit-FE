"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { loginSocial } from "@/features/auth/api/auth-api";
import type { SocialProvider } from "@/features/auth/api/auth-types";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";
import { authTokenStore } from "@/shared/api/auth-token-store";
import { loginRedirectHref } from "@/shared/lib/login-redirect-href";

import { startSocialAuth } from "../model/oauth-authorize";
import { existingProvider, providerLabel } from "../model/social-auth-error";
import { saveSocialLinkSession } from "../model/social-link-session";
import { consumeSocialAuthSession } from "../model/social-auth-session";
import type { SocialAuthSession } from "../model/social-auth-session";
import { saveSocialSignupSession } from "../model/social-signup-session";

import { AuthButton } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";
import { PasswordUpdateFlow } from "./password-update-flow";

type View =
  | { kind: "processing" }
  | { kind: "invalid" }
  | { kind: "needs-signup" }
  | { kind: "exists"; provider: SocialProvider | null }
  | { kind: "failed"; message: string }
  | { kind: "must-change-password" };

function entryHref(session: SocialAuthSession) {
  if (session.entry === "signup") return "/auth/signup";
  return session.returnTo === "/" ? "/auth/login" : loginRedirectHref(session.returnTo);
}

function failureView(cause: unknown): View {
  if (isApiError(cause)) {
    if (cause.code === "SOCIAL_ACCOUNT_EXISTS")
      return { kind: "exists", provider: existingProvider(cause.detail) };
    if (cause.code === "ACCOUNT_LOCKED")
      return {
        kind: "failed",
        message:
          "계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도하거나 비밀번호를 재설정해 주세요.",
      };
  }
  // 코드 재사용·제공자 장애·redirect URI 불일치를 BE가 모두 503으로 내려 원인을 구분할 수 없다.
  return { kind: "failed", message: "소셜 로그인에 실패했습니다. 다시 시도해 주세요." };
}

export function OAuthCallbackFlow({ provider }: { provider: SocialProvider }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticate, clearSession } = useAuth();
  const [view, setView] = useState<View>({ kind: "processing" });
  const startedRef = useRef(false);
  const sessionRef = useRef<SocialAuthSession | null>(null);
  const restrictedSession = useRef<{ generation: string | null } | null>(null);
  /* 요청이 끝나기 전에 사용자가 화면을 벗어났는지 본다. StrictMode의 가짜 unmount는 effect가 다시 true로 돌린다. */
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (
        restrictedSession.current &&
        restrictedSession.current.generation === authTokenStore.getSessionGeneration()
      ) {
        authTokenStore.changeSession();
      }
    };
  }, []);

  useEffect(() => {
    /* 인가 코드는 1회용이다. StrictMode가 effect를 두 번 실행해도 한 번만 보낸다. */
    if (startedRef.current) return;
    startedRef.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const providerError = searchParams.get("error");
    // 1회용 인가 코드와 state가 주소창·히스토리에 남지 않게 콜백 주소에서 쿼리를 바로 뗀다.
    window.history.replaceState(window.history.state, "", window.location.pathname);

    async function run() {
      const session = consumeSocialAuthSession();
      if (!session || session.provider !== provider || !state || state !== session.state) {
        // state가 없거나 다르면 API를 호출하지 않는다.
        setView({ kind: "invalid" });
        return;
      }
      sessionRef.current = session;
      if (providerError) {
        // 사용자가 동의 화면에서 취소했다(access_denied). 시작한 화면으로 돌려보낸다.
        router.replace(entryHref(session));
        return;
      }
      if (!code) {
        setView({ kind: "invalid" });
        return;
      }
      try {
        const result = await loginSocial({ authorizationCode: code, provider });
        if (result.needsSignup) {
          // 응답을 기다리는 사이 화면을 벗어났다면 가입 정보를 남기지 않는다. 남기면 나중에 가입 화면을 열 때 되살아난다.
          if (!mountedRef.current) return;
          // signupToken은 URL이 아니라 세션 스토리지로 가입 화면에 넘긴다. 가입 화면 진입이면 약관은 이미 받았다.
          const saved = saveSocialSignupSession({
            agreedTerms: session.entry === "signup" ? session.agreedTerms : [],
            email: result.email ?? null,
            entry: session.entry,
            name: result.name ?? null,
            provider,
            signupToken: result.signupToken,
          });
          if (!saved)
            return setView({ kind: "failed", message: "소셜 가입을 시작하지 못했습니다." });
          router.replace("/auth/signup/social");
          return;
        }
        if (result.needsLink) {
          if (
            !saveSocialLinkSession({
              linkToken: result.linkToken,
              provider: result.provider,
              returnTo: session.returnTo,
            })
          ) {
            return setView({
              kind: "failed",
              message:
                "소셜 계정 연동 정보를 저장하지 못했습니다. 소셜 로그인을 다시 시작해 주세요.",
            });
          }
          if (mountedRef.current) router.replace("/auth/social/link");
          return;
        }
        if (result.mustChangePassword) {
          if (!mountedRef.current) {
            // 응답을 기다리는 사이 화면을 벗어났다. 정리할 cleanup이 이미 지나갔으므로 여기서 세션을 비운다.
            authTokenStore.changeSession();
            return;
          }
          // 세션 요청은 일반 인증 상태를 비운다. 변경 API에만 토큰을 사용하고 승격은 완료 후 한다.
          restrictedSession.current = { generation: authTokenStore.getSessionGeneration() };
          return setView({ kind: "must-change-password" });
        }
        await authenticate(result.accessToken);
        // 그 사이 사용자가 다른 화면으로 이동했다면 그 이동을 덮어쓰지 않는다.
        if (mountedRef.current) router.replace(session.returnTo);
      } catch (cause) {
        setView(failureView(cause));
      }
    }

    void run();
  }, [authenticate, provider, router, searchParams]);

  function retry(target: SocialProvider = provider) {
    const session = sessionRef.current;
    if (!session) {
      router.replace("/auth/login");
      return;
    }
    const started = startSocialAuth({
      agreedTerms: session.agreedTerms,
      entry: session.entry,
      provider: target,
      returnTo: session.returnTo,
    });
    if (!started) setView({ kind: "failed", message: "소셜 로그인을 시작하지 못했습니다." });
  }

  if (view.kind === "must-change-password")
    return (
      <PasswordUpdateFlow
        mode="change"
        onCancel={() => {
          restrictedSession.current = null;
          clearSession();
          router.replace(sessionRef.current ? entryHref(sessionRef.current) : "/auth/login");
        }}
        onComplete={async () => {
          const token = authTokenStore.get();
          if (
            !token ||
            restrictedSession.current?.generation !== authTokenStore.getSessionGeneration()
          )
            throw new DOMException("Session changed", "AbortError");
          await authenticate(token);
          if (restrictedSession.current?.generation !== authTokenStore.getSessionGeneration())
            throw new DOMException("Session changed", "AbortError");
          restrictedSession.current = null;
          router.replace(sessionRef.current?.returnTo ?? "/");
        }}
      />
    );

  if (view.kind === "processing")
    return (
      <AuthScreen withHeader={false}>
        <p className="text-body-m text-text-secondary text-center" role="status">
          {providerLabel[provider]} 계정을 확인하고 있어요.
        </p>
      </AuthScreen>
    );

  /* needsSignup은 소셜 신규 가입(#486) 범위라 아직 임시 안내를 유지한다. */
  const notice =
    view.kind === "needs-signup"
      ? {
          action: (
            <AuthButton onClick={() => router.replace("/auth/signup")}>일반 회원가입</AuthButton>
          ),
          message: "소셜 계정으로 가입하는 기능은 준비 중이에요.\n이메일로 가입해 주세요.",
          title: "아직 가입되지 않은\n계정이에요",
        }
      : view.kind === "exists"
        ? {
            action: (
              <AuthButton onClick={() => retry(view.provider ?? provider)}>
                {providerLabel[view.provider ?? provider]}로 로그인
              </AuthButton>
            ),
            message: `이미 ${providerLabel[view.provider ?? provider]} 계정으로 가입된 이메일이에요.`,
            title: "이미 가입된\n계정이에요",
          }
        : view.kind === "failed"
          ? {
              action: <AuthButton onClick={() => retry()}>다시 시도</AuthButton>,
              message: view.message,
              title: "로그인하지\n못했어요",
            }
          : {
              action: (
                <AuthButton onClick={() => router.replace("/auth/login")}>
                  로그인으로 가기
                </AuthButton>
              ),
              message: "로그인 요청을 확인하지 못했습니다.\n처음부터 다시 시도해 주세요.",
              title: "로그인 정보를\n확인하지 못했어요",
            };

  return (
    <AuthScreen withHeader={false}>
      <AuthTitle>{notice.title}</AuthTitle>
      <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line" role="alert">
        {notice.message}
      </p>
      <AuthBottomAction>{notice.action}</AuthBottomAction>
    </AuthScreen>
  );
}
