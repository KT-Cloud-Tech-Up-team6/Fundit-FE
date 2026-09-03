import { redirect } from "next/navigation";

const tabBySection: Record<string, string> = {
  story: "story",
  rewards: "rewards",
  policy: "refund-policy",
  news: "news",
  "ai-story": "story",
};

export default async function ProjectEditPage({
  params,
  searchParams,
}: PageProps<"/seller/projects/[projectId]/edit">) {
  const { projectId } = await params;
  const query = await searchParams;
  const requested = typeof query.section === "string" ? query.section : "story";
  const tab = tabBySection[requested] ?? "story";

  redirect(`/seller/projects/${projectId}?tab=${tab}`);
}
