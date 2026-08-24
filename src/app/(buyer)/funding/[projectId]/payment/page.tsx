import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function PaymentPage({ params }: PageProps<"/funding/[projectId]/payment">) {
  const { projectId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Buyer · Funding 3/3"
      title={`결제 · ${projectId}`}
      description="결제 수단을 선택하고 PG 리다이렉트 경계를 처리할 화면입니다."
      screenIds="B-19"
      access="member + valid order"
      sections={["결제 수단", "결제 정보", "PG 복귀 경계"]}
    />
  );
}
