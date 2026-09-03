import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function UpcomingLivePage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="예정 LIVE"
      description="방송 예정 시각과 일정 변경·취소 상태를 확인합니다."
      screenIds="FL_B_LV_UPCOMING"
      access="public"
      sections={["예정 LIVE 목록", "D-day", "시작 알림"]}
    />
  );
}
