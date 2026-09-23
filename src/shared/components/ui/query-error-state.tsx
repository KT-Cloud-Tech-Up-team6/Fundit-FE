"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ErrorState, toErrorStatus, type ErrorStateProps } from "./error-state";
import { loginRedirectHref } from "@/shared/lib/login-redirect-href";

type QueryErrorStateProps = {
  error: unknown;
  onRetry: () => void;
  description?: ErrorStateProps["description"];
  retryLabel?: string;
  notFoundHref?: string;
  variant?: "page" | "section";
  className?: string;
};

/** 조회 실패를 상태별 기본 안내와 적절한 후속 동작으로 표시한다. */
export function QueryErrorState({
  error,
  onRetry,
  description,
  retryLabel,
  notFoundHref = "/",
  variant = "page",
  className,
}: QueryErrorStateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = toErrorStatus(error);
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams}` : ""}`;
  const isPermissionError = status === "unauthorized" || status === "forbidden";

  const action =
    status === "notFound"
      ? { href: notFoundHref }
      : status === "unauthorized"
        ? { href: loginRedirectHref(returnTo) }
        : status === "forbidden"
          ? { onClick: () => router.back() }
          : { label: retryLabel, onClick: onRetry };

  return (
    <ErrorState
      variant={variant}
      status={status}
      description={isPermissionError ? undefined : description}
      action={action}
      className={className}
    />
  );
}
