import { redirect } from "next/navigation";

export default async function SellerFulfillmentPage({
  params,
}: PageProps<"/seller/projects/[projectId]/fulfillment">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=fulfillment`);
}
