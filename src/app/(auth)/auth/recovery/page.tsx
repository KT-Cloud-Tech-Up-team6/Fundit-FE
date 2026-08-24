import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function RecoveryPage() {
  return (
    <PagePlaceholder
      eyebrow="인증"
      title="아이디·비밀번호 찾기"
      description="본인 인증 후 계정 식별 또는 비밀번호 재설정을 진행합니다."
      screenIds="C-05"
      access="guest"
      sections={["복구 유형 선택", "휴대폰 인증", "복구 결과"]}
    />
  );
}
