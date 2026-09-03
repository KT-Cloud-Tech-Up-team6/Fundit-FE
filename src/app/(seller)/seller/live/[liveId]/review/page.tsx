import { PagePlaceholder } from "@/shared/components/page-placeholder";

const allowedTabs = new Set(["verification", "highlights"]);

export default async function LiveReviewPage({
  params,
  searchParams,
}: PageProps<"/seller/live/[liveId]/review">) {
  const { liveId } = await params;
  const query = await searchParams;
  const requestedTab = typeof query.tab === "string" ? query.tab : "verification";
  const activeTab = allowedTabs.has(requestedTab) ? requestedTab : "verification";

  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE"
      title={`방송 후 콘텐츠 · ${liveId}`}
      description="방송 종료 후 생성된 검증 콘텐츠와 하이라이트를 검수하고 공개합니다."
      screenIds="FL_S_LV_ALV, FL_S_LV_VERIFY, FL_S_LV_HL"
      access="live owner"
      sections={["생성 상태", `${activeTab} 탭`, "재생성·공개"]}
    />
  );
}
