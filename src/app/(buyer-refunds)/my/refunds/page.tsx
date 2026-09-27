import { Suspense } from "react";
import { BuyerRefundsApi } from "@/features/buyer-refunds/ui/buyer-refunds-api";

export default function RefundsPage() {
  return (
    <Suspense fallback={<p role="status">취소/반품/교환 내역을 불러오고 있습니다.</p>}>
      <BuyerRefundsApi />
    </Suspense>
  );
}
