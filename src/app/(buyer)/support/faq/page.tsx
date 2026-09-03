import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function FaqPage() {
  return (
    <PagePlaceholder
      eyebrow="Support"
      title="자주 묻는 질문"
      description="카테고리와 검색어를 기준으로 자주 묻는 질문을 찾습니다."
      screenIds="FL_B_MY_FAQ"
      access="public"
      sections={["FAQ 카테고리", "질문 목록", "검색 결과"]}
    />
  );
}
