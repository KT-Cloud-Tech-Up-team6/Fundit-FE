import { redirect } from "next/navigation";

export default async function SellerFundingPage({
  params,
}: PageProps<"/seller/projects/[projectId]/funding">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=funding`);
}
