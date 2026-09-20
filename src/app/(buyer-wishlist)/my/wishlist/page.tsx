import { Suspense } from "react";
import { BuyerWishlistApi } from "@/features/buyer-wishlist/ui/buyer-wishlist-api";

export default function WishlistPage() {
  return (
    <Suspense fallback={<p role="status">관심 목록을 불러오는 중입니다.</p>}>
      <BuyerWishlistApi />
    </Suspense>
  );
}
