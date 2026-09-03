import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function ProfilePage() {
  return (
    <PagePlaceholder
      eyebrow="Common · My"
      title="회원정보 관리"
      description="프로필과 비밀번호를 변경하고 회원 탈퇴를 관리합니다."
      screenIds="FL_C_MY_PROFILE"
      access="member"
      sections={["프로필 수정", "비밀번호 변경", "회원 탈퇴"]}
    />
  );
}
