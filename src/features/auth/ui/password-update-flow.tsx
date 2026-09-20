"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { changePassword, confirmPasswordReset } from "@/features/auth/api/auth-api";
import { passwordSchema } from "@/features/auth/model/auth-input";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthScreen, AuthTitle } from "./auth-screen";

type Props = { mode: "change"; onComplete: () => void } | { mode: "reset"; token: string };

export function PasswordUpdateFlow(props: Props) {
  const router = useRouter();
  const { clearSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);

  const validPassword = passwordSchema.safeParse(password);
  const missingToken = props.mode === "reset" && !props.token;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (requestRef.current || !validPassword.success || password !== confirmation || missingToken)
      return;
    const request = new AbortController();
    requestRef.current = request;
    setPending(true);
    setError("");
    try {
      if (props.mode === "reset") {
        await confirmPasswordReset(
          { token: props.token, newPassword: password },
          { signal: request.signal },
        );
      } else {
        await changePassword(
          { currentPassword, newPassword: password },
          { signal: request.signal },
        );
      }
      if (request.signal.aborted) return;
      setPassword("");
      setConfirmation("");
      setCurrentPassword("");
      if (props.mode === "change") props.onComplete();
      else {
        // 재설정은 BE의 모든 Refresh Token 폐기와 함께 현재 FE 세션도 비운다.
        clearSession();
        window.history.replaceState(null, "", "/reset-password");
        setComplete(true);
      }
    } catch (cause) {
      if (!request.signal.aborted)
        setError(
          isApiError(cause) && cause.code === "TOKEN_INVALID"
            ? "재설정 링크가 만료되었거나 이미 사용되었습니다. 링크를 다시 요청해 주세요."
            : isApiError(cause) && cause.code === "INVALID_CREDENTIALS"
              ? "현재 비밀번호가 일치하지 않습니다."
              : "비밀번호를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
    } finally {
      if (!request.signal.aborted) {
        requestRef.current = null;
        setPending(false);
      }
    }
  }

  return (
    <AuthScreen headerTitle="비밀번호 설정" onBack={() => router.replace("/auth/login")}>
      <AuthTitle>
        {complete ? "비밀번호가 변경되었습니다" : "새 비밀번호를 설정해 주세요"}
      </AuthTitle>
      {complete ? (
        <AuthButton className="mt-12" onClick={() => router.replace("/auth/login")}>
          로그인하기
        </AuthButton>
      ) : (
        <form className="mt-12 flex flex-col gap-3" onSubmit={submit}>
          {props.mode === "change" && (
            <>
              <p className="text-body-m">계속하려면 비밀번호를 변경해 주세요.</p>
              <AuthInput
                disabled={pending}
                aria-label="현재 비밀번호"
                autoComplete="current-password"
                type="password"
                placeholder="현재 비밀번호"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </>
          )}
          <AuthInput
            disabled={pending}
            aria-label="새 비밀번호"
            autoComplete="new-password"
            type="password"
            placeholder="새 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            errorMessage={
              password && !validPassword.success ? validPassword.error.issues[0].message : undefined
            }
          />
          <p className="text-body-s text-text-secondary">
            8자 이상, 대문자·소문자·숫자·특수문자 중 3종 이상
          </p>
          <AuthInput
            disabled={pending}
            aria-label="새 비밀번호 확인"
            autoComplete="new-password"
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            errorMessage={
              confirmation && password !== confirmation
                ? "비밀번호가 일치하지 않습니다."
                : undefined
            }
          />
          {(error || missingToken) && (
            <p role="alert" className="text-body-s">
              {missingToken ? "재설정 링크가 없습니다. 링크를 다시 요청해 주세요." : error}
            </p>
          )}
          <AuthButton
            type="submit"
            disabled={
              pending ||
              missingToken ||
              !validPassword.success ||
              password !== confirmation ||
              (props.mode === "change" && !currentPassword)
            }
          >
            {pending ? "변경 중" : "비밀번호 변경"}
          </AuthButton>
          {props.mode === "reset" && (
            <AuthButton onClick={() => router.replace("/auth/recovery/password")}>
              재설정 링크 다시 요청
            </AuthButton>
          )}
        </form>
      )}
    </AuthScreen>
  );
}
