import { LiveConsole } from "@/features/live-console/ui/live-console";
import { RealSellerConsole } from "@/features/live-integration/ui/real-seller-console";
import { isPublicUuid } from "@/shared/lib/public-uuid";
import { notFound } from "next/navigation";

export default async function LiveConsolePage({
  params,
}: PageProps<"/seller/live/[liveId]/console">) {
  const { liveId } = await params;
  /* 데모 판정은 시청 화면과 다르다 — 여기는 접두 매칭, 시청 화면은 getLiveDemoConnection 조회다. */
  if (!liveId.startsWith("demo") && !isPublicUuid(liveId)) notFound();
  if (!liveId.startsWith("demo")) return <RealSellerConsole key={liveId} liveId={liveId} />;
  return <LiveConsole key={liveId} liveId={liveId} />;
}
