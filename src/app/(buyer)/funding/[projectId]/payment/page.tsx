import { redirect } from "next/navigation";

export default async function PaymentPage({ params }: PageProps<"/funding/[projectId]/payment">) {
  const { projectId } = await params;

  redirect(`/funding/${projectId}/checkout`);
}
