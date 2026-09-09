import { redirect } from "next/navigation";

/* IA(FL_B_PY_RWRD)에서 리워드 선택은 독립 화면이 아니라 프로젝트 상세의 바텀시트다.
   docs/ROUTING.md L3 원칙("시트는 독립 URL을 만들지 않는다")에 맞춰 상세로 돌려보낸다.
   기존 /funding/[projectId]/payment → checkout redirect와 같은 패턴. */
export default async function RewardsPage({ params }: PageProps<"/funding/[projectId]/rewards">) {
  const { projectId } = await params;

  redirect(`/projects/${projectId}`);
}
