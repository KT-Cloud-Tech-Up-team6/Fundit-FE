import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function SellerRefundsPage({
  params,
}: PageProps<"/seller/projects/[projectId]/settlement/refunds">) {
  const { projectId } = await params;

  return (
    <PagePlaceholder
      eyebrow="Seller · Settlement"
      title={`환불·교환 관리 · ${projectId}`}
      description="환불·교환 요청을 유형과 상태별로 확인하고 처리합니다."
      screenIds="FL_S_ST_RFND, FL_S_ST_RFND_P"
      access="owner"
      sections={["요청 목록", "유형·상태 필터", "승인·반려 처리"]}
    />
  );
}
