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

  return (
    <>
      <div aria-busy={isPending} aria-live="polite">
        <AuthTitle>{copy.title}</AuthTitle>
        <p className="text-body-m mt-3 whitespace-pre-line">{description}</p>
        <div className="bg-layer-surface-disabled text-body-m mt-12 flex min-h-[118px] items-center justify-center rounded-sm px-6 text-center">
          {copy.status}
        </div>
      </div>
      <AuthBottomAction>
        <AuthButton disabled={actionDisabled || isPending} onClick={onAction}>
          {copy.action}
        </AuthButton>
      </AuthBottomAction>
    </>
  );
}
