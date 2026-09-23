import Image from "next/image";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { isApiError } from "@/shared/api/api-error";
import { Button } from "./button";
import { Chip } from "./chip";

export type ErrorStatus = "notFound" | "server" | "forbidden" | "unauthorized" | "network";

type ErrorAction = { label?: string } & (
  { onClick: () => void; href?: never } | { href: string; onClick?: never }
);

type ErrorStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  /** page: 화면 전체 대체. section: 목록·카드 일부 실패. text: 아이콘·버튼 없는 경고 문구. */
  variant?: "page" | "section" | "text";
  /** page 전용 프리셋. title/description/caption/action.label로 개별 오버라이드 가능. */
  status?: ErrorStatus;
  title?: ReactNode;
  /** section·text에서는 안내 문구 둘째 줄로 쓰인다. */
  description?: ReactNode;
  caption?: ReactNode;
  action?: ErrorAction;
};

const presets: Record<
  ErrorStatus,
  { title: ReactNode; description: ReactNode; caption?: ReactNode; actionLabel: string }
> = {
  notFound: {
    title: "404",
    description: "요청하신 화면을 찾을 수 없습니다",
    actionLabel: "홈으로 이동",
  },
  server: {
    title: "500",
    description: "화면을 불러오지 못했습니다",
    caption: (
      <>
        일시적인 오류가 발생했습니다
        <br />
        잠시 후 다시 시도해주세요.
      </>
    ),
    actionLabel: "다시 시도",
  },
  forbidden: {
    title: "403",
    description: "접근할 수 없는 화면입니다",
    caption: "해당 화면을 확인할 수 있는 권한이 없습니다",
    actionLabel: "이전화면으로",
  },
  unauthorized: {
    title: "401",
    description: "로그인이 필요한 화면입니다",
    actionLabel: "로그인",
  },
  network: {
    title: "네트워크 오류",
    description: "인터넷 연결을 확인해주세요",
    actionLabel: "다시 시도",
  },
};

/** ApiError.status와 네트워크 단절(TypeError)을 ErrorStatus로 매핑한다. */
export function toErrorStatus(error: unknown): ErrorStatus {
  if (isApiError(error)) {
    if (error.status === 404) return "notFound";
    if (error.status === 401) return "unauthorized";
    if (error.status === 403) return "forbidden";
    return "server";
  }
  if (error instanceof TypeError) return "network";
  return "server";
}

const SORRY_PREFIX = "서비스 이용에 불편을 드려 죄송합니다";

function joinClassName(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function ErrorState({
  variant = "page",
  status,
  title,
  description,
  caption,
  action,
  className,
  ...props
}: ErrorStateProps) {
  const preset = status ? presets[status] : undefined;
  const resolvedDescription = description ?? preset?.description;
  const actionLabel = action?.label ?? preset?.actionLabel ?? "다시 시도";

  if (variant === "text") {
    return (
      <div
        role="alert"
        className={joinClassName("text-body-s text-text-warning text-center", className)}
        {...props}
      >
        <p>{SORRY_PREFIX}</p>
        {resolvedDescription && <p>{resolvedDescription}</p>}
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div
        role="alert"
        className={joinClassName("flex flex-col items-center gap-3", className)}
        {...props}
      >
        <Image
          src="/images/shared/island.svg"
          alt=""
          width={112}
          height={112}
          className="size-[65px]"
        />
        <p className="text-body-s text-center">
          {SORRY_PREFIX}
          <br />
          {resolvedDescription}
        </p>
        {action && (
          <Chip type="button" appearance="outline" onClick={action.onClick}>
            {actionLabel}
          </Chip>
        )}
      </div>
    );
  }

  const resolvedTitle = title ?? preset?.title;
  const resolvedCaption = caption ?? preset?.caption;

  return (
    <div
      role="alert"
      className={joinClassName("flex flex-col items-center gap-6 text-center", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 px-5">
        <h1 className="text-title-l">{resolvedTitle}</h1>
        {resolvedDescription && <p className="text-body-emphasis">{resolvedDescription}</p>}
      </div>
      <Image src="/images/shared/island.svg" alt="" width={112} height={112} className="size-28" />
      {resolvedCaption && <p className="text-body-s">{resolvedCaption}</p>}
      {action &&
        (action.href ? (
          <Button href={action.href} size="lg">
            {actionLabel}
          </Button>
        ) : (
          <Button onClick={action.onClick} size="lg">
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
