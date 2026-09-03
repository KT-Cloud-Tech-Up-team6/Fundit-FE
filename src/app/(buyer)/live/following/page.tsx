import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function FollowingLivePage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · LIVE"
      title="팔로우 LIVE"
      description="팔로우한 브랜드의 LIVE와 방송 알림 상태를 확인합니다."
      screenIds="FL_B_LV_FOLLOW"
      access="member"
      sections={["팔로우 브랜드", "LIVE 목록", "방송 알림"]}
    />
  );
}
