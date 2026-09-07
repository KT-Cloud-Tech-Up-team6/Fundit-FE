import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";

const tabs = [
  { value: "story", label: "스토리 작성" },
  { value: "rewards", label: "리워드" },
  { value: "refund-policy", label: "환불 정책" },
  { value: "news", label: "새 소식" },
] as const;

/* ponytail: 6팀_IA_v1.2.xlsx(판매자 IA #32)에는 "기본 정보 수정" 탭이 FL_S_PR_CREATE를 재사용하는
   실제 탭으로 정의돼 있지만, docs/ROUTING.md의 판매자 프로젝트 tab 허용값엔 대응 값이 없다.
   지어내지 않고 비활성 항목으로 둔다. tab 값이 정해지면(예: basic-info) ROUTING.md에 먼저 반영하고
   다른 탭처럼 href를 단다. */
export function ProjectEditSidebar({
  activeTab,
  projectId,
  projectName,
}: {
  activeTab: string;
  projectId: string;
  projectName: string;
}) {
  return (
    <nav
      aria-label="프로젝트 편집 메뉴"
      className="border-w-xs border-border-default bg-layer-surface-default flex w-full shrink-0 flex-col gap-2 self-stretch rounded-xs p-2 py-3 lg:w-45"
    >
      <div className="border-border-default flex flex-col gap-1 border-b px-2 pt-2 pb-3">
        <Link
          href="/seller/projects"
          className="text-body-m text-text-secondary hover:text-text-default flex items-center gap-1"
        >
          <Icon name="arrowLeft" className="size-3" />내 프로젝트로
        </Link>
        <p className="text-body-strong">{projectName}</p>
      </div>

      <ul className="flex flex-wrap gap-2 lg:flex-col">
        <li className="text-body-emphasis text-text-disabled flex h-7 items-center rounded-xs px-2">
          기본 정보 수정
        </li>
        {tabs.map((tab) => (
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
        ))}
      </ul>
    </nav>
  );
}
