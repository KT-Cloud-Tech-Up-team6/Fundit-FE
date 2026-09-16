import { Suspense } from "react";
import { BuyerWishlistRoute } from "@/features/buyer-wishlist/ui/buyer-wishlist";

export default function WishlistPage() {
  return (
    <Suspense fallback={<p role="status">관심 목록을 불러오는 중입니다.</p>}>
      <BuyerWishlistRoute />
    </Suspense>
  );
}
