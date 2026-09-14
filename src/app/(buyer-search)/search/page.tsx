import { Suspense } from "react";
import { BuyerSearchRoute } from "@/features/buyer-search/ui/buyer-search";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <p className="p-5" role="status">
          검색 화면을 불러오는 중입니다.
        </p>
      }
    >
      <BuyerSearchRoute />
    </Suspense>
  );
}
