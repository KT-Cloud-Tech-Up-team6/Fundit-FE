import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function NewProjectPage() {
  return (
    <PagePlaceholder
      eyebrow="Seller · Project"
      title="신규 프로젝트"
      description="사업자 유형·카테고리·목표 금액 등 기본정보를 등록합니다."
      screenIds="S-02"
      access="seller"
      sections={["사업자 유형", "카테고리", "목표 금액·동의"]}
    />
  );
}
