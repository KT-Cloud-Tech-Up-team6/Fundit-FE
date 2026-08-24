import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SearchPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · Explore"
      title="통합 검색"
      description="프로젝트·LIVE·판매자를 키워드로 검색하는 화면입니다."
      screenIds="B-03"
      access="public"
      sections={["검색어 입력", "최근·인기 검색어", "검색 결과"]}
    />
  );
}
