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

export default async function SellerProjectPage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requestedTab = typeof query.tab === "string" ? query.tab : "story";
  const activeTab = allowedTabs.has(requestedTab) ? requestedTab : "story";

  return (
    <PagePlaceholder
      eyebrow="Seller · Project"
      title={`프로젝트 관리 · ${projectId}`}
      description="프로젝트 작성부터 펀딩·커뮤니티·제작배송·정산·LIVE까지 탭으로 관리합니다."
      screenIds="FL_S_PR_DTL, FL_S_PR_RWRD, FL_S_PR_RFND, FL_S_PR_NEWS, FL_S_FD_STATUS, FL_S_FD_COMM, FL_S_DL_MNG, FL_S_PR_CAL, FL_S_LV_HOME"
      access="owner"
      sections={["프로젝트 요약", `${activeTab} 탭`, "저장·공개 상태"]}
    />
  );
}
