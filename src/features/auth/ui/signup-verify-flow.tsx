"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthButton } from "./auth-form-controls";
import { AuthIdentityVerification, isRetryIdentityStatus } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type SignupVerifyView = IdentityStatus | "done";

/* 제목·상태 문구·버튼 라벨은 AuthIdentityVerification이 소유한다. 여기서는 회원가입
   맥락에서만 달라지는 안내 문구를 준다. */
const descriptionByStatus: Record<IdentityStatus, string> = {
  ready: "안전한 가입을 위해\n휴대폰 본인인증이 필요해요.",
  requesting: "열린 인증 창에서\n본인인증을 완료해 주세요.",
  cancelled: "회원가입을 계속하려면\n본인인증을 다시 진행해 주세요.",
  failed: "인증 과정에서 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
  verifying: "인증 결과를 안전하게 확인 중입니다.\n잠시만 기다려 주세요.",
  "verification-failed":
    "인증 결과가 만료되었거나 유효하지 않습니다.\n본인인증을 다시 진행해 주세요.",
};

type SignupVerifyFlowProps = {
  initialView?: SignupVerifyView;
};

/* 이름·생년월일·통신사·휴대폰번호·인증번호 입력은 포트원 인증창이 담당한다.
   와이어프레임 FL_C_ME_AUTH_2~7의 자체 입력 폼은 구현하지 않는다. */
export function SignupVerifyFlow({ initialView = "ready" }: SignupVerifyFlowProps) {
  const router = useRouter();
  const [view, setView] = useState<SignupVerifyView>(initialView);

  if (view === "done") {
    return (
      <AuthScreen onBack={() => setView("ready")}>
        {/* FL_C_ME_AUTH_8은 제목을 가운데 정렬한다. AuthTitle이 정렬을 상속받는다. */}
        <div className="text-center">
          <AuthTitle>{"본인 확인이\n완료되었습니다"}</AuthTitle>
        </div>
        <div aria-hidden="true" className="bg-layer-surface-disabled mx-auto mt-18 size-[150px]" />
        <AuthBottomAction>
          <AuthButton onClick={() => router.push("/auth/signup/profile")}>다음</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  const status = view;

  function handleAction() {
    if (isRetryIdentityStatus(status)) {
      setView("ready");
      return;
    }

    /* 실제 연동 전까지는 인증창 대신 완료 화면으로 넘긴다. */
    setView("done");
  }

  return (
    <AuthScreen onBack={() => router.back()}>
      <AuthIdentityVerification
        description={descriptionByStatus[status]}
        onAction={handleAction}
        status={status}
      />
    </AuthScreen>
  );
}
