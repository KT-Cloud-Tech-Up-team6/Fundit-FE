import { redirect } from "next/navigation";

export default async function FulfillmentDelayPage({
  params,
}: PageProps<"/seller/projects/[projectId]/fulfillment/delay">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=fulfillment`);
}
