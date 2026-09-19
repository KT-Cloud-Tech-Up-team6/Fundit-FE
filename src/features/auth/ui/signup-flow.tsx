"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuthFlow } from "@/features/auth/model/auth-flow-context";

import { AuthButton, AuthSocialButton } from "./auth-form-controls";
import { AuthScreen } from "./auth-screen";
import { SignupTermsSheet } from "./signup-terms-sheet";

type SignupFlowProps = {
  initialSheetOpen?: boolean;
};

export function SignupFlow({ initialSheetOpen = false }: SignupFlowProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(initialSheetOpen);
  const { resetFlow } = useAuthFlow();

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
        {/* 소셜 가입도 약관 시트를 거치지만 OAuth 연동 전까지는 진입할 수 없다. */}
        <AuthSocialButton icon="/images/auth/kakao-logo.svg" label="카카오 회원가입" tone="kakao" />
        <AuthSocialButton
          icon="/images/auth/google-logo.svg"
          label="Google 회원가입"
          tone="google"
        />
        <AuthButton
          onClick={() => {
            resetFlow();
            setSheetOpen(true);
          }}
        >
          일반 회원가입
        </AuthButton>
      </div>

      <SignupTermsSheet
        /* 서버 응답이 필요 없는 화면 이동이라 항상 동작시킨다. */
        onAgree={() => {
          setSheetOpen(false);
          router.push("/auth/signup/verify");
        }}
        onClose={() => setSheetOpen(false)}
        open={sheetOpen}
      />
    </AuthScreen>
  );
}
