import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SignupTermsPage() {
  return (
    <PagePlaceholder
      eyebrow="회원가입 1/3"
      title="약관 안내"
      description="필수·선택 약관과 AI 개인화 동의를 구분해 확인하는 단계입니다."
      screenIds="C-01"
      access="guest"
      sections={["약관 체크리스트", "AI 동의 안내", "소셜 회원가입"]}
    />
  );
}
