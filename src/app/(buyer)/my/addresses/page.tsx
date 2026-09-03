import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default function AddressesPage() {
  return (
    <PagePlaceholder
      eyebrow="Buyer · My"
      title="배송지 관리"
      description="배송지를 등록·수정하고 기본 배송지를 지정합니다."
      screenIds="FL_B_MY_ADDR"
      access="member"
      sections={["배송지 목록", "배송지 편집", "기본 배송지"]}
    />
  );
}
