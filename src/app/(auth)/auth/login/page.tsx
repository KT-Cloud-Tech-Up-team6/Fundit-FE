import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function LoginPage() {
  return (
    <PagePlaceholder
      eyebrow="인증"
      title="로그인"
      description="일반 로그인과 소셜 로그인을 제공하고 실패 상태를 보존합니다."
      screenIds="C-04"
      access="guest"
      sections={["로그인 폼", "소셜 로그인", "계정 복구 링크"]}
    />
  );
}
