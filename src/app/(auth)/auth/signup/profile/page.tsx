import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SignupProfilePage() {
  return (
    <PagePlaceholder
      eyebrow="회원가입 3/3"
      title="회원정보 입력"
      description="계정 필수정보와 주소를 입력하고 중복 여부를 확인하는 단계입니다."
      screenIds="C-03"
      access="verified guest"
      sections={["계정 정보", "아이디 중복 확인", "주소 검색"]}
    />
  );
}
