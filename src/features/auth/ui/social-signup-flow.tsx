"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import { checkEmail, signupSocial } from "@/features/auth/api/auth-api";
import type { SocialProvider } from "@/features/auth/api/auth-types";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import {
  isValidEmail,
  isValidPhone,
  nicknameSchema,
  normalizePhoneInput,
} from "@/features/auth/model/auth-input";
import { useAuth } from "@/providers/auth-provider";
import { isApiError } from "@/shared/api/api-error";
import { TextButton } from "@/shared/components/ui/text-button";

import { startSocialAuth } from "../model/oauth-authorize";
import { existingProvider, providerLabel } from "../model/social-auth-error";
import {
  clearSocialSignupSession,
  readSocialSignupSession,
  saveSocialSignupAgreedTerms,
} from "../model/social-signup-session";
import type { SocialSignupSession } from "../model/social-signup-session";

import { AuthButton, AuthFieldLabel, AuthInput } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";
import { SignupTermsSheet } from "./signup-terms-sheet";

type Failure =
  | { kind: "restart"; message: string }
  | { kind: "email-exists" }
  | { kind: "social-exists"; provider: SocialProvider };

/* BE는 signupToken을 검증보다 먼저 소비하고, member-service 실패까지 503으로 바꿔 내려 원인을 구분할 수
   없다. 그래서 401(만료)과 503 등은 모두 "처음부터 다시"로 안내한다. 이메일 충돌만 원인이 분명하다. */
function failureFrom(error: unknown, provider: SocialProvider): Failure {
  if (isApiError(error)) {
    if (error.code === "SOCIAL_ACCOUNT_EXISTS")
      return { kind: "social-exists", provider: existingProvider(error.detail) ?? provider };
    if (error.code === "EMAIL_ALREADY_EXISTS") return { kind: "email-exists" };
    if (error.status === 401)
      return {
        kind: "restart",
        message: "소셜 인증 정보가 만료됐어요.\n처음부터 다시 시도해 주세요.",
      };
  }
  return { kind: "restart", message: "가입을 완료하지 못했어요.\n처음부터 다시 시도해 주세요." };
}

export function SocialSignupFlow() {
  const router = useRouter();
  /* 콜백이 세션 스토리지에 남긴 가입 정보를 읽는다. 서버에는 없는 값이라 마운트 뒤에 읽는다. */
  const [session, setSession] = useState<SocialSignupSession | null | undefined>(undefined);

  /* 한 번만 읽어 고정한다. 제출 직전에 저장소를 비워도 화면이 "가입 정보 없음"으로 바뀌지 않게,
     저장소를 계속 구독하지 않고 이 state에 담아 둔다. */
  useEffect(() => {
    const timer = window.setTimeout(() => setSession(readSocialSignupSession()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (session === undefined)
    return (
      <AuthScreen withHeader={false}>
        <p className="text-body-m text-text-secondary text-center" role="status">
          가입 정보를 확인하고 있어요.
        </p>
      </AuthScreen>
    );

  if (session === null)
    return (
      <AuthScreen withHeader={false}>
        <AuthTitle>{"가입 정보를\n찾지 못했어요"}</AuthTitle>
        <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line" role="alert">
          {"소셜 인증 정보가 만료됐거나 이미 사용됐어요.\n처음부터 다시 시도해 주세요."}
        </p>
        <AuthBottomAction>
          <AuthButton onClick={() => router.replace("/auth/signup")}>회원가입으로 가기</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );

  return <SocialSignupForm session={session} />;
}

function SocialSignupForm({ session }: { session: SocialSignupSession }) {
  const router = useRouter();
  const { authenticate } = useAuth();
  const { resetFlow } = useAuthFlow();
  const fieldId = useId();
  /* 구글 name은 프로필 이름(보통 실명)이라 이름 칸에, 카카오 name은 닉네임이라 닉네임 칸에 채운다.
     실명이 닉네임(공개 값)으로 흘러가지 않게 구글의 닉네임은 비워 둔다. */
  const [name, setName] = useState(session.provider === "GOOGLE" ? (session.name ?? "") : "");
  const [nickname, setNickname] = useState(
    session.provider === "KAKAO" ? (session.name ?? "").slice(0, 50) : "",
  );
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [agreedTerms, setAgreedTerms] = useState(session.agreedTerms);
  const [termsOpen, setTermsOpen] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  /* 아직 이 화면에 있는지 본다. 이메일 확인이나 가입 요청을 기다리는 사이 사용자가 뒤로 가거나 화면을 벗어나면,
     떠난 화면이 뒤늦게 가입 요청을 보내거나 이동을 덮어쓰지 않게 한다. StrictMode의 가짜 unmount는 effect가 다시 true로 돌린다. */
  const activeRef = useRef(false);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const needsEmail = session.email === null;
  const valid =
    agreedTerms.length > 0 &&
    name.trim().length > 0 &&
    nicknameSchema.safeParse(nickname).success &&
    isValidPhone(phone) &&
    (!needsEmail || isValidEmail(email.trim()));
  const startHref = session.entry === "signup" ? "/auth/signup" : "/auth/login";

  function leave() {
    activeRef.current = false;
    clearSocialSignupSession();
    router.replace(startHref);
  }

  function restart(provider: SocialProvider = session.provider) {
    const started = startSocialAuth({
      agreedTerms,
      entry: session.entry,
      provider,
    });
    if (!started)
      setFailure({
        kind: "restart",
        message: "소셜 가입을 시작하지 못했어요.\n다시 시도해 주세요.",
      });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setEmailError(undefined);
    try {
      if (needsEmail) {
        // 가입 요청은 토큰을 소비하므로 이메일 중복은 요청 전에 미리 막는다.
        try {
          const result = await checkEmail(email.trim());
          if (!result.available) {
            setEmailError("이미 가입된 주소입니다.");
            return;
          }
        } catch (error) {
          setEmailError(
            isApiError(error) && error.status === 400
              ? "이메일 형식을 확인해 주세요."
              : "이메일을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          );
          return;
        }
      }
      // 이메일 확인을 기다리는 사이 화면을 떠났다면 가입 요청을 보내지 않는다(요청하면 계정이 만들어진다).
      if (!activeRef.current) return;
      // 같은 signupToken은 다시 보낼 수 없다. 요청 전에 지워 실패한 뒤 새로고침으로 재사용하지 않게 한다.
      clearSocialSignupSession();
      const result = await signupSocial({
        agreedTerms,
        ...(needsEmail ? { email: email.trim() } : {}),
        name: name.trim(),
        nickname: nickname.trim(),
        phoneNumber: phone,
        signupToken: session.signupToken,
      });
      const authentication = authenticate(result.accessToken);
      resetFlow();
      await authentication;
      // 요청을 보낸 뒤 사용자가 화면을 떠났다면 계정은 이미 만들어졌으니 인증까지만 하고 그 이동을 덮어쓰지 않는다.
      if (activeRef.current) router.push("/auth/signup/complete");
    } catch (error) {
      setFailure(failureFrom(error, session.provider));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  if (failure) {
    const view =
      failure.kind === "email-exists"
        ? {
            action: (
              <AuthButton onClick={() => router.replace("/auth/login")}>이메일로 로그인</AuthButton>
            ),
            message: "이미 이 이메일로 가입된 계정이 있어요.\n이메일로 로그인해 주세요.",
            secondary: needsEmail ? (
              <TextButton className="h-10 px-2 py-1" onClick={() => restart()} showIcon={false}>
                다른 이메일로 다시 시도
              </TextButton>
            ) : null,
            title: "이미 가입된\n계정이 있어요",
          }
        : failure.kind === "social-exists"
          ? {
              action: (
                <AuthButton onClick={() => restart(failure.provider)}>
                  {providerLabel[failure.provider]}로 로그인
                </AuthButton>
              ),
              message: `이미 ${providerLabel[failure.provider]} 계정으로 가입된 이메일이에요.`,
              secondary: null,
              title: "이미 가입된\n계정이에요",
            }
          : {
              action: <AuthButton onClick={() => restart()}>다시 시도</AuthButton>,
              message: failure.message,
              secondary: null,
              title: "가입하지\n못했어요",
            };
    return (
      <AuthScreen withHeader={false}>
        <AuthTitle>{view.title}</AuthTitle>
        <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line" role="alert">
          {view.message}
        </p>
        <AuthBottomAction>
          {view.secondary ? <div className="mb-3 flex justify-center">{view.secondary}</div> : null}
          {view.action}
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  /* 로그인 화면에서 진입해 미가입으로 판정됐다면 약관을 아직 받지 못했다(가입 화면 진입은 OAuth 앞에서 받았다).
     로그인을 눌렀는데 가입 폼이 바로 나오면 당황스러우니, 미가입 계정이라는 것부터 알리고 약관에 동의한 뒤에만 폼을 보인다. */
  if (agreedTerms.length === 0) {
    return (
      <AuthScreen withHeader={false}>
        <AuthTitle>{"아직 가입되지 않은\n계정이에요"}</AuthTitle>
        <p className="text-body-m text-text-secondary mt-4 whitespace-pre-line">
          {`약관에 동의하면 ${providerLabel[session.provider]} 계정으로\n가입을 이어갈 수 있어요.`}
        </p>
        <AuthBottomAction>
          <div className="mb-3 flex justify-center">
            <TextButton className="h-10 px-2 py-1" onClick={leave} showIcon={false}>
              {session.entry === "signup" ? "회원가입으로 돌아가기" : "로그인으로 돌아가기"}
            </TextButton>
          </div>
          <AuthButton onClick={() => setTermsOpen(true)}>약관 보고 계속하기</AuthButton>
        </AuthBottomAction>
        <SignupTermsSheet
          onAgree={(codes) => {
            setTermsOpen(false);
            setAgreedTerms(codes);
            saveSocialSignupAgreedTerms(codes);
          }}
          onClose={() => setTermsOpen(false)}
          open={termsOpen}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen onBack={leave}>
      <AuthTitle>{`${providerLabel[session.provider]} 계정으로\n가입을 마무리해요`}</AuthTitle>
      <p className="text-body-s text-text-secondary mt-3 whitespace-pre-line">
        {"이름, 닉네임, 휴대폰 번호를 입력해 주세요."}
      </p>
      <form className="mt-12 flex flex-1 flex-col" onSubmit={submit}>
        <div className="flex flex-col gap-5">
          <div>
            <AuthFieldLabel htmlFor={`${fieldId}-email`}>이메일</AuthFieldLabel>
            {needsEmail ? (
              <AuthInput
                aria-label="이메일"
                autoComplete="email"
                disabled={submitting}
                errorMessage={emailError}
                id={`${fieldId}-email`}
                inputMode="email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(undefined);
                }}
                onClear={() => setEmail("")}
                placeholder="이메일을 입력해 주세요"
                type="email"
                value={email}
              />
            ) : (
              <AuthInput
                aria-label="이메일"
                id={`${fieldId}-email`}
                readOnly
                value={session.email ?? ""}
              />
            )}
          </div>
          <div>
            <AuthFieldLabel htmlFor={`${fieldId}-name`}>이름</AuthFieldLabel>
            <AuthInput
              aria-label="이름"
              autoComplete="name"
              disabled={submitting}
              id={`${fieldId}-name`}
              onChange={(event) => setName(event.target.value)}
              onClear={() => setName("")}
              placeholder="이름을 입력해 주세요"
              value={name}
            />
          </div>
          <div>
            <AuthFieldLabel htmlFor={`${fieldId}-nickname`}>닉네임</AuthFieldLabel>
            <AuthInput
              aria-label="닉네임"
              autoComplete="nickname"
              disabled={submitting}
              errorMessage={nickname.trim().length > 50 ? "50자 이하로 입력해 주세요." : undefined}
              id={`${fieldId}-nickname`}
              onChange={(event) => setNickname(event.target.value)}
              onClear={() => setNickname("")}
              placeholder="닉네임을 입력해 주세요"
              value={nickname}
            />
          </div>
          <div>
            <AuthFieldLabel htmlFor={`${fieldId}-phone`}>휴대폰 번호</AuthFieldLabel>
            <AuthInput
              aria-label="휴대폰 번호"
              autoComplete="tel"
              disabled={submitting}
              id={`${fieldId}-phone`}
              inputMode="numeric"
              onChange={(event) => setPhone(normalizePhoneInput(event.target.value))}
              onClear={() => setPhone("")}
              placeholder="'-' 없이 숫자만 입력해 주세요"
              value={phone}
            />
          </div>
        </div>
        <AuthBottomAction>
          <AuthButton disabled={!valid || submitting} type="submit">
            {submitting ? "가입 중" : "가입하기"}
          </AuthButton>
        </AuthBottomAction>
      </form>
    </AuthScreen>
  );
}
