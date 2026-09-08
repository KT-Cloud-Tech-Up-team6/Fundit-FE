import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";

/** `value`가 null이면 갈 곳이 정해지지 않은 항목이라 링크 없이 비활성으로 둔다. */
export type ProjectSidebarTab = { value: string | null; label: string };

/* ponytail: 6팀_IA_v1.2.xlsx(판매자 IA #32)에는 "기본 정보 수정" 탭이 FL_S_PR_CREATE를 재사용하는
   실제 탭으로 정의돼 있지만, docs/ROUTING.md의 판매자 프로젝트 tab 허용값엔 대응 값이 없다.
   지어내지 않고 비활성 항목으로 둔다. tab 값이 정해지면(예: basic-info) ROUTING.md에 먼저 반영하고
   다른 탭처럼 value를 채운다. */
export const projectEditTabs: readonly ProjectSidebarTab[] = [
  { value: null, label: "기본 정보 수정" },
  { value: "story", label: "스토리 작성" },
  { value: "rewards", label: "리워드" },
  { value: "refund-policy", label: "환불 정책" },
  { value: "news", label: "새 소식" },
];

/** 펀딩 오픈 이후 운영 탭. Figma FL_S_DL_MNG 좌측 사이드바. */
export const projectManageTabs: readonly ProjectSidebarTab[] = [
  { value: "funding", label: "펀딩 관리" },
  { value: "community", label: "커뮤니티 관리" },
  { value: "fulfillment", label: "제작 · 배송" },
  { value: "settlement", label: "정산관리" },
];

/**
 * 판매자 프로젝트 화면의 좌측 이동 메뉴.
 * 편집(스토리·리워드…)과 운영(펀딩·제작배송…)은 항목만 다르고 껍데기가 같아 `tabs`로 갈아 끼운다.
 */
export function ProjectSidebar({
  activeTab,
  backHref = "/seller/projects",
  backLabel = "내 프로젝트로",
  projectId,
  projectName,
  tabs,
}: {
  activeTab: string;
  /** 하위 화면(발송정보 등)은 목록이 아니라 상위 탭으로 돌아간다. */
  backHref?: string;
  backLabel?: string;
  projectId: string;
  projectName: string;
  tabs: readonly ProjectSidebarTab[];
}) {
  return (
    <nav
      aria-label="프로젝트 메뉴"
      className="border-w-xs border-border-default bg-layer-surface-default flex w-full shrink-0 flex-col gap-2 self-stretch rounded-xs p-2 py-3 lg:w-45"
    >
      <div className="border-border-default flex flex-col gap-1 border-b px-2 pt-2 pb-3">
        <Link
          href={backHref}
          className="text-body-m text-text-secondary hover:text-text-default flex items-center gap-1"
        >
          <Icon name="arrowLeft" className="size-3" />
          {backLabel}
        </Link>
        <p className="text-body-strong">{projectName}</p>
      </div>

      <ul className="flex flex-wrap gap-2 lg:flex-col">
        {tabs.map((tab) =>
          tab.value === null ? (
            <li
              key={tab.label}
              className="text-body-emphasis text-text-disabled flex h-7 items-center rounded-xs px-2"
            >
              {tab.label}
            </li>
          ) : (
            <li key={tab.value}>
              <Link
                href={`/seller/projects/${projectId}?tab=${tab.value}`}
                aria-current={activeTab === tab.value ? "page" : undefined}
                className={`text-body-emphasis flex h-7 items-center rounded-xs px-2 ${
                  activeTab === tab.value
                    ? "bg-layer-surface-disabled text-text-default"
                    : "text-text-secondary hover:bg-layer-surface-disabled"
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
