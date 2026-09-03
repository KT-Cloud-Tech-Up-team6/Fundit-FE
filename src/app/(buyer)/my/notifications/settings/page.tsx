import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function NotificationSettingsPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="알림 설정"
      description="알림 유형과 채널별 수신 여부를 관리합니다."
      screenIds="FL_B_MY_NOTISET"
      access="member"
      sections={["알림 유형", "수신 채널", "저장 상태"]}
    />
  );
}
