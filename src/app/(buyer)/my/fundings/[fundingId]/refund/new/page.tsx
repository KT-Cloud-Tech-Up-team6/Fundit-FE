import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function RefundRequestPage({
  params,
  searchParams,
}: PageProps<"/my/fundings/[fundingId]/refund/new">) {
  const { fundingId } = await params;
  const query = await searchParams;
  const type = query.type === "delay" ? "delay" : "defect";
  return (
    <PagePlaceholder
      eyebrow="Buyer · Refund"
      title={`환불 신청 · ${fundingId}`}
      description="서버 eligibility 확인 후 하자 또는 배송 지연 사유와 증빙을 제출합니다."
      screenIds="B-25"
      access="owner + eligible"
      sections={[`${type} 가능 조건`, "사유 입력", "증빙 업로드"]}
    />
  );
}
