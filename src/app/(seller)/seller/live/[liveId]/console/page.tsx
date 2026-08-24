import { PagePlaceholder } from "@/shared/components/page-placeholder";

export default async function LiveConsolePage({
  params,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  return (
    <PagePlaceholder
      eyebrow="Seller · LIVE Console"
      title={`송출 콘솔 · ${liveId}`}
      description="스트림·채팅·AI Copilot을 독립된 연결 상태와 오류 경계로 운영합니다."
      screenIds="S-10"
      access="live owner"
      sections={["송출·연결 상태", "실시간 채팅", "AI 관심사·대표 질문·추천 답변"]}
    />
  );
}
