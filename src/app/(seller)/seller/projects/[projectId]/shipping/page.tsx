import { redirect } from "next/navigation";

export default async function ShippingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/shipping">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=fulfillment`);
}
