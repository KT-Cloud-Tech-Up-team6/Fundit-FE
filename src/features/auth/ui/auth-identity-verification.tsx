import { Icon } from "@/shared/components/ui/icon";

import { AuthButton } from "./auth-form-controls";
import { AuthBottomAction, AuthTitle } from "./auth-screen";

export type IdentityStatus =
  "ready" | "requesting" | "cancelled" | "failed" | "verifying" | "verification-failed";

type IdentityCopy = {
  action: string;
  status: string;
  title: string;
};

/* 포트원 본인인증은 계정 복구와 회원가입에서 같은 화면을 쓴다. 제목·상태 문구·버튼
   라벨은 두 곳이 같아야 하므로 여기서만 정의하고, 진입 맥락마다 달라지는 안내 문구는
   description으로 받는다. */
const copyByStatus: Record<IdentityStatus, IdentityCopy> = {
  ready: {
    title: "휴대폰 본인인증",
    status: "포트원 본인인증 화면이 열립니다.",
    action: "본인인증 시작",
  },
  requesting: {
    title: "본인인증을 진행하고 있어요",
    status: "포트원 본인인증 응답을 기다리고 있습니다.",
    action: "본인인증 진행 중",
  },
  cancelled: {
    title: "본인인증이 취소되었어요",
    status: "사용자가 본인인증을 취소했습니다.",
    action: "다시 시도",
  },
  failed: {
    title: "본인인증을 완료하지 못했어요",
    status: "포트원 본인인증 요청에 실패했습니다.",
    action: "다시 시도",
  },
  verifying: {
    title: "본인인증 결과를 확인하고 있어요",
    status: "서버에서 포트원 인증 결과를 검증하고 있습니다.",
    action: "결과 확인 중",
  },
  "verification-failed": {
    title: "본인인증 결과를 확인할 수 없어요",
    status: "서버 검증을 완료하지 못했습니다.",
    action: "다시 시도",
  },
};

const pendingStatuses: IdentityStatus[] = ["requesting", "verifying"];
const retryStatuses: IdentityStatus[] = ["cancelled", "failed", "verification-failed"];

export function isPendingIdentityStatus(status: IdentityStatus) {
  return pendingStatuses.includes(status);
}

export function isRetryIdentityStatus(status: IdentityStatus) {
  return retryStatuses.includes(status);
}

type AuthIdentityVerificationProps = {
  actionDisabled?: boolean;
  description: string;
  onAction: () => void;
  status: IdentityStatus;
};

export function AuthIdentityVerification({
  actionDisabled = false,
  description,
  onAction,
  status,
}: AuthIdentityVerificationProps) {
  const copy = copyByStatus[status];
  const isPending = isPendingIdentityStatus(status);

  const isRetry = isRetryIdentityStatus(status);

  return (
    <>
      <div
        aria-busy={isPending}
        aria-live="polite"
        className="flex flex-col items-center pt-6 text-center"
      >
        {/* 인증 완료 화면과 같은 가운데 정렬이다. 진행 중은 회전 인디케이터, 재시도가 필요한
            상태는 경고 아이콘으로 결과를 먼저 보여주고 문장은 보조로 둔다. */}
        {isPending ? (
          <span className="border-w-xl border-border-default border-t-border-primary mb-10 size-11 animate-spin rounded-full" />
        ) : isRetry ? (
          /* 사용자가 직접 취소한 경우는 오류가 아니므로 경고색을 쓰지 않는다. */
          <Icon
            className={`mb-10 size-11 ${status === "cancelled" ? "text-text-secondary" : "text-text-warning"}`}
            name="warning"
          />
        ) : null}
        <AuthTitle>{copy.title}</AuthTitle>
        <p className="text-body-m text-text-secondary mt-3 whitespace-pre-line">{description}</p>
        <p className="text-caption-s text-text-secondary mt-8">{copy.status}</p>
      </div>
      <AuthBottomAction>
        <AuthButton disabled={actionDisabled || isPending} onClick={onAction}>
          {copy.action}
        </AuthButton>
      </AuthBottomAction>
    </>
  );
}
