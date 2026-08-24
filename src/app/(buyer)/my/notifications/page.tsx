import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function NotificationsPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="알림함·설정"
      description="LIVE 시작, 답변, 제작·배송, 환불 상태 변경 알림을 관리합니다."
      screenIds="B-26"
      access="member"
      sections={["알림 목록", "유형 필터", "수신 설정"]}
    />
  );
}
