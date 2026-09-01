"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthButton } from "./auth-form-controls";
import { AuthScreen, AuthTitle } from "./auth-screen";
import { SignupTermsSheet } from "./signup-terms-sheet";

type SignupFlowProps = {
  initialSheetOpen?: boolean;
};

export function SignupFlow({ initialSheetOpen = false }: SignupFlowProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(initialSheetOpen);

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthTitle>{"회원가입을 위한 단계\n더미 텍스트 입니다"}</AuthTitle>
      <div className="mt-16 flex flex-col gap-3">
        {/* 소셜 가입도 약관 시트를 거치지만 OAuth 연동 전까지는 진입할 수 없다. */}
        <AuthButton aria-label="카카오로 회원가입" disabled>
          카카오 회원가입
        </AuthButton>
        <AuthButton aria-label="Google로 회원가입" disabled>
          Google 회원가입
        </AuthButton>
        <AuthButton onClick={() => setSheetOpen(true)}>일반 회원가입</AuthButton>
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
