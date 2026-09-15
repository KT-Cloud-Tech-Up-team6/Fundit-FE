"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { Select } from "@/shared/components/ui/select";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type SignupProfileView = "email" | "password" | "address";

const emailDomains = ["@gmail.com", "@naver.com", "@daum.com"];
const CUSTOM_DOMAIN = "custom";

function passwordCategoryCount(value: string) {
  return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z\d]/].filter((pattern) => pattern.test(value)).length;
}

/* 비밀번호 규칙. 화면 문구와 판정을 한곳에 둔다(백엔드 정책: 8자 이상 + 4종 중 3종). */
export const passwordRules = [
  { label: "8자 이상", test: (value: string) => value.length >= 8 },
  {
    label: "대문자/소문자/숫자/특수문자 중 3종 이상",
    test: (value: string) => passwordCategoryCount(value) >= 3,
  },
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
            placeholder="비밀번호를 입력해주세요"
            type="password"
            value={password}
          />
          <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
            {passwordRules.map((rule) => (
              <RuleItem key={rule.label} label={rule.label} met={rule.test(password)} />
            ))}
          </ul>

          <h2 className="text-title-s text-text-default mt-6">다시 한번 입력해주세요</h2>
          <div className="mt-2">
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
        <AuthTitle>{"배송지를 입력해두면\n이용이 편리해져요"}</AuthTitle>
        <div className="mt-16">
          <AuthInput
            aria-label="주소"
            autoComplete="street-address"
            onChange={(event) => setAddress(event.target.value)}
            onClear={() => setAddress("")}
            placeholder="도로명, 지번, 건물명 검색"
            startAdornment={<Image alt="" height={20} src="/icons/search.svg" width={20} />}
            value={address}
          />
        </div>
        <button
          className="text-body-s text-text-secondary mx-auto mt-6 block underline underline-offset-2"
          onClick={() => router.push("/auth/signup/complete")}
          type="button"
        >
          다음에 설정할게요
        </button>
        <AuthBottomAction>
          <AuthButton
            disabled={address.length === 0}
            onClick={() => router.push("/auth/signup/complete")}
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
      <AuthTitle>{"회원 가입을\n시작해볼까요?"}</AuthTitle>
      <form className="mt-16" onSubmit={submitEmail}>
        <h2 className="text-title-s text-text-default mb-3">이메일 주소를 입력해주세요</h2>
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
                shape="compact"
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
          "border-r-w-s border-b-w-s h-2 w-1.5 rotate-45",
          met ? "border-text-success" : "border-text-disabled",
        ].join(" ")}
      />
      <span className="sr-only">{met ? "충족" : "미충족"}</span>
    </li>
  );
}
