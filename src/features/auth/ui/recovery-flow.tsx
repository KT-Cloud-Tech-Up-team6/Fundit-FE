"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
  findEmail,
  revealEmail,
  requestPasswordReset,
  verifyIdentity,
} from "@/features/auth/api/auth-api";
import { requestIdentityVerification } from "@/features/auth/api/portone-identity-adapter";
import { formatPhone, validRecoveryIdentity } from "@/features/auth/model/auth-input";
import {
  clearEmailRecoverySession,
  consumeEmailRecoverySession,
  saveEmailRecoverySession,
} from "@/features/auth/model/email-recovery-session";
import { isApiError } from "@/shared/api/api-error";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthIdentityVerification, isRetryIdentityStatus } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type RecoveryView =
  | "email-form"
  | "masked-email"
  | "identity-ready"
  | "identity-requesting"
  | "identity-cancelled"
  | "identity-failed"
  | "identity-verifying"
  | "identity-verification-failed"
  | "full-email"
  | "not-found"
  | "password-form"
  | "password-sent";

const identityStatusByView: Partial<Record<RecoveryView, IdentityStatus>> = {
  "identity-ready": "ready",
  "identity-requesting": "requesting",
  "identity-cancelled": "cancelled",
  "identity-failed": "failed",
  "identity-verifying": "verifying",
  "identity-verification-failed": "verification-failed",
};

/* 제목·상태 문구·버튼 라벨은 AuthIdentityVerification이 소유한다. 여기서는 계정 복구
   맥락에서만 달라지는 안내 문구를 준다. */
const identityDescriptionByStatus: Record<IdentityStatus, string> = {
  ready: "전체 이메일 주소를 확인하려면\n본인인증이 필요해요.",
  requesting: "열린 인증 창에서\n본인인증을 완료해 주세요.",
  cancelled: "전체 이메일을 확인하려면\n본인인증을 다시 진행해 주세요.",
  failed: "인증 과정에서 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
  verifying: "인증 결과를 안전하게 확인 중입니다.\n잠시만 기다려 주세요.",
  "verification-failed":
    "인증 결과가 만료되었거나 유효하지 않습니다.\n본인인증을 다시 진행해 주세요.",
};

type RecoveryFlowProps = {
  callback?: { identityVerificationId: string; code: string | null };
  demoMode?: boolean;
  initialView?: RecoveryView;
};

type RecoveryHeaderProps = {
  children: ReactNode;
  headerTitle: string;
  onBack: () => void;
};

function RecoveryHeader({ children, headerTitle, onBack }: RecoveryHeaderProps) {
  return (
    <AuthScreen headerTitle={headerTitle} onBack={onBack}>
      {children}
    </AuthScreen>
  );
}

function RecoveryDescription({ children }: { children: ReactNode }) {
  return <p className="text-body-m mt-3 whitespace-pre-line">{children}</p>;
}

export function RecoveryFlow({
  callback,
  demoMode = false,
  initialView = "email-form",
}: RecoveryFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<RecoveryView>(initialView);
  const [viewHistory, setViewHistory] = useState<RecoveryView[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState(demoMode ? "1234q***@gmail.com" : "");
  const [fullEmail, setFullEmail] = useState(demoMode ? "1234abc@fundit.com" : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const callbackCancelled = useRef(false);
  const callbackTask = useRef<Promise<{ email: string; name: string; phoneNumber: string }> | null>(
    null,
  );
  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!callback) return;
    let active = true;
    if (!callbackTask.current)
      callbackTask.current = (async () => {
        const session = consumeEmailRecoverySession(callback.identityVerificationId);
        if (!session || callback.code || !callback.identityVerificationId)
          throw new Error("Invalid callback");
        const { verificationToken } = await verifyIdentity({
          identityVerificationId: callback.identityVerificationId,
        });
        const result = await revealEmail(verificationToken);
        return { ...result, name: session.name, phoneNumber: session.phoneNumber };
      })();
    void callbackTask.current.then(
      (result) => {
        if (!active || callbackCancelled.current) return;
        setName(result.name);
        setPhone(formatPhone(result.phoneNumber));
        setFullEmail(result.email);
        setEmail(result.email);
        setView("full-email");
        window.history.replaceState(null, "", "/auth/recovery/email");
      },
      () => {
        if (active && !callbackCancelled.current) setView("identity-verification-failed");
      },
    );
    return () => {
      active = false;
    };
  }, [callback]);

  function cancelRequest() {
    callbackCancelled.current = true;
    requestRef.current?.abort();
    requestRef.current = null;
    setPending(false);
    setError("");
    clearEmailRecoverySession();
  }

  async function submitRecovery(kind: "email" | "password") {
    if (requestRef.current || !validRecoveryIdentity(name, phone)) return;
    const request = new AbortController();
    requestRef.current = request;
    setPending(true);
    setError("");
    try {
      const identity = { name: name.trim(), phoneNumber: phone.replace(/-/g, "") };
      if (kind === "email") {
        const result = await findEmail(identity, { signal: request.signal });
        if (request.signal.aborted) return;
        setMaskedEmail(result.maskedEmail ?? "");
        goTo(result.maskedEmail ? "masked-email" : "not-found");
      } else {
        await requestPasswordReset(
          { ...identity, email: email.trim() },
          { signal: request.signal },
        );
        if (!request.signal.aborted) goTo("password-sent");
      }
    } catch (cause) {
      if (!request.signal.aborted)
        setError(
          isApiError(cause) && cause.status === 429
            ? "요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요."
            : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
    } finally {
      if (!request.signal.aborted) {
        requestRef.current = null;
        setPending(false);
      }
    }
  }

  function showLogin() {
    cancelRequest();
    router.push("/auth/login");
  }

  function goTo(nextView: RecoveryView) {
    setViewHistory((history) => [...history, view]);
    setView(nextView);
  }

  function goBack() {
    cancelRequest();
    if (callback) {
      router.replace("/auth/recovery/email");
      return;
    }
    const previousView = viewHistory.at(-1);

    if (previousView) {
      setViewHistory((history) => history.slice(0, -1));
      setView(previousView);
      return;
    }

    router.back();
  }

  const headerTitle =
    view === "password-form" || view === "password-sent" ? "비밀번호 찾기" : "이메일 찾기";

  if (view === "email-form") {
    function submitEmailSearch(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (demoMode && name && phone) goTo("masked-email");
      else if (!demoMode) void submitRecovery("email");
    }

    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>{"가입 정보로\n이메일을 찾아보세요"}</AuthTitle>
        <form className="mt-16" onSubmit={submitEmailSearch}>
          <div className="flex flex-col gap-3">
            <AuthInput
              disabled={pending}
              aria-label="이름"
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              onClear={() => setName("")}
              placeholder="이름"
              value={name}
            />
            <AuthInput
              disabled={pending}
              aria-label="전화번호"
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              onClear={() => setPhone("")}
              placeholder="전화번호"
              value={phone}
            />
            {/* 회원가입 CTA(52px)와 달리 이 화면군은 46px다(FL_C_ME_IDFIND_1/2 실측). */}
            {error && (
              <p role="alert" className="text-body-s">
                {error}
              </p>
            )}
            <AuthButton
              disabled={pending || !validRecoveryIdentity(name, phone)}
              size="lg"
              type="submit"
            >
              {pending ? "조회 중" : "찾기"}
            </AuthButton>
          </div>
        </form>
      </RecoveryHeader>
    );
  }

  if (view === "masked-email") {
    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>가입된 이메일을 찾았어요</AuthTitle>
        <RecoveryDescription>입력하신 정보로 가입된 이메일 주소입니다.</RecoveryDescription>
        <div className="bg-layer-surface-disabled text-body-m mt-12 flex h-[118px] items-center justify-center rounded-sm text-center">
          <p>
            <span className="text-text-primary-live">{name || (demoMode ? "홍길동" : "")}</span>{" "}
            회원님의 아이디는
            <br />
            <span className="text-text-primary-live">{maskedEmail}</span> 입니다
          </p>
        </div>
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            className="text-body-s flex h-9 w-28 items-center justify-center"
            onClick={() => goTo("identity-ready")}
            type="button"
          >
            전체 이메일 확인
          </button>
          <span aria-hidden="true" className="bg-border-default h-3 w-px" />
          <button
            className="text-body-s flex h-9 w-28 items-center justify-center"
            onClick={() => goTo("password-form")}
            type="button"
          >
            비밀번호 찾기
          </button>
        </div>
        <AuthBottomAction>
          <AuthButton onClick={showLogin} size="lg">
            로그인 화면으로
          </AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  if (view === "not-found") {
    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>회원정보를 찾을 수 없습니다</AuthTitle>
        <RecoveryDescription>
          {"입력한 정보로\n가입된 계정을 찾을 수 없습니다."}
        </RecoveryDescription>
        <div aria-hidden="true" className="bg-layer-surface-disabled mx-auto mt-18 size-[150px]" />
        <button
          className="text-body-s text-text-secondary mx-auto mt-3 block underline underline-offset-2"
          onClick={showLogin}
          type="button"
        >
          로그인 화면으로
        </button>
        <AuthBottomAction>
          <AuthButton onClick={() => router.push("/auth/signup")} size="lg">
            회원가입하기
          </AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  if (view === "password-form") {
    function submitPasswordReset(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (demoMode && name && phone && email) goTo("password-sent");
      else if (!demoMode) void submitRecovery("password");
    }

    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>새 비밀번호 설정하기</AuthTitle>
        <RecoveryDescription>등록된 이메일로 재설정 링크를 보내드립니다.</RecoveryDescription>
        {/* AuthBottomAction의 mt-auto는 flex 부모 안에서만 하단으로 밀린다.
            main도 flex-col이지만 이 form이 그 사이에 끼어 있어 form도 flex-1로 맞춘다. */}
        <form className="mt-16 flex flex-1 flex-col" onSubmit={submitPasswordReset}>
          <div className="flex flex-col gap-3">
            <AuthInput
              disabled={pending}
              aria-label="이름"
              onChange={(event) => setName(event.target.value)}
              onClear={() => setName("")}
              placeholder="이름"
              value={name}
            />
            <AuthInput
              disabled={pending}
              aria-label="휴대폰번호"
              inputMode="tel"
              onChange={(event) => setPhone(formatPhone(event.target.value))}
              onClear={() => setPhone("")}
              placeholder="휴대폰번호"
              value={phone}
            />
            <AuthInput
              disabled={pending}
              aria-label="이메일"
              onChange={(event) => setEmail(event.target.value)}
              onClear={() => setEmail("")}
              placeholder="이메일"
              type="email"
              value={email}
            />
          </div>
          <AuthBottomAction>
            {error && (
              <p role="alert" className="text-body-s">
                {error}
              </p>
            )}
            <AuthButton
              disabled={
                pending ||
                !validRecoveryIdentity(name, phone) ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
              }
              size="lg"
              type="submit"
            >
              {pending ? "요청 중" : "발송"}
            </AuthButton>
          </AuthBottomAction>
        </form>
      </RecoveryHeader>
    );
  }

  if (view === "password-sent") {
    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>메일을 확인해 주세요</AuthTitle>
        <RecoveryDescription>
          입력하신 정보와 일치하는 계정이 있다면 재설정 링크를 보내드립니다.
        </RecoveryDescription>
        <p className="text-body-m mt-7">
          <span className="text-text-primary-live">{email}</span> 메일함을 확인해 주세요.
        </p>
        <AuthBottomAction>
          <AuthButton onClick={showLogin} size="lg">
            로그인 화면으로
          </AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  if (view === "full-email") {
    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>가입된 이메일을 확인했어요</AuthTitle>
        <RecoveryDescription>
          {"본인 인증이 완료되어\n전체 이메일 주소를 확인할 수 있어요."}
        </RecoveryDescription>
        <div className="bg-layer-surface-disabled text-body-m mt-12 flex h-[118px] items-center justify-center rounded-sm text-center">
          <p>
            <span className="text-text-primary-live">{name || (demoMode ? "홍길동" : "")}</span>{" "}
            회원님의 아이디는
            <br />
            <span className="text-text-primary-live">{fullEmail}</span> 입니다
          </p>
        </div>
        <button
          className="text-body-s mx-auto mt-6 block"
          onClick={() => goTo("password-form")}
          type="button"
        >
          비밀번호 찾기
        </button>
        <AuthBottomAction>
          <AuthButton onClick={showLogin} size="lg">
            로그인 화면으로
          </AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  const identityStatus = identityStatusByView[view];

  if (!identityStatus) return null;

  async function handleIdentityAction() {
    if (!identityStatus || requestRef.current) return;
    if (demoMode) {
      setView(isRetryIdentityStatus(identityStatus) ? "identity-ready" : "identity-requesting");
      return;
    }
    if (callback) {
      router.replace("/auth/recovery/email");
      return;
    }
    const request = new AbortController();
    requestRef.current = request;
    setView("identity-requesting");
    let verifying = false;
    try {
      const identityVerificationId = crypto.randomUUID();
      const draft = { name: name.trim(), phoneNumber: phone.replace(/-/g, "") };
      saveEmailRecoverySession({ ...draft, identityVerificationId });
      const result = await requestIdentityVerification(draft, {
        identityVerificationId,
        redirectUrl: `${window.location.origin}/auth/recovery/email/callback`,
      });
      if (request.signal.aborted) return;
      clearEmailRecoverySession();
      if (result.status === "cancelled") {
        setView("identity-cancelled");
        return;
      }
      verifying = true;
      setView("identity-verifying");
      const verified = await verifyIdentity(
        { identityVerificationId: result.identityVerificationId },
        { signal: request.signal },
      );
      const revealed = await revealEmail(verified.verificationToken, { signal: request.signal });
      if (!request.signal.aborted) {
        setFullEmail(revealed.email);
        setEmail(revealed.email);
        setView("full-email");
      }
    } catch {
      if (!request.signal.aborted)
        setView(verifying ? "identity-verification-failed" : "identity-failed");
    } finally {
      if (!request.signal.aborted) {
        clearEmailRecoverySession();
        requestRef.current = null;
      }
    }
  }

  return (
    <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
      <AuthIdentityVerification
        actionDisabled={identityStatus === "requesting" || identityStatus === "verifying"}
        description={identityDescriptionByStatus[identityStatus]}
        onAction={handleIdentityAction}
        status={identityStatus}
      />
    </RecoveryHeader>
  );
}
