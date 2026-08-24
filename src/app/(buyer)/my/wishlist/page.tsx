import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function WishlistPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="찜 목록"
      description="관심 프로젝트를 모아보고 오픈 예정 알림으로 연결합니다."
      screenIds="B-04"
      access="member"
      sections={["찜한 프로젝트", "로그인 요청", "빈 목록 안내"]}
    />
  );
}
