import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function SellerStatementsPage({
  params,
}: PageProps<"/seller/projects/[projectId]/settlement/statements">) {
  const { projectId } = await params;

  return (
    <PagePlaceholder
      eyebrow="Seller · Settlement"
      title={`정산 내역 · ${projectId}`}
      description="옵션별 판매와 정산 금액을 확인하고 정산서를 내려받습니다."
      screenIds="FL_S_ST_CALLST, FL_S_ST_CALCH"
      access="owner"
      sections={["옵션별 판매", "정산 내역", "이의 신청"]}
    />
  );
}
