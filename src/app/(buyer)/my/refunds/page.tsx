import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function RefundsPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · Refund"
      title="환불 내역"
      description="참여 취소·자동 환불·하자·지연 환불의 처리 상태를 조회합니다."
      screenIds="B-24"
      access="member"
      sections={["환불 목록", "상태 단계", "처리 상세"]}
    />
  );
}
