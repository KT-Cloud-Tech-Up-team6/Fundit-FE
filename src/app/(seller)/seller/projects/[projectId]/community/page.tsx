import { redirect } from "next/navigation";

export default async function SellerCommunityPage({
  params,
}: PageProps<"/seller/projects/[projectId]/community">) {
  const { projectId } = await params;

  redirect(`/seller/projects/${projectId}?tab=community`);
}
