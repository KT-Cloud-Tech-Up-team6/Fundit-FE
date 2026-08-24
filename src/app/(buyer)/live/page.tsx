import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function LiveListPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="LIVE"
      description="진행 중·예정·다시보기 상태별 라이브 방송을 탐색합니다."
      screenIds="B-05"
      access="public"
      sections={["상태 탭", "LIVE 카드", "시작 알림"]}
    />
  );
}
