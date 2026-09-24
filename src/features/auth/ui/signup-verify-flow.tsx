"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";

import { requestIdentityVerification } from "@/features/auth/api/portone-identity-adapter";
import { verifyIdentity } from "@/features/auth/api/auth-api";
import type { IdentityDraft } from "@/features/auth/api/auth-types";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import {
  clearIdentityRecoverySessionIfCurrent,
  saveIdentityRecoverySession,
} from "@/features/auth/model/auth-flow-session";
import { isApiError } from "@/shared/api/api-error";

import { AuthButton, AuthInput } from "./auth-form-controls";
import { AuthIdentityVerification } from "./auth-identity-verification";
import type { IdentityStatus } from "./auth-identity-verification";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

/* 본인정보를 받은 즉시 PortOne을 열기 때문에 회원가입에는 안내만 하는 ready 화면이 없다. */
export type SignupVerifyView = Exclude<IdentityStatus, "ready"> | "information" | "done";

/* 제목·상태 문구·버튼 라벨은 AuthIdentityVerification이 소유한다. 여기서는 회원가입
   맥락에서만 달라지는 안내 문구를 준다. */
const descriptionByStatus: Record<Exclude<IdentityStatus, "ready">, string> = {
  requesting: "열린 인증 창에서\n본인인증을 완료해 주세요.",
  cancelled: "회원가입을 계속하려면\n본인인증을 다시 진행해 주세요.",
  failed: "인증 과정에서 문제가 발생했습니다.\n잠시 후 다시 시도해 주세요.",
  verifying: "인증 결과를 안전하게 확인 중입니다.\n잠시만 기다려 주세요.",
  "verification-failed":
    "인증 결과가 만료되었거나 유효하지 않습니다.\n본인인증을 다시 진행해 주세요.",
};

/* aria-label이 label 요소보다 우선하므로 두 값이 갈라지지 않게 한 곳에서만 정의한다.
   aria-label은 AuthInput이 지우기 버튼 이름을 만드는 데도 쓴다. */
const fieldLabels = { birthDate: "생년월일", name: "이름", phoneNumber: "휴대폰 번호" } as const;

function AuthFieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label className="text-label-l text-text-default mb-2 block" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

type SignupVerifyFlowProps = {
  initialView?: SignupVerifyView;
};

/* PortOne 응답에는 이름과 전화번호가 없으므로 인증창을 열기 전에 가입에 필요한
   본인정보를 직접 받고, 같은 draft를 PortOne prefill과 최종 가입 요청에 사용한다. */
export function SignupVerifyFlow({ initialView = "information" }: SignupVerifyFlowProps) {
  const router = useRouter();
  const fieldId = useId();
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
  /* 인증이 끝나기 전에 뒤로 가거나 다시 제출하면 앞선 요청의 결과는 버린다.
     남겨두면 수정 중인 폼을 덮고, 고치기 전 draft로 가입이 이어진다. */
  const runIdRef = useRef(0);
  function abandonVerification() {
    runIdRef.current++;
  }

  const identityMutation = useMutation({
    mutationFn: (input: { draft: IdentityDraft; redirectUrl: string }) =>
      requestIdentityVerification(input.draft, { redirectUrl: input.redirectUrl }),
  });
  const verificationMutation = useMutation({
    mutationFn: (identityVerificationId: string) => verifyIdentity({ identityVerificationId }),
  });

  /* 본인정보를 받은 직후 바로 인증창을 연다. 취소·실패 뒤 "다시 시도"도 같은 경로로 즉시 다시 연다. */
  async function startVerification(input: IdentityDraft) {
    const runId = ++runIdRef.current;
    const current = () => runId === runIdRef.current;
    setView("requesting");
    /* 모바일에서는 이 호출이 페이지 전체 리다이렉트로 이어질 수 있어, 이 함수가 이어서
       실행된다는 보장 없이 미리 복구용 정보를 남겨둔다. 같은 페이지에서 끝나면 아래에서
       바로 지운다. */
    saveIdentityRecoverySession({ agreedTerms: selectedTermCodes, identityDraft: input });
    try {
      const redirectUrl = `${window.location.origin}/auth/identity-verification/callback`;
      const identityResult = await identityMutation.mutateAsync({ draft: input, redirectUrl });
      clearIdentityRecoverySessionIfCurrent(current);
      if (!current()) return;
      if (identityResult.status === "cancelled") {
        setView("cancelled");
        return;
      }
      setView("verifying");
      const result = await verificationMutation.mutateAsync(identityResult.identityVerificationId);
      if (!current()) return;
      setVerificationToken(result.verificationToken);
      setView("done");
    } catch (error) {
      clearIdentityRecoverySessionIfCurrent(current);
      if (!current()) return;
      setView(isApiError(error) ? "verification-failed" : "failed");
    }
  }

  if (view === "information") {
    const valid =
      draft.name.trim().length > 0 &&
      /^\d{4}-\d{2}-\d{2}$/.test(draft.birthDate) &&
      /^01\d{8,9}$/.test(draft.phoneNumber);

    function submitInformation(event: FormEvent<HTMLFormElement>) {
      event.preventDefault();
      if (!valid) return;
      const verified = { ...draft, name: draft.name.trim() };
      setIdentityDraft(verified);
      void startVerification(verified);
    }

    return (
      <AuthScreen onBack={() => router.back()}>
        <AuthTitle>펀딧에 오신 걸 환영해요</AuthTitle>
        <p className="text-body-s text-text-secondary mt-3 whitespace-pre-line">
          {"안전한 가입을 위해 휴대폰 본인인증이 필요해요.\n입력한 정보로 본인인증을 진행합니다."}
        </p>
        <form className="mt-12 flex flex-1 flex-col" onSubmit={submitInformation}>
          <div className="flex flex-col gap-5">
            <div>
              <AuthFieldLabel htmlFor={`${fieldId}-name`}>{fieldLabels.name}</AuthFieldLabel>
              <AuthInput
                aria-label={fieldLabels.name}
                autoComplete="name"
                id={`${fieldId}-name`}
                onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                onClear={() => setDraft((value) => ({ ...value, name: "" }))}
                placeholder="실명을 입력해 주세요"
                value={draft.name}
              />
            </div>
            <div>
              <AuthFieldLabel htmlFor={`${fieldId}-birth`}>{fieldLabels.birthDate}</AuthFieldLabel>
              <AuthInput
                aria-label={fieldLabels.birthDate}
                autoComplete="bday"
                id={`${fieldId}-birth`}
                max="9999-12-31"
                onChange={(event) =>
                  setDraft((value) => ({ ...value, birthDate: event.target.value }))
                }
                type="date"
                value={draft.birthDate}
              />
            </div>
            <div>
              <AuthFieldLabel htmlFor={`${fieldId}-phone`}>
                {fieldLabels.phoneNumber}
              </AuthFieldLabel>
              <AuthInput
                aria-label={fieldLabels.phoneNumber}
                autoComplete="tel"
                id={`${fieldId}-phone`}
                inputMode="numeric"
                onChange={(event) =>
                  setDraft((value) => ({
                    ...value,
                    phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 11),
                  }))
                }
                onClear={() => setDraft((value) => ({ ...value, phoneNumber: "" }))}
                placeholder="'-' 없이 숫자만 입력해 주세요"
                value={draft.phoneNumber}
              />
            </div>
          </div>
          <AuthBottomAction>
            <p className="text-caption-s text-text-secondary mb-3 text-center">
              버튼을 누르면 포트원 본인인증 화면이 열립니다.
            </p>
            <AuthButton disabled={!valid} type="submit">
              본인인증하기
            </AuthButton>
          </AuthBottomAction>
        </form>
      </AuthScreen>
    );
  }

  if (view === "done") {
    return (
      <AuthScreen onBack={() => setView("information")}>
        {/* FL_C_ME_AUTH_8: 제목·그래픽(112px 프레임)을 가운데에 두고 Figma처럼 72px 올린다.
            padding 대신 translate라서 낮은 화면에서도 버튼이 아래로 밀리지 않는다. */}
        <div className="flex flex-1 -translate-y-18 flex-col items-center justify-center gap-10 text-center">
          <h1 className="text-title-l text-text-default whitespace-pre-line">
            {"본인 확인이\n완료되었습니다"}
          </h1>
          <div className="flex size-28 items-center justify-center">
            <Image alt="" height={92} src="/images/auth/verification-complete.svg" width={92} />
          </div>
        </div>
        <AuthBottomAction>
          <AuthButton onClick={() => router.push("/auth/signup/profile")}>다음</AuthButton>
        </AuthBottomAction>
      </AuthScreen>
    );
  }

  const status = view;

  return (
    <AuthScreen
      onBack={() => {
        abandonVerification();
        setView("information");
      }}
    >
      <AuthIdentityVerification
        description={descriptionByStatus[status]}
        onAction={() =>
          identityDraft ? void startVerification(identityDraft) : setView("information")
        }
        status={status}
      />
    </AuthScreen>
  );
}
