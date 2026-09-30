"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { SocialProvider } from "@/features/auth/api/auth-types";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import { isSocialAuthAvailable, startSocialAuth } from "@/features/auth/model/oauth-authorize";

import { AuthButton, AuthSocialButton } from "./auth-form-controls";
import { AuthScreen } from "./auth-screen";
import { SignupTermsSheet } from "./signup-terms-sheet";

type SignupFlowProps = {
  initialSheetOpen?: boolean;
};

export function SignupFlow({ initialSheetOpen = false }: SignupFlowProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(initialSheetOpen);
  /* 소셜 버튼으로 연 약관 시트인지 구분한다. 동의하면 본인인증이 아니라 OAuth로 이동한다. */
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(null);
  const [socialError, setSocialError] = useState("");
  const { resetFlow } = useAuthFlow();

  function openTerms(provider: SocialProvider | null) {
    resetFlow();
    setSocialError("");
    setSocialProvider(provider);
    setSheetOpen(true);
  }

  /* client ID가 없으면 onClick을 주지 않아 버튼이 비활성("준비 중")이다. */
  const socialClick = (provider: SocialProvider) =>
    isSocialAuthAvailable(provider) ? () => openTerms(provider) : undefined;

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
        {/* 소셜 가입은 Figma 플로우대로 약관 시트를 먼저 거친 뒤 OAuth로 이동한다. */}
        <AuthSocialButton
          icon="/images/auth/kakao-logo.svg"
          label="카카오 회원가입"
          onClick={socialClick("KAKAO")}
          tone="kakao"
        />
        <AuthSocialButton
          icon="/images/auth/google-logo.svg"
          label="Google 회원가입"
          onClick={socialClick("GOOGLE")}
          tone="google"
        />
        <AuthButton onClick={() => openTerms(null)}>일반 회원가입</AuthButton>
        {socialError ? (
          <p className="text-body-s text-text-default" role="alert">
            {socialError}
          </p>
        ) : null}
      </div>

      <SignupTermsSheet
        /* 서버 응답이 필요 없는 화면 이동이라 항상 동작시킨다. */
        onAgree={(agreedCodes) => {
          setSheetOpen(false);
          if (!socialProvider) {
            router.push("/auth/signup/verify");
            return;
          }
          const started = startSocialAuth({
            agreedTerms: agreedCodes,
            entry: "signup",
            provider: socialProvider,
          });
          if (!started) setSocialError("소셜 가입을 시작하지 못했습니다. 다시 시도해 주세요.");
        }}
        onClose={() => {
          setSheetOpen(false);
          setSocialProvider(null);
        }}
        open={sheetOpen}
      />
    </AuthScreen>
  );
}
