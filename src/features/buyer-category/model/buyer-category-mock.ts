// 실제 카테고리·slug 정책 확정 전 화면 확인에만 사용하는 목업 데이터다.
export type BuyerSubcategory = {
  slug: string;
  name: string;
};

export type BuyerCategory = {
  slug: string;
  name: string;
  subcategories: readonly BuyerSubcategory[];
};

const placeholderSubcategories: readonly BuyerSubcategory[] = [
  { slug: "sub-1", name: "소분류 명" },
  { slug: "sub-2", name: "소분류 명" },
  { slug: "sub-3", name: "소분류 명" },
  { slug: "sub-4", name: "소분류 명" },
];

export const buyerCategories: readonly BuyerCategory[] = [
  { slug: "tech-appliances", name: "테크·가전", subcategories: placeholderSubcategories },
  { slug: "home-living", name: "홈·리빙", subcategories: placeholderSubcategories },
  { slug: "beauty", name: "뷰티", subcategories: placeholderSubcategories },
  { slug: "fashion", name: "패션", subcategories: placeholderSubcategories },
  { slug: "food", name: "푸드", subcategories: placeholderSubcategories },
  { slug: "sports", name: "스포츠", subcategories: placeholderSubcategories },
  { slug: "travel", name: "여행", subcategories: placeholderSubcategories },
  { slug: "characters-goods", name: "캐릭터·굿즈", subcategories: placeholderSubcategories },
  { slug: "pets", name: "반려동물", subcategories: placeholderSubcategories },
  { slug: "books", name: "도서", subcategories: placeholderSubcategories },
  { slug: "games", name: "게임", subcategories: placeholderSubcategories },
];

export function getBuyerCategory(slug: string) {
  return buyerCategories.find((category) => category.slug === slug) ?? buyerCategories[0];
}
