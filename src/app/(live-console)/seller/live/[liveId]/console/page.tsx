import { LiveConsole } from "@/features/live-console/ui/live-console";
import { RealSellerConsole } from "@/features/live-integration/ui/real-seller-console";
import { isPublicUuid } from "@/shared/lib/public-uuid";
import { notFound } from "next/navigation";

export default async function LiveConsolePage({
  params,
  searchParams,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  /* 데모 판정은 시청 화면과 다르다 — 여기는 접두 매칭, 시청 화면은 getLiveDemoConnection 조회다. */
  if (!liveId.startsWith("demo") && !isPublicUuid(liveId)) notFound();
  if (!liveId.startsWith("demo")) {
    /* LIVE 스튜디오의 종료 방송이 `?check=open`으로 LIVE 체크 작성을 바로 연다(#399). */
    const { check } = await searchParams;
    return <RealSellerConsole key={liveId} liveId={liveId} openCheck={check === "open"} />;
  }
  return <LiveConsole key={liveId} liveId={liveId} />;
}
