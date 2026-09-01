"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

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

export function RecoveryFlow({ demoMode = false, initialView = "email-form" }: RecoveryFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<RecoveryView>(initialView);
  const [viewHistory, setViewHistory] = useState<RecoveryView[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  function showLogin() {
    router.push("/auth/login");
  }

  function goTo(nextView: RecoveryView) {
    setViewHistory((history) => [...history, view]);
    setView(nextView);
  }

  function goBack() {
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
    }

    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>{"가입 정보로\n이메일을 찾아보세요"}</AuthTitle>
        <form className="mt-16" onSubmit={submitEmailSearch}>
          <div className="flex flex-col gap-3">
            <AuthInput
              aria-label="이름"
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              onClear={() => setName("")}
              placeholder="이름"
              value={name}
            />
            <AuthInput
              aria-label="전화번호"
              autoComplete="tel"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              onClear={() => setPhone("")}
              placeholder="전화번호"
              value={phone}
            />
            <AuthButton disabled={!demoMode} type="submit">
              확인
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
            <span className="text-text-primary-live">이름</span> 회원님의 아이디는
            <br />
            <span className="text-text-primary-live">마스킹 이메일</span> 입니다
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
          <AuthButton onClick={showLogin}>로그인 화면으로</AuthButton>
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
          <AuthButton onClick={() => router.push("/auth/signup/terms")}>회원가입하기</AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  if (view === "password-form") {
    function submitPasswordReset(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (demoMode && name && phone && email) goTo("password-sent");
    }

    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>가입 정보로 비밀번호를 확인해보세요</AuthTitle>
        <RecoveryDescription>등록된 이메일로 재설정 링크를 보내드립니다.</RecoveryDescription>
        <form className="mt-16" onSubmit={submitPasswordReset}>
          <div className="flex flex-col gap-3">
            <AuthInput
              aria-label="이름"
              onChange={(event) => setName(event.target.value)}
              onClear={() => setName("")}
              placeholder="이름 input field"
              value={name}
            />
            <AuthInput
              aria-label="휴대폰번호"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              onClear={() => setPhone("")}
              placeholder="휴대폰번호 input field"
              value={phone}
            />
            <AuthInput
              aria-label="이메일"
              onChange={(event) => setEmail(event.target.value)}
              onClear={() => setEmail("")}
              placeholder="이메일 input field"
              type="email"
              value={email}
            />
          </div>
          <AuthBottomAction>
            <AuthButton disabled={!demoMode} type="submit">
              발송
            </AuthButton>
          </AuthBottomAction>
        </form>
      </RecoveryHeader>
    );
  }

  if (view === "password-sent") {
    return (
      <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
        <AuthTitle>{"등록된 이메일로\n비밀번호 재설정 링크를 보내드렸어요"}</AuthTitle>
        <p className="text-body-m mt-7">
          <span className="text-text-primary-live">이메일 ex***@gmail.com</span>으로 보내드렸어요
        </p>
        <AuthBottomAction>
          <AuthButton onClick={showLogin}>로그인 화면으로</AuthButton>
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
            <span className="text-text-primary-live">이름</span> 회원님의 아이디는
            <br />
            <span className="text-text-primary-live">이메일 마스킹 x</span> 입니다
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
          <AuthButton onClick={showLogin}>로그인 화면으로</AuthButton>
        </AuthBottomAction>
      </RecoveryHeader>
    );
  }

  const identityStatus = identityStatusByView[view];

  if (!identityStatus) return null;

  function handleIdentityAction() {
    if (!demoMode || !identityStatus) return;

    setView(isRetryIdentityStatus(identityStatus) ? "identity-ready" : "identity-requesting");
  }

  return (
    <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
      <AuthIdentityVerification
        actionDisabled={!demoMode}
        description={identityDescriptionByStatus[identityStatus]}
        onAction={handleIdentityAction}
        status={identityStatus}
      />
    </RecoveryHeader>
  );
}
