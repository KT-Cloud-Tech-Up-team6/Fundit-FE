import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SellerProjectsPage() {
  return (
    <PagePlaceholder
      eyebrow="Seller · Projects"
      title="프로젝트 관리"
      description="판매자가 운영하는 프로젝트를 준비·진행·종료 상태로 확인합니다."
      screenIds="S-01"
      access="seller"
      sections={["상태 필터", "프로젝트 카드", "새 프로젝트 CTA"]}
    />
  );
}
