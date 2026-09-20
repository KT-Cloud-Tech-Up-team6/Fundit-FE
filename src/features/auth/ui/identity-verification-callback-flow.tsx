"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { verifyIdentity } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import { consumeIdentityRecoverySession } from "@/features/auth/model/auth-flow-session";

import { AuthIdentityVerification } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthScreen } from "./auth-screen";

type CallbackStatus = Extract<IdentityStatus, "verification-failed" | "verifying">;

const descriptionByStatus: Record<CallbackStatus, string> = {
  verifying: "인증 결과를 안전하게 확인 중입니다.\n잠시만 기다려 주세요.",
  "verification-failed":
    "본인인증이 취소됐거나 가입 진행 정보를 복구하지 못했습니다.\n본인인증을 다시 진행해 주세요.",
};

/* 모바일 PortOne 리다이렉트 결과 수신 전용 화면. AuthFlowProvider는 전체 페이지
   이동으로 비워져 있으므로, 여기서 sessionStorage 복구 → 서버 검증까지 마친 뒤
   /auth/signup/verify로 돌아간다. 그 화면은 verificationToken이 이미 있으면
   본인정보 입력을 건너뛰고 완료 화면으로 바로 들어간다. */
export function IdentityVerificationCallbackFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIdentityDraft, setSelectedTermCodes, setVerificationToken } = useAuthFlow();
  const [status, setStatus] = useState<CallbackStatus>("verifying");
  const startedRef = useRef(false);
  const verificationMutation = useMutation({
    mutationFn: (identityVerificationId: string) => verifyIdentity({ identityVerificationId }),
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function recover() {
      const session = consumeIdentityRecoverySession();
      if (!session) {
        setStatus("verification-failed");
        return;
      }
      setIdentityDraft(session.identityDraft);
      setSelectedTermCodes(session.agreedTerms);

      const identityVerificationId = searchParams.get("identityVerificationId");
      const failureCode = searchParams.get("code");
      if (failureCode || !identityVerificationId) {
        setStatus("verification-failed");
        return;
      }

      try {
        const result = await verificationMutation.mutateAsync(identityVerificationId);
        setVerificationToken(result.verificationToken);
        router.replace("/auth/signup/verify");
      } catch {
        setStatus("verification-failed");
      }
    }

    void recover();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 콜백 처리는 마운트 시 한 번만 실행한다.
  }, []);

  return (
    <AuthScreen onBack={() => router.replace("/auth/signup/verify")}>
      <AuthIdentityVerification
        description={descriptionByStatus[status]}
        onAction={() => router.replace("/auth/signup/verify")}
        status={status}
      />
    </AuthScreen>
  );
}
