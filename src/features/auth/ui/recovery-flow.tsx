"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type RecoveryView =
  | "email-form"
  | "masked-email"
  | "phone-form"
  | "phone-code"
  | "phone-code-error"
  | "phone-code-expired"
  | "full-email"
  | "not-found"
  | "password-form"
  | "password-sent";

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
  const [code, setCode] = useState("");

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
            onClick={() => goTo("phone-form")}
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

  const codeError =
    view === "phone-code-error"
      ? "인증번호가 일치하지 않습니다"
      : view === "phone-code-expired"
        ? "인증번호가 만료되었습니다. 다시 요청해 주세요."
        : undefined;
  const hasCodeInput = view !== "phone-form";

  function submitVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!demoMode) return;

    if (!hasCodeInput) {
      goTo("phone-code");
      return;
    }
    if (code === "123456") {
      goTo("full-email");
      return;
    }

    setView("phone-code-error");
  }

  return (
    <RecoveryHeader headerTitle={headerTitle} onBack={goBack}>
      <AuthTitle>휴대폰 본인 인증</AuthTitle>
      <RecoveryDescription>
        {"전체 이메일 주소를 확인하려면\n본인 인증이 필요해요."}
      </RecoveryDescription>
      <form className="mt-16" onSubmit={submitVerification}>
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
            placeholder="통신사 ▾  휴대폰번호 input field"
            value={phone}
          />
          {hasCodeInput ? (
            <div>
              <div className="border-w-xs border-border-primary bg-layer-surface-disabled flex h-13 items-center rounded-sm px-4">
                <input
                  aria-describedby={codeError ? "verification-code-error" : undefined}
                  aria-invalid={codeError ? true : undefined}
                  aria-label="인증번호 6자리"
                  className="text-body-s min-w-0 flex-1 bg-transparent outline-none"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => {
                    setCode(event.target.value.replace(/\D/g, ""));
                    if (view === "phone-code-error") setView("phone-code");
                  }}
                  placeholder="인증번호 6자리"
                  value={code}
                />
                <span className="text-caption-s font-semibold">
                  {view === "phone-code-expired" ? "00:00" : "02:59"}
                </span>
                <button
                  className="bg-layer-surface-default text-caption-s ml-2 rounded-xs px-2 py-1"
                  onClick={() => setView("phone-code")}
                  type="button"
                >
                  재전송
                </button>
              </div>
              {codeError ? (
                <p className="text-caption-s mt-2" id="verification-code-error" role="alert">
                  {codeError}
                </p>
              ) : null}
            </div>
          ) : (
            <AuthButton disabled={!demoMode} type="submit">
              인증 번호 전송
            </AuthButton>
          )}
        </div>
        {hasCodeInput ? (
          <button
            className="text-body-s text-text-secondary mx-auto mt-8 block underline underline-offset-2"
            onClick={() => setView("phone-code")}
            type="button"
          >
            인증번호가 오지 않나요?
          </button>
        ) : null}
        <div className={hasCodeInput ? "mt-3" : "mt-11"}>
          <AuthButton disabled={!demoMode} type="submit">
            확인
          </AuthButton>
        </div>
      </form>
    </RecoveryHeader>
  );
}
