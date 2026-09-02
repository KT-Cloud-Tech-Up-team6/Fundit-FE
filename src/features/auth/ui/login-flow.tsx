"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthScreen, AuthTitle } from "./auth-screen";

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
        <AuthTitle>{"로그인을 위한 단계\n더미 텍스트 입니다"}</AuthTitle>
        <div className="mt-16 flex flex-col gap-3">
          <AuthButton aria-label="카카오로 로그인" disabled>
            카카오 로그인
          </AuthButton>
          <AuthButton aria-label="Google로 로그인" disabled>
            Google 로그인
          </AuthButton>
          <AuthButton onClick={() => setView("form")}>일반 로그인</AuthButton>
        </div>
        <div className="mt-6 text-center">
          <p className="text-body-s text-text-default">계정이 없을 때 더미텍스트</p>
          <Link
            className="text-body-s text-text-secondary mt-2 inline-block underline underline-offset-2"
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
      <AuthTitle>{"로그인을 위한 단계\n더미 텍스트 입니다"}</AuthTitle>
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
          <AuthButton disabled={submitting || !demoMode} type="submit">
            {submitting ? "로그인 중" : "로그인"}
          </AuthButton>
        </div>
      </form>
      <nav aria-label="계정 복구" className="mt-6 flex items-center justify-center gap-1">
        <Link
          className="text-body-s flex h-9 w-28 items-center justify-center"
          href="/auth/recovery?view=email"
        >
          아이디 찾기
        </Link>
        <span aria-hidden="true" className="bg-border-default h-3 w-px" />
        <Link
          className="text-body-s flex h-9 w-28 items-center justify-center"
          href="/auth/recovery?view=password"
        >
          비밀번호 찾기
        </Link>
      </nav>
    </AuthScreen>
  );
}
