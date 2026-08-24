import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SignupVerifyPage() {
  return (
    <PagePlaceholder
      eyebrow="회원가입 2/3"
      title="본인 인증"
      description="PASS 또는 SMS 대체 경로로 본인 여부를 확인하는 단계입니다."
      screenIds="C-02"
      access="guest + terms complete"
      sections={["인증 정보 입력", "PASS 호출", "인증 만료·재발송"]}
    />
  );
}
