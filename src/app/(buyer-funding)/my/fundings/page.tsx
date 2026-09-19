import { Suspense } from "react";
import { FundingListApi } from "@/features/funding-history/ui/funding-api";
export default function Page() {
  return (
    <Suspense fallback={<p>참여 내역을 불러오고 있습니다.</p>}>
      <FundingListApi />
    </Suspense>
  );
}
