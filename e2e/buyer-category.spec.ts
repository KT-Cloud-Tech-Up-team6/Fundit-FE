import { test, expect } from "@playwright/test";
import { buyerCategories } from "../src/entities/category/model/category-mock";

/* 소비자 탐색: 카테고리 화면은 정적 목록이라 핸들러 없이 검증한다.
   소분류는 PM 결정(#307)에 따라 결과 화면 없이 LIVE 홈으로 보낸다. */
const [first, second] = buyerCategories;

test("카테고리를 바꾸면 선택 표시와 소분류 목록이 바뀐다", async ({ page }) => {
  await page.goto(`/categories/${first.slug}`);

  const nav = page.getByRole("navigation", { name: "카테고리 목록" });
  await expect(nav.getByRole("link", { name: first.name })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 2, name: first.name })).toBeVisible();
  await expect(page.getByRole("link", { name: first.subcategories[0], exact: true })).toBeVisible();

  await nav.getByRole("link", { name: second.name }).click();

  await expect(page).toHaveURL(new RegExp(`/categories/${second.slug}$`));
  await expect(nav.getByRole("link", { name: second.name })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(page.getByRole("heading", { level: 2, name: second.name })).toBeVisible();
  await expect(
    page.getByRole("link", { name: second.subcategories[0], exact: true }),
  ).toBeVisible();
});

test("모르는 카테고리 주소는 첫 카테고리를 보여 준다", async ({ page }) => {
  await page.goto("/categories/does-not-exist");

  await expect(page.getByRole("heading", { level: 2, name: first.name })).toBeVisible();
});

test("소분류는 LIVE 홈으로 연결된다", async ({ page }) => {
  await page.goto(`/categories/${first.slug}`);

  await expect(
    page.getByRole("link", { name: first.subcategories[0], exact: true }),
  ).toHaveAttribute("href", "/live");
});

test("카테고리 화면에서 검색어를 제출하면 통합 검색으로 이동한다", async ({ page }) => {
  await page.goto(`/categories/${first.slug}`);

  const input = page.getByRole("search").getByRole("textbox", { name: "프로젝트 검색" });
  await input.fill("무드등");
  await input.press("Enter");

  await expect(page).toHaveURL(/\/search\?q=/);
  await expect(page.getByRole("article", { name: "감성 캠핑 무드등 세트" })).toBeVisible();
});
