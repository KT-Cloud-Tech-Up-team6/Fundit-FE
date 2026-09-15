"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthButton, AuthInput, AuthSocialButton } from "./auth-form-controls";
import { AuthScreen } from "./auth-screen";

export type LoginView = "method" | "form";
export type LoginError = "none" | "password-required" | "credentials";

type LoginFlowProps = {
  demoMode?: boolean;
  initialError?: LoginError;
  initialSubmitting?: boolean;
  initialView?: LoginView;
};

export function LoginFlow({
  demoMode = false,
  initialError = "none",
  initialSubmitting = false,
  initialView = "method",
}: LoginFlowProps) {
  const [view, setView] = useState<LoginView>(initialView);
  const [email, setEmail] = useState(initialError === "none" ? "" : "1234abc@gmail.com");
  const [password, setPassword] = useState(initialError === "credentials" ? "password123" : "");
  const [error, setError] = useState<LoginError>(initialError);
  const [submitting, setSubmitting] = useState(initialSubmitting);
  const submitTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current);
      }
    },
    [],
  );

  function showMethodSelection() {
    if (submitTimerRef.current !== null) {
      window.clearTimeout(submitTimerRef.current);
      submitTimerRef.current = null;
    }

    setSubmitting(false);
    setError("none");
    setView("method");
  }

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
          {/* 소셜 로그인도 OAuth 연동 전까지는 진입할 수 없다(회원가입과 동일). */}
          <AuthSocialButton icon="/images/auth/kakao-logo.svg" label="카카오 로그인" tone="kakao" />
          <AuthSocialButton icon="/images/auth/google-logo.svg" label="구글 로그인" tone="google" />
          <AuthButton onClick={() => setView("form")}>이메일로 로그인</AuthButton>
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password) {
      setError("password-required");
      return;
    }

    if (!demoMode) return;

    setSubmitting(true);
    submitTimerRef.current = window.setTimeout(() => {
      submitTimerRef.current = null;
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
          <AuthButton disabled={submitting || !demoMode} size="lg" type="submit">
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
