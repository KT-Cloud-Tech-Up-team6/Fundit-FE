import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function InquiriesPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · Support"
      title="1:1 문의"
      description="문의 작성과 첨부, 답변 진행 상태를 확인합니다."
      screenIds="FL_B_MY_QNA"
      access="member"
      sections={["문의 작성", "첨부 파일", "문의 이력"]}
    />
  );
}
