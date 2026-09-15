"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { requestIdentityVerification } from "@/features/auth/api/portone-identity-adapter";
import { verifyIdentity } from "@/features/auth/api/auth-api";
import type { IdentityDraft } from "@/features/auth/api/auth-types";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import {
  clearIdentityRecoverySession,
  saveIdentityRecoverySession,
} from "@/features/auth/model/auth-flow-session";
import { isApiError } from "@/shared/api/api-error";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthIdentityVerification, isRetryIdentityStatus } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

export type SignupVerifyView = IdentityStatus | "information" | "done";

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

/* PortOne 응답에는 이름과 전화번호가 없으므로 인증창을 열기 전에 가입에 필요한
   본인정보를 직접 받고, 같은 draft를 PortOne prefill과 최종 가입 요청에 사용한다. */
export function SignupVerifyFlow({ initialView = "information" }: SignupVerifyFlowProps) {
  const router = useRouter();
  const {
    identityDraft,
    selectedTermCodes,
    setIdentityDraft,
    setVerificationToken,
    verificationToken,
  } = useAuthFlow();
  /* 모바일 리다이렉트 콜백이 verificationToken을 이미 채워놓고 이 화면으로 돌아왔다면
     본인정보 입력을 다시 시키지 않고 완료 화면으로 바로 보낸다. */
  const [view, setView] = useState<SignupVerifyView>(() =>
    initialView === "information" && verificationToken ? "done" : initialView,
  );
  const [draft, setDraft] = useState<IdentityDraft>(
    identityDraft ?? { birthDate: "", name: "", phoneNumber: "" },
  );
  const identityMutation = useMutation({
    mutationFn: (input: { draft: IdentityDraft; redirectUrl: string }) =>
      requestIdentityVerification(input.draft, { redirectUrl: input.redirectUrl }),
  });
  const verificationMutation = useMutation({
    mutationFn: (identityVerificationId: string) => verifyIdentity({ identityVerificationId }),
  });

  if (view === "information") {
    const valid =
      draft.name.trim().length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) &&
      /^01\d{8,9}$/.test(draft.phoneNumber);

    function submitInformation(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!valid) return;
      setIdentityDraft({ ...draft, name: draft.name.trim() });
      setView("ready");
    }

    return (
      <AuthScreen onBack={() => router.back()}>
        <AuthTitle>펀딧에 오신 걸 환영해요</AuthTitle>
        <p className="text-body-emphasis text-text-secondary mt-2">
          계속하기 위해 본인확인을 진행해주세요
        </p>
        <form className="mt-16 flex flex-col gap-6" onSubmit={submitInformation}>
          <div>
            <h2 className="text-title-s text-text-default mb-3">이름을 입력해주세요</h2>
            <AuthInput
              aria-label="이름"
              autoComplete="name"
              onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
              onClear={() => setDraft((value) => ({ ...value, name: "" }))}
              placeholder="이름"
              value={draft.name}
            />
          </div>
          <div>
            <h2 className="text-title-s text-text-default mb-3">생년월일을 입력해주세요</h2>
            <AuthInput
              aria-label="생년월일"
              autoComplete="bday"
              max="9999-12-31"
              onChange={(event) =>
                setDraft((value) => ({ ...value, birthDate: event.target.value }))
              }
              type="date"
              value={draft.birthDate}
            />
          </div>
          <div>
            <h2 className="text-title-s text-text-default mb-3">휴대폰 번호를 입력해주세요</h2>
            <AuthInput
              aria-label="휴대폰 번호"
              autoComplete="tel"
              inputMode="numeric"
              onChange={(event) =>
                setDraft((value) => ({
                  ...value,
                  phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 11),
                }))
              }
              onClear={() => setDraft((value) => ({ ...value, phoneNumber: "" }))}
              placeholder="휴대폰 번호 ('-' 제외)"
              value={draft.phoneNumber}
            />
          </div>
          <AuthButton disabled={!valid} type="submit">
            다음
          </AuthButton>
        </form>
      </AuthScreen>
    );
  }

  if (view === "done") {
    return (
      <AuthScreen onBack={() => setView("information")}>
        <div className="flex flex-col items-center pt-14 text-center">
          <h1 className="text-heading-m text-text-title whitespace-pre-line">
            {"본인 확인이\n완료되었습니다"}
          </h1>
          <Image
            alt=""
            className="mt-10 size-[100px]"
            height={100}
            src="/images/auth/verification-complete.svg"
            width={100}
          />
        </div>
        <AuthBottomAction>
          <AuthButton onClick={() => router.push("/auth/signup/profile")}>다음</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  const status = view;

  async function handleAction() {
    if (isRetryIdentityStatus(status)) {
      setView("ready");
      return;
    }

    if (!identityDraft) {
      setView("information");
      return;
    }

    setView("requesting");
    /* 모바일에서는 이 호출이 페이지 전체 리다이렉트로 이어질 수 있어, 이 함수가 이어서
       실행된다는 보장 없이 미리 복구용 정보를 남겨둔다. 같은 페이지에서 끝나면 아래에서
       바로 지운다. */
    saveIdentityRecoverySession({ agreedTerms: selectedTermCodes, identityDraft });
    try {
      const redirectUrl = `${window.location.origin}/auth/identity-verification/callback`;
      const identityResult = await identityMutation.mutateAsync({
        draft: identityDraft,
        redirectUrl,
      });
      clearIdentityRecoverySession();
      if (identityResult.status === "cancelled") {
        setView("cancelled");
        return;
      }
      setView("verifying");
      const result = await verificationMutation.mutateAsync(identityResult.identityVerificationId);
      setVerificationToken(result.verificationToken);
      setView("done");
    } catch (error) {
      clearIdentityRecoverySession();
      setView(isApiError(error) ? "verification-failed" : "failed");
    }
  }

  return (
    <AuthScreen onBack={() => setView("information")}>
      <AuthIdentityVerification
        description={descriptionByStatus[status]}
        onAction={() => void handleAction()}
        status={status}
      />
    </AuthScreen>
  );
}
