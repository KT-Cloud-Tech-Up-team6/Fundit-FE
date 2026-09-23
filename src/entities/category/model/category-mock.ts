import { projectCategories } from "./project-categories";

/* 구매자 카테고리 화면의 목업 목록이다. 소분류를 누르면 무조건 LIVE 홈으로 가므로(#307, PM 결정)
   서버 목록을 받지 않는다. 판매자가 프로젝트를 만들 때 고르는 확정 카테고리와 같은 목록을 쓴다.
   영문 slug는 화면 주소용이며 BE 분류 식별자가 아니다. 하단 메뉴·헤더가 `tech-appliances`로 들어온다. */
const majorSlugs: Record<string, string> = {
  "테크·가전": "tech-appliances",
  "홈·리빙": "home-living",
  뷰티: "beauty",
  패션: "fashion",
  푸드: "food",
  스포츠: "sports",
  "캐릭터·굿즈": "characters-goods",
};

export type BuyerCategory = {
  slug: string;
  name: string;
  subcategories: readonly string[];
};

export const buyerCategories: readonly BuyerCategory[] = Object.entries(projectCategories).map(
  ([name, subcategories]) => ({ slug: majorSlugs[name], name, subcategories }),
);

/** 모르는 slug로 들어오면 첫 카테고리를 보여 준다. */
export function getBuyerCategory(slug: string) {
  return buyerCategories.find((category) => category.slug === slug) ?? buyerCategories[0];
}
