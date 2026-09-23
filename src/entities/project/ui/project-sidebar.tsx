import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { Icon } from "@/shared/components/ui/icon";

export type ProjectSidebarTab = { value: string; label: string; disabled?: boolean };

export const projectEditTabs: readonly ProjectSidebarTab[] = [
  { value: "basic-info", label: "기본 정보 수정" },
  { value: "story", label: "스토리 작성" },
  { value: "rewards", label: "리워드" },
  { value: "refund-policy", label: "환불 정책", disabled: true },
  { value: "news", label: "새 소식", disabled: true },
];

/* 펀딩 오픈 이후 운영 탭. Figma FL_S_DL_MNG 좌측 사이드바.
   정산 관리(FL_S_PR_CAL)는 기획팀 회신으로 MVP에서 빠졌다 — 화면이 없어 자리 표시만
   남아 있었다. BE 계약(GET /api/v1/settlements 등)은 그대로 살아 있으니 화면이 생기면 되살린다. */
export const projectManageTabs: readonly ProjectSidebarTab[] = [
  { value: "funding", label: "펀딩 관리" },
  { value: "community", label: "커뮤니티 관리", disabled: true },
  { value: "fulfillment", label: "제작 · 배송" },
];

type ProjectSidebarProps = {
  activeTab: string;
  /** 하위 화면(발송정보 등)은 목록이 아니라 상위 탭으로 돌아간다. */
  backHref?: string;
  backLabel?: string;
  projectId: string;
  projectName: string;
  tabs: readonly ProjectSidebarTab[];
};

/** Figma 프로젝트 관리 화면의 공통 좌표: content y=82, sidebar y=118, x gap=24. */
export function ProjectWorkspaceLayout({
  children,
  ...sidebarProps
}: ProjectSidebarProps & { children: ReactNode }) {
  return (
    <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-start">
      <ProjectSidebar {...sidebarProps} />
      {children}
    </div>
  );
}

/** 프로젝트 관리 화면의 공통 제목과 이동 경로를 표시한다. */
export function ProjectPageHeader({
  action,
  breadcrumb,
  title,
}: {
  action?: ReactNode;
  breadcrumb: readonly string[];
  title: string;
}) {
  return (
    <header className="flex min-h-20 w-full flex-col gap-1">
      <Breadcrumb items={breadcrumb} />
      <div className="flex min-h-13 items-center justify-between gap-3">
        <h1 className="text-heading-l min-w-0 py-2">{title}</h1>
        {action}
      </div>
    </header>
  );
}

/**
 * 판매자 프로젝트 화면의 좌측 이동 메뉴.
 * 편집(스토리·리워드…)과 운영(펀딩·제작배송…)은 항목만 다르고 껍데기가 같아 `tabs`로 갈아 끼운다.
 */
function ProjectSidebar({
  activeTab,
  backHref = "/seller/projects",
  backLabel = "내 프로젝트로",
  projectId,
  projectName,
  tabs,
}: ProjectSidebarProps) {
  return (
    <nav
      aria-label="프로젝트 메뉴"
      className="border-w-xs border-border-default bg-layer-surface-default flex h-fit w-full shrink-0 flex-col gap-2 self-start rounded-xs p-2 py-3 lg:mt-9 lg:w-45"
    >
      <div className="border-border-default flex flex-col gap-2 border-b p-2">
        <Link
          href={backHref}
          className="text-body-m text-text-default flex h-7 shrink-0 items-center gap-1 hover:underline"
        >
          <Icon name="arrowLeft" className="size-3" />
          {backLabel}
        </Link>
        <p className="text-body-strong line-clamp-2 h-12">{projectName}</p>
      </div>

      <ul className="flex flex-wrap gap-2 lg:flex-col">
        {tabs.map((tab) =>
          tab.disabled ? (
            <li key={tab.value}>
              <span
                role="link"
                aria-disabled="true"
                className="text-body-emphasis text-text-disabled flex h-9 items-center rounded-xs px-2"
              >
                {tab.label}
              </span>
            </li>
          ) : (
            <li key={tab.value}>
              <Link
                href={`/seller/projects/${projectId}?tab=${tab.value}`}
                aria-current={activeTab === tab.value ? "page" : undefined}
                className={`text-body-emphasis text-text-default flex h-9 items-center rounded-xs px-2 ${
                  activeTab === tab.value ? "bg-layer-bg" : "hover:bg-layer-surface-disabled"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
