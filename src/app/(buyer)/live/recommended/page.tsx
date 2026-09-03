import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function RecommendedLivePage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="추천 LIVE"
      description="개인화 동의와 관심 정보를 반영한 LIVE를 추천합니다."
      screenIds="FL_B_LV_RECO"
      access="public"
      sections={["추천 LIVE 목록", "추천 사유", "일반 추천 폴백"]}
    />
  );
}
