import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function MyFundingsPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="펀딩 내역"
      description="참여 프로젝트와 펀딩·제작·배송 상태를 모아봅니다."
      screenIds="B-21"
      access="member"
      sections={["상태 필터", "펀딩 목록", "로드 상태"]}
    />
  );
}
