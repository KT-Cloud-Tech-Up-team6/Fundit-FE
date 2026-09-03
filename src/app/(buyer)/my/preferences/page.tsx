import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function PreferencesPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="맞춤 정보"
      description="관심 카테고리와 개인화 활용 동의를 관리합니다."
      screenIds="FL_B_MY_PRF"
      access="member"
      sections={["관심 카테고리", "개인화 동의", "저장 상태"]}
    />
  );
}
