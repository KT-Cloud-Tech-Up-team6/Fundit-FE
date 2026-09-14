import type { SellerSummary } from "@/entities/seller/ui/seller-row";

export const wishlistProjects = Array.from({ length: 6 }, (_, index) => ({
  id: `wishlist-project-${index + 1}`,
  seller: "판매자 이름",
  title: "로보락F25 정말 좋고 깔끔하고 착한 무선 청소기! 이것은 역작이라고 말할 수 있습니다",
  progress: 10000,
  closed: index === 3,
}));

export const wishlistSellers: SellerSummary[] = Array.from({ length: 7 }, (_, index) => ({
  id: `wishlist-seller-${index + 1}`,
  name: "판매자 이름",
  followers: 150,
  likes: 2000,
  live: index === 0,
}));
