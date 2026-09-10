import { FundingCta } from "@/features/reward-selection/ui/funding-cta";
import { ProjectTabs } from "@/features/project-tabs/ui/project-tabs";
import { PagePlaceholder } from "@/shared/components/page-placeholder";
import { BuyerShell } from "@/shared/components/layout/buyer-shell";
import { BuyerProjectDetail } from "@/features/buyer-project/ui/buyer-project-detail";
import styles from "@/features/buyer-project/ui/buyer-project-detail.module.css";

const allowedTabs = new Set([
  "story",
  "live-proof",
  "news",
  "community",
  "supporters",
  "refund-policy",
  "reward-info",
  "maker",
]);

export default async function ProjectDetailPage({
  params,
  searchParams,
}: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requestedTab = typeof query.tab === "string" ? query.tab : "story";
  const activeTab = allowedTabs.has(requestedTab) ? requestedTab : "story";

  if (activeTab === "story" || activeTab === "live-proof") {
    return (
      <BuyerProjectDetail
        key={projectId}
        projectId={projectId}
        activeTab={activeTab}
        fundingAction={<FundingCta projectId={projectId} className={styles.funding} />}
      />
    );
  }

  return (
    <BuyerShell>
      <PagePlaceholder
        eyebrow="Buyer · Project"
        title={`프로젝트 ${projectId}`}
        description="프로젝트 공통 정보와 펀딩 CTA를 유지하면서 쿼리 기반 탭 콘텐츠를 전환합니다."
        screenIds="B-09~B-16"
        access="public"
        sections={["프로젝트 히어로", "펀딩 요약", `${activeTab} 탭 콘텐츠`]}
      >
        <div className="flex flex-col gap-6">
          <FundingCta projectId={projectId} />
          <ProjectTabs projectId={projectId} activeTab={activeTab} />
        </div>
      </PagePlaceholder>
    </BuyerShell>
  );
}
