import { LiveConsole } from "@/features/live-console/ui/live-console";
import { RealSellerLive } from "@/features/live-integration/ui/real-live";
import { notFound } from "next/navigation";

export default async function LiveConsolePage({
  params,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  /* BE는 UuidCreator.getTimeOrderedEpoch()로 UUIDv7을 발급한다. 버전 자리를 [1-5]로
     제한하면 실제 LIVE ID가 전부 404가 되므로 형식만 본다. 정규식은 시청 화면과 같다
     — 데모 판정은 다르다(여기는 접두 매칭, 시청 화면은 getLiveDemoConnection 조회). */
  if (!liveId.startsWith("demo") && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(liveId))
    notFound();
  if (!liveId.startsWith("demo")) return <RealSellerLive key={liveId} liveId={liveId} />;
  return <LiveConsole key={liveId} liveId={liveId} />;
}
