import {
  ProjectSidebar,
  projectEditTabs,
  projectManageTabs,
} from "@/entities/project/ui/project-sidebar";
import { FulfillmentBoard } from "@/features/fulfillment-tracking/ui/fulfillment-board";
import { FundingStatusBoard } from "@/features/funding-status/ui/funding-status-board";
import { ProjectStoryForm } from "@/features/project-story/ui/project-story-form";
import { PagePlaceholder } from "@/shared/components/page-placeholder";

const allowedTabs = new Set([
  "story",
  "rewards",
  "refund-policy",
  "news",
  "funding",
  "community",
  "fulfillment",
  "settlement",
  "live",
]);

/* 사이드바는 두 묶음으로 갈린다 — 오픈 전 편집(FL_S_PR_DTL)과 오픈 후 운영(FL_S_DL_MNG).
   live는 어느 사이드바에도 없는 별도 화면군이라 placeholder만 둔다. */
const editTabs = new Set(projectEditTabs.map((tab) => tab.value));
const manageTabs = new Set(projectManageTabs.map((tab) => tab.value));

export default async function SellerProjectPage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requestedTab = typeof query.tab === "string" ? query.tab : "story";
  const activeTab = allowedTabs.has(requestedTab) ? requestedTab : "story";
  const projectName = `프로젝트 이름이 들어갈 자리 (${projectId})`;

  if (editTabs.has(activeTab)) {
    return (
      <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:gap-10">
        <ProjectSidebar
          activeTab={activeTab}
          projectId={projectId}
          projectName={projectName}
          tabs={projectEditTabs}
        />
        {activeTab === "story" ? (
          <ProjectStoryForm />
        ) : (
          <PagePlaceholder
            eyebrow="Seller · Project"
            title={`프로젝트 관리 · ${projectId}`}
            description="리워드·환불 정책·새 소식 탭은 아직 디자인이 없어 자리만 잡아둡니다."
            screenIds="FL_S_PR_RWRD, FL_S_PR_RFND, FL_S_PR_NEWS"
            access="owner"
            sections={[`${activeTab} 탭`]}
          />
        )}
      </div>
    );
  }

  if (manageTabs.has(activeTab)) {
    return (
      /* Figma FL_S_DL_MNG 실측: 사이드바 180 + 간격 24 = 콘텐츠 996. 표가 잘리지 않으려면
         편집 탭(gap-10)이 아니라 이 값을 써야 한다. */
      <div className="mt-10 flex flex-col gap-6 lg:flex-row lg:gap-6">
        <ProjectSidebar
          activeTab={activeTab}
          projectId={projectId}
          projectName={projectName}
          tabs={projectManageTabs}
        />
        {activeTab === "fulfillment" ? (
          <FulfillmentBoard projectId={projectId} />
        ) : activeTab === "funding" ? (
          <FundingStatusBoard />
        ) : (
          <PagePlaceholder
            eyebrow="Seller · Project"
            title={`프로젝트 관리 · ${projectId}`}
            description="커뮤니티·정산 탭은 아직 화면이 없어 자리만 잡아둡니다."
            screenIds="FL_S_FD_COMM, FL_S_PR_CAL"
            access="owner"
            sections={[`${activeTab} 탭`]}
          />
        )}
      </div>
    );
  }

  return (
    <PagePlaceholder
      eyebrow="Seller · Project"
      title={`프로젝트 관리 · ${projectId}`}
      description="LIVE 탭은 별도 화면군이라 자리만 잡아둡니다."
      screenIds="FL_S_LV_HOME"
      access="owner"
      sections={["프로젝트 요약", `${activeTab} 탭`, "저장·공개 상태"]}
    />
  );
}
