import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function LiveRankPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="실시간 LIVE 순위"
      description="실시간 시청 지표를 기준으로 LIVE 순위를 제공합니다."
      screenIds="FL_B_LV_RANK"
      access="public"
      sections={["실시간 순위", "시청자 수", "LIVE 카드"]}
    />
  );
}
