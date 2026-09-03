import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function MyPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="마이페이지"
      description="프로필과 펀딩·알림·설정 등 개인 메뉴의 진입점을 제공합니다."
      screenIds="FL_B_MY_HOME"
      access="member"
      sections={["프로필 요약", "활동 바로가기", "계정 메뉴"]}
    />
  );
}
