import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function NoticesPage() {
  return (
    <PagePlaceholder
      eyebrow="Support"
      title="공지사항"
      description="서비스 공지 목록과 상세 내용을 제공합니다."
      screenIds="FL_B_MY_NTC"
      access="public"
      sections={["공지 목록", "공지 상세", "오류 상태"]}
    />
  );
}
