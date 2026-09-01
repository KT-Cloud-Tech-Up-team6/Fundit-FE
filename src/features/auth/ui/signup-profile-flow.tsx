"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Select } from "@/shared/components/ui/select";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type SignupProfileView = "email" | "password" | "address";

const emailDomains = ["@gmail.com", "@naver.com", "@daum.com"];
const CUSTOM_DOMAIN = "custom";

/* 비밀번호 규칙. 화면 문구와 판정을 한곳에 둔다. */
export const passwordRules = [
  { label: "영문 포함", test: (value: string) => /[a-zA-Z]/.test(value) },
  { label: "숫자 포함", test: (value: string) => /\d/.test(value) },
  { label: "8-20자 이내", test: (value: string) => value.length >= 8 && value.length <= 20 },
];

type SignupProfileFlowProps = {
  initialEmailTaken?: boolean;
  initialView?: SignupProfileView;
};

export function SignupProfileFlow({
  initialEmailTaken = false,
  initialView = "email",
}: SignupProfileFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<SignupProfileView>(initialView);
  const [emailLocal, setEmailLocal] = useState(initialEmailTaken ? "fundit" : "");
  const [domain, setDomain] = useState(initialEmailTaken ? emailDomains[0] : "");
  const [customDomain, setCustomDomain] = useState("");
  const [emailTaken, setEmailTaken] = useState(initialEmailTaken);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [address, setAddress] = useState("");

  const usesCustomDomain = domain === CUSTOM_DOMAIN;
  /* 직접 입력 값을 domain에 그대로 담으면 첫 글자에서 usesCustomDomain이 꺼져
     입력칸이 사라진다. 선택 값과 직접 입력 값을 분리해서 들고 있는다. */
  const resolvedDomain = usesCustomDomain ? customDomain : domain;
  const emailFilled = emailLocal.length > 0 && resolvedDomain.length > 0;
  const passwordValid = passwordRules.every((rule) => rule.test(password));
  const passwordMatched = password.length > 0 && password === passwordConfirm;

  if (view === "password") {
    function submitPassword(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (passwordValid && passwordMatched) setView("address");
    }

    return (
      <AuthScreen onBack={() => setView("email")}>
        <AuthTitle>비밀번호를 설정해주세요</AuthTitle>
        <form className="mt-16" onSubmit={submitPassword}>
          <AuthInput
            aria-label="비밀번호"
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8-20자리로 입력해주세요"
            type="password"
            value={password}
          />
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            {passwordRules.map((rule) => (
              <RuleItem key={rule.label} label={rule.label} met={rule.test(password)} />
            ))}
          </ul>

          <h2 className="text-title-s text-text-default mt-6">다시 한번 입력해주세요</h2>
          <div className="mt-3">
            <AuthInput
              aria-label="비밀번호 확인"
              autoComplete="new-password"
              onChange={(event) => setPasswordConfirm(event.target.value)}
              placeholder="다시 한번 입력해주세요"
              type="password"
              value={passwordConfirm}
            />
          </div>
          <ul className="mt-2">
            <RuleItem label="비밀번호 일치" met={passwordMatched} />
          </ul>

          <AuthButton className="mt-6" disabled={!passwordValid || !passwordMatched} type="submit">
            다음
          </AuthButton>
        </form>
      </AuthScreen>
    );
  }

  if (view === "address") {
    return (
      <AuthScreen onBack={() => setView("password")}>
        <AuthTitle>주소를 입력해주세요</AuthTitle>
        <div className="mt-16">
          <AuthInput
            aria-label="주소"
            autoComplete="street-address"
            onChange={(event) => setAddress(event.target.value)}
            onClear={() => setAddress("")}
            placeholder="주소 검색"
            value={address}
          />
        </div>
        <button
          className="text-body-s text-text-secondary mx-auto mt-6 block underline underline-offset-2"
          onClick={() => router.push("/auth/signup/done")}
          type="button"
        >
          다음에 설정할게요
        </button>
        <AuthBottomAction>
          <AuthButton
            disabled={address.length === 0}
            onClick={() => router.push("/auth/signup/done")}
          >
            다음
          </AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  /* 중복 확인은 API가 담당한다. 여기서는 오류를 지어내지 않고 다음 단계로 넘긴다.
     중복 오류 화면은 initialEmailTaken으로만 표현한다. */
  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setEmailTaken(false);
    setView("password");
  }

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthTitle>이메일을 입력해주세요</AuthTitle>
      <form className="mt-16" onSubmit={submitEmail}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <AuthInput
              aria-label="이메일 아이디"
              autoComplete="username"
              errorMessage={emailTaken ? "이미 가입된 주소입니다" : undefined}
              id="signup-email-local"
              onChange={(event) => {
                setEmailLocal(event.target.value);
                setEmailTaken(false);
              }}
              onClear={() => setEmailLocal("")}
              placeholder="이메일"
              value={emailLocal}
            />
          </div>
          <div className="w-[148px] shrink-0">
            {usesCustomDomain ? (
              <AuthInput
                aria-label="이메일 도메인 직접 입력"
                onChange={(event) => setCustomDomain(event.target.value)}
                onClear={() => setCustomDomain("")}
                placeholder="@직접 입력"
                value={customDomain}
              />
            ) : (
              <Select
                aria-label="이메일 도메인"
                onChange={(event) => setDomain(event.target.value)}
                value={domain}
              >
                <option value="">@ 선택</option>
                <option value={CUSTOM_DOMAIN}>직접 입력</option>
                {emailDomains.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>

        <AuthButton className="mt-6" disabled={!emailFilled} type="submit">
          다음
        </AuthButton>
      </form>
    </AuthScreen>
  );
}

function RuleItem({ label, met }: { label: string; met: boolean }) {
  return (
    <li
      className={[
        "text-caption-s flex items-center gap-1",
        met ? "text-text-success" : "text-text-secondary",
      ].join(" ")}
    >
      {label}
      <span
        aria-hidden
        className={[
          "h-2 w-1.5 rotate-45 border-r-[1.3px] border-b-[1.3px]",
          met ? "border-text-success" : "border-text-disabled",
        ].join(" ")}
      />
      <span className="sr-only">{met ? "충족" : "미충족"}</span>
    </li>
  );
}
