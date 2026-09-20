import { Suspense } from "react";
import { BuyerProjectSearchApi } from "@/features/buyer-search/ui/buyer-project-search-api";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <p className="p-5" role="status">
          검색 화면을 불러오는 중입니다.
        </p>
      }
    >
      <BuyerProjectSearchApi />
    </Suspense>
  );
}
