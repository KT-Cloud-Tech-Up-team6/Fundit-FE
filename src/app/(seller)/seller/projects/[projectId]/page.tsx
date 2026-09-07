import { ProjectEditSidebar } from "@/entities/project/ui/project-edit-sidebar";
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

/* ponytail: Figma "판매자 스토리작성"(FL_S_PR_DTL) 사이드바는 이 네 탭에서만 등장한다.
   funding/community/fulfillment/settlement/live은 다른 화면군(screenIds 참고)이라
   기존 PagePlaceholder를 그대로 둔다. */
const editTabs = new Set(["story", "rewards", "refund-policy", "news"]);

export default async function SellerProjectPage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requestedTab = typeof query.tab === "string" ? query.tab : "story";
  const activeTab = allowedTabs.has(requestedTab) ? requestedTab : "story";

  if (editTabs.has(activeTab)) {
    return (
      <div className="mt-10 flex gap-10">
        <ProjectEditSidebar
          activeTab={activeTab}
          projectId={projectId}
          projectName="프로젝트 이름이 들어갈 자리"
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

  return (
    <PagePlaceholder
      eyebrow="Seller · Project"
      title={`프로젝트 관리 · ${projectId}`}
      description="펀딩·커뮤니티·제작배송·정산·LIVE까지 탭으로 관리합니다."
      screenIds="FL_S_FD_STATUS, FL_S_FD_COMM, FL_S_DL_MNG, FL_S_PR_CAL, FL_S_LV_HOME"
      access="owner"
      sections={["프로젝트 요약", `${activeTab} 탭`, "저장·공개 상태"]}
    />
  );
}
