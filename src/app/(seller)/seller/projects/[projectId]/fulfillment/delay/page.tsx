import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function FulfillmentDelayPage({
  params,
}: PageProps<"/seller/projects/[projectId]/fulfillment/delay">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · Fulfillment"
      title={`일정 변경·지연 등록 · ${projectId}`}
      description="변경 사유와 새 일정을 입력하고 구매자 알림 내용을 미리 확인합니다."
      screenIds="S-15"
      access="owner seller"
      sections={["지연 사유", "변경 일정", "알림 미리보기"]}
    />
  );
}
