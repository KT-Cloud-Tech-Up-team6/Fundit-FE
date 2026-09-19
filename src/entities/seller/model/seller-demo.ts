import type { SellerSummary } from "../ui/seller-row";

export const sellerDemo: SellerSummary[] = [
  ["김무선 스토어", "5cb85"],
  ["오브링 스튜디오", "4365d"],
  ["모던테크랩", "046c3"],
  ["홈메이트랩", "d2cd5"],
  ["밸런스핏", "35fd1"],
  ["맨즈포뮬라", "cbbbd"],
  ["테크메이트 스튜디오", "3fe1d"],
].map(([name, image], index) => ({
  id: `search-seller-${index + 1}`,
  name,
  followers: 151,
  likes: 2000,
  live: [0, 2, 3].includes(index),
  avatar: `/images/buyer-search/${image}.png`,
}));
