"use client";

import { useRouter } from "next/navigation";
import { ApiError } from "@/shared/api/api-error";
import { ErrorState, toErrorStatus } from "@/shared/components/ui/error-state";

/* 라이브 연동 화면(구매자 시청·판매자 콘솔)이 함께 쓰는 오류 표시다. */

export function QueryError({
  error,
  retry,
  disabled = false,
}: {
  error: unknown;
  retry: () => void;
  disabled?: boolean;
}) {
  const router = useRouter();
  const httpStatus = error instanceof ApiError ? error.status : undefined;
  const status = toErrorStatus(error);
  if (httpStatus === 409)
    return (
      <ErrorState
        variant="section"
        status="server"
        description="VOD를 준비 중입니다. 잠시 후 다시 시도해 주세요."
        action={disabled ? undefined : { label: "다시 시도", onClick: retry }}
      />
    );
  if (status === "unauthorized") {
    const returnTo =
      typeof window === "undefined" ? "/live" : window.location.pathname + window.location.search;
    return (
      <ErrorState
        variant="section"
        status={status}
        action={{ href: `/auth/login?returnTo=${encodeURIComponent(returnTo)}` }}
      />
    );
  }
  if (status === "forbidden")
    return (
      <ErrorState variant="section" status={status} action={{ onClick: () => router.back() }} />
    );
  return (
    <ErrorState
      variant="section"
      status={status}
      description="정보를 불러오지 못했습니다."
      action={disabled ? undefined : { label: "다시 시도", onClick: retry }}
    />
  );
}

/** 변경 요청 실패는 조회 실패 마이그레이션 대상이 아니다. 입력을 유지한 채 같은 요청만 재시도한다. */
export function MutationError({
  error,
  retry,
  disabled,
}: {
  error: unknown;
  retry: () => void;
  disabled: boolean;
}) {
  const status = error instanceof ApiError ? error.status : undefined;
  return (
    <div role="alert" className="border-border-default rounded border p-4">
      {`정보를 처리하지 못했습니다${status ? ` (${status})` : ""}.`}{" "}
      <button
        type="button"
        className="ml-2 underline disabled:opacity-50"
        onClick={retry}
        disabled={disabled}
      >
        다시 시도
      </button>
    </div>
  );
}
