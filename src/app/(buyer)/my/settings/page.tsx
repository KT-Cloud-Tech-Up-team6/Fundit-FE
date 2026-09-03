import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function SettingsPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="설정"
      description="회원정보와 배송지, 알림 등 계정 설정으로 이동합니다."
      screenIds="FL_B_MY_SET"
      access="member"
      sections={["회원정보", "배송지", "알림 설정"]}
    />
  );
}
