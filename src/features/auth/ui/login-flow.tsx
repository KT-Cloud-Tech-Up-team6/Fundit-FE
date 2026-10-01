"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { login } from "@/features/auth/api/auth-api";
import { safeReturnTo } from "@/features/auth/model/auth-input";
import { isSocialAuthAvailable, startSocialAuth } from "@/features/auth/model/oauth-authorize";
import type { SocialProvider } from "@/features/auth/api/auth-types";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";
import { authTokenStore } from "@/shared/api/auth-token-store";

import { AuthButton, AuthInput, AuthSocialButton } from "./auth-form-controls";
import { AuthScreen } from "./auth-screen";
import { PasswordUpdateFlow } from "./password-update-flow";

export type LoginView = "method" | "form";
export type LoginError = "none" | "password-required" | "credentials";

type LoginFlowProps = {
  returnTo?: string;
  demoMode?: boolean;
  initialError?: LoginError;
  initialSubmitting?: boolean;
  initialView?: LoginView;
};

export function LoginFlow({
  returnTo,
  demoMode = false,
  initialError = "none",
  initialSubmitting = false,
  initialView = "method",
}: LoginFlowProps) {
  const router = useRouter();
  const { authenticate, clearSession } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const restrictedSession = useRef<{ generation: string | null } | null>(null);
  const [requestError, setRequestError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const [view, setView] = useState<LoginView>(initialView);
  const [email, setEmail] = useState(initialError === "none" ? "" : "1234abc@gmail.com");
  const [password, setPassword] = useState(initialError === "credentials" ? "password123" : "");
  const [error, setError] = useState<LoginError>(initialError);
  const [submitting, setSubmitting] = useState(initialSubmitting);
  const submitTimerRef = useRef<number | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailLoginRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<"email" | "password" | "emailLogin" | null>(null);

  // 화면을 통째로 바꾸거나(방식 선택 ↔ 이메일 폼) 제출 중 입력이 disabled가 되면 누른 요소가 사라져
  // 포커스가 BODY로 빠진다. 전환하는 쪽이 갈 곳을 적어 두면 커밋 뒤 여기서 한 번에 옮긴다.
  // 마운트 때는 적힌 곳이 없어 포커스를 뺏지 않고(autoFocus와 다르다), 사용자가 직접 옮긴 포커스도 건드리지 않는다.
  useEffect(() => {
    const target = pendingFocusRef.current;
    if (!target || submitting) return;
    pendingFocusRef.current = null;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    const targets = { email: emailRef, password: passwordRef, emailLogin: emailLoginRef };
    targets[target].current?.focus();
  }, [view, submitting, mustChangePassword]);

  useEffect(
    () => () => {
      requestRef.current?.abort();
      if (
        restrictedSession.current &&
        restrictedSession.current.generation === authTokenStore.getSessionGeneration()
      ) {
        authTokenStore.changeSession();
      }
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    },
    [],
  );

  function socialClick(provider: SocialProvider) {
    if (!isSocialAuthAvailable(provider)) return undefined;
    return () => {
      setRequestError("");
      const started = startSocialAuth({
        agreedTerms: [],
        entry: "login",
        provider,
        returnTo,
      });
      if (!started) setRequestError("소셜 로그인을 시작하지 못했습니다. 다시 시도해 주세요.");
    };
  }

  function showMethodSelection() {
    requestRef.current?.abort();
    requestRef.current = null;
    setRequestError("");
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }

    setSubmitting(false);
    setError("none");
    pendingFocusRef.current = "emailLogin";
    setView("method");
  }

  if (mustChangePassword)
    return (
      <PasswordUpdateFlow
        mode="change"
        onCancel={() => {
          restrictedSession.current = null;
          clearSession();
          setMustChangePassword(false);
          pendingFocusRef.current = "emailLogin";
          setView("method");
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
          router.replace(safeReturnTo(returnTo));
        }}
      />
    );

  if (view === "method") {
    return (
      <AuthScreen withHeader={false}>
        <Image
          alt="Fundit"
          className="mx-auto h-12 w-[132px]"
          height={48}
          priority
          src="/images/auth/fundit-logo.svg"
          width={132}
        />
        <div className="mt-24 flex flex-col gap-3">
          {/* client ID가 없으면 onClick을 주지 않아 버튼이 비활성("준비 중")이다. */}
          <AuthSocialButton
            icon="/images/auth/kakao-logo.svg"
            label="카카오 로그인"
            onClick={socialClick("KAKAO")}
            tone="kakao"
          />
          <AuthSocialButton
            icon="/images/auth/google-logo.svg"
            label="구글 로그인"
            onClick={socialClick("GOOGLE")}
            tone="google"
          />
          {requestError && (
            <p role="alert" className="text-body-s text-text-default">
              {requestError}
            </p>
          )}
          <AuthButton
            ref={emailLoginRef}
            onClick={() => {
              pendingFocusRef.current = "email";
              setView("form");
            }}
          >
            이메일로 로그인
          </AuthButton>
        </div>
        <div className="mt-12 text-center">
          <p className="text-body-s text-text-default">펀딧 계정이 없으신가요?</p>
          <Link
            className="text-caption-s text-text-secondary mt-1 inline-block underline underline-offset-2"
            href="/auth/signup"
          >
            회원가입하기
          </Link>
        </div>
      </AuthScreen>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || requestRef.current || !email.trim()) return;

    if (!password) {
      setError("password-required");
      return;
    }

    setSubmitting(true);
    setRequestError("");
    if (!demoMode) {
      const request = new AbortController();
      requestRef.current = request;
      try {
        const result = await login({ email: email.trim(), password }, { signal: request.signal });
        if (request.signal.aborted) return;
        setPassword("");
        if (result.mustChangePassword) {
          // 세션 요청은 일반 인증 상태를 비운다. 변경 API에만 토큰을 사용하고 승격은 완료 후 한다.
          restrictedSession.current = { generation: authTokenStore.getSessionGeneration() };
          setMustChangePassword(true);
        } else {
          await authenticate(result.accessToken);
          if (!request.signal.aborted) router.replace(safeReturnTo(returnTo));
        }
      } catch (cause) {
        if (request.signal.aborted) return;
        pendingFocusRef.current = "password";
        if (isApiError(cause) && cause.code === "INVALID_CREDENTIALS") setError("credentials");
        else
          setRequestError(
            isApiError(cause) && cause.code === "ACCOUNT_LOCKED"
              ? "계정이 일시적으로 잠겼습니다. 잠시 후 다시 시도하거나 비밀번호를 재설정해 주세요."
              : "로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
      } finally {
        if (!request.signal.aborted) {
          requestRef.current = null;
          setSubmitting(false);
        }
      }
      return;
    }
    submitTimerRef.current = window.setTimeout(() => {
      submitTimerRef.current = null;
      pendingFocusRef.current = "password";
      setSubmitting(false);
      setError("credentials");
    }, 300);
  }

  return (
    <AuthScreen onBack={showMethodSelection}>
      <Image
        alt="Fundit"
        className="mx-auto h-12 w-[132px]"
        height={48}
        priority
        src="/images/auth/fundit-logo.svg"
        width={132}
      />
      <form className="mt-16" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <AuthInput
            ref={emailRef}
            disabled={submitting}
            aria-label="이메일"
            autoComplete="email"
            id="login-email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("none");
            }}
            onClear={() => setEmail("")}
            placeholder="이메일"
            type="email"
            value={email}
          />
          <AuthInput
            ref={passwordRef}
            disabled={submitting}
            aria-label="비밀번호"
            autoComplete="current-password"
            errorMessage={
              error === "password-required"
                ? "비밀번호를 입력해주세요."
                : error === "credentials"
                  ? "입력하신 계정 정보가 일치하지 않습니다."
                  : undefined
            }
            id="login-password"
            onChange={(event) => {
              setPassword(event.target.value);
              setError("none");
            }}
            onClear={() => {
              setPassword("");
              setError("none");
            }}
            placeholder="비밀번호"
            type="password"
            value={password}
          />
          {/* 이 화면만 46px(size="lg")다 — 실제 로그인 Figma(FL_C_ME_LOGIN_2)가 그렇게 그려져 있고,
              다른 회원가입 CTA(52px)와는 의도적으로 다르다. */}
          {requestError && (
            <p role="alert" className="text-body-s">
              {requestError}
            </p>
          )}
          <AuthButton disabled={submitting || !email.trim() || !password} size="lg" type="submit">
            {submitting ? "로그인 중" : "로그인"}
          </AuthButton>
        </div>
      </form>
      <nav aria-label="계정 복구" className="mt-6 flex items-center justify-center gap-1">
        <Link
          className="text-body-s text-text-secondary flex h-9 w-28 items-center justify-center"
          href="/auth/recovery/email"
        >
          아이디 찾기
        </Link>
        <span aria-hidden="true" className="bg-border-default h-3 w-px" />
        <Link
          className="text-body-s text-text-secondary flex h-9 w-28 items-center justify-center"
          href="/auth/recovery/password"
        >
          비밀번호 찾기
        </Link>
      </nav>
    </AuthScreen>
  );
}
