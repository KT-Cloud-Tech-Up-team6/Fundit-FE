import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { buyerCategories, getBuyerCategory } from "./category-mock.ts";
import { projectCategories } from "./project-categories.ts";

test("구매자 카테고리 목업은 판매자 확정 카테고리와 대분류·소분류가 같고 모두 slug가 있다", () => {
  assert.deepEqual(
    buyerCategories.map((category) => [category.name, [...category.subcategories]]),
    Object.entries(projectCategories).map(([name, minors]) => [name, [...minors]]),
  );
  const slugs = buyerCategories.map((category) => category.slug);
  assert.ok(
    slugs.every((slug) => typeof slug === "string" && /^[a-z-]+$/.test(slug)),
    slugs,
  );
  assert.equal(new Set(slugs).size, slugs.length);
});

test("대분류마다 slug 이름의 아이콘 파일이 있다", () => {
  for (const { slug } of buyerCategories) {
    const icon = new URL(`../../../../public/icons/buyer-category/${slug}.svg`, import.meta.url);
    assert.ok(existsSync(icon), slug);
  }
});

test("하단 메뉴 진입 slug는 테크·가전이고 모르는 slug는 첫 카테고리로 보여 준다", () => {
  assert.equal(getBuyerCategory("tech-appliances").name, "테크·가전");
  assert.equal(getBuyerCategory("home-living").name, "홈·리빙");
  assert.equal(getBuyerCategory("travel").name, "테크·가전");
});
