import Image from "next/image";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { isApiError } from "@/shared/api/api-error";
import { Button } from "./button";
import { Chip } from "./chip";

export type ErrorStatus = "notFound" | "server" | "forbidden" | "unauthorized" | "network";

/** href를 주면 페이지 이동, onClick만 주면 그 자리에서 재시도. 어느 variant든 동일하게
    지원한다 — section에서 href를 무시하고 반응 없는 버튼을 만들지 않는다. */
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
    description: (
      <>
        요청하신 페이지가 삭제되었거나
        <br />
        주소가 잘못되었을 수 있습니다
      </>
    ),
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

/* section의 outline 칩과 동일한 모양을 Link에도 쓴다 — Chip은 button만 렌더해서
   href로 페이지 이동은 못 시킨다. */
const chipLikeClassName = [
  "border-border-primary text-text-default text-label-m inline-flex items-center justify-center",
  "rounded-full border px-2 py-1 font-semibold whitespace-nowrap",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
].join(" ");

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
        className={joinClassName("text-body-s text-text-warning text-center", className)}
        {...props}
        role="alert"
      >
        <p>{SORRY_PREFIX}</p>
        {resolvedDescription && <p>{resolvedDescription}</p>}
      </div>
    );
  }

  if (variant === "section") {
    return (
      <div
        className={joinClassName("flex flex-col items-center gap-3", className)}
        {...props}
        role="alert"
      >
        <div className="flex flex-col items-center gap-4">
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
        </div>
        {action &&
          (action.href ? (
            <Link href={action.href} className={chipLikeClassName}>
              {actionLabel}
            </Link>
          ) : (
            <Chip
              type="button"
              appearance="outline"
              onClick={action.onClick}
              className="text-label-m py-1"
            >
              {actionLabel}
            </Chip>
          ))}
      </div>
    );
  }

  const resolvedTitle = title ?? preset?.title;
  const resolvedCaption = caption ?? preset?.caption;
  /* 모바일: 컨테이너 높이를 꽉 채우고 버튼을 하단에 고정(justify-between).
     1200px 이상: 콘텐츠·버튼을 한 덩어리로 42px 간격을 두고 가운데 정렬.
     ponytail: 높이는 상위 flex 체인(app/layout.tsx의 body flex flex-col, SellerShell의
     main flex flex-col)에 기대는 flex-1이다. min-h-dvh로 직접 채우지 않는 이유는
     SellerShell처럼 헤더가 있는 컨테이너에서 100dvh를 채우면 헤더 높이만큼 넘쳐서 버튼이
     화면 밖으로 밀려나기 때문이다. 상위 체인에 flex가 아닌 래퍼(div)가 새로 끼면 이 값은
     조용히 무시되고 자연스러운 높이로 접힌다 — 그럴 땐 그 래퍼도 flex flex-col로 맞춘다. */
  const buttonClassName = "w-full px-2 min-[1200px]:w-auto min-[1200px]:px-8";
  /* Figma: 404는 제목-아이콘 간격이 40px, 그 외 상태는 24px (두 breakpoint 공통). */
  const contentGap = status === "notFound" ? "gap-10" : "gap-6";

  return (
    <div
      className={joinClassName(
        "flex flex-1 flex-col items-center justify-between gap-10 px-5 py-10",
        "min-[1200px]:justify-center min-[1200px]:gap-[42px] min-[1200px]:px-0 min-[1200px]:py-0",
        className,
      )}
      {...props}
      role="alert"
    >
      <div className={joinClassName("flex flex-col items-center", contentGap)}>
        {/* Figma: 모바일은 좌측 정렬, 1200px 이상은 중앙 정렬 */}
        <div className="flex w-full flex-col items-start gap-2 text-left min-[1200px]:items-center min-[1200px]:text-center">
          <h1 className="text-title-l w-full">{resolvedTitle}</h1>
          {resolvedDescription && (
            <p className="text-body-emphasis w-full">{resolvedDescription}</p>
          )}
        </div>
        <Image
          src="/images/shared/island.svg"
          alt=""
          width={112}
          height={112}
          className="size-28"
        />
        {resolvedCaption && <p className="text-body-s text-center">{resolvedCaption}</p>}
      </div>
      {action &&
        (action.href ? (
          <Button href={action.href} size="lg" className={buttonClassName}>
            {actionLabel}
          </Button>
        ) : (
          <Button onClick={action.onClick} size="lg" className={buttonClassName}>
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
