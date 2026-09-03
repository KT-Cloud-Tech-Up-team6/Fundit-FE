import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function LiveSearchPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="LIVE 검색"
      description="최근·인기 검색어와 자동완성을 이용해 LIVE를 검색합니다."
      screenIds="FL_B_LV_SRCH, FL_B_LV_SRRS"
      access="public"
      sections={["검색어", "자동완성", "검색 결과와 필터"]}
    />
  );
}
