import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import { FIXTURE_PROJECT_ID } from "@/mocks/fixtures";

/* 소비자 탐색: 통합 검색(프로젝트·판매자 탭, 정렬, 종료 프로젝트, 최근·인기 검색어).
   검색 응답은 src/mocks/discovery-handlers.ts가 만든다. */
async function search(page: import("@playwright/test").Page, keyword: string) {
  const input = page.getByRole("textbox", { name: "통합 검색어" });
  // 첫 진입은 dev 서버 컴파일·hydration이 끝나기 전에 Enter가 무시될 수 있어 이동할 때까지 다시 시도한다.
  await expect(async () => {
    await input.fill(keyword);
    await input.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/search\\?q=${encodeURIComponent(keyword)}`), {
      timeout: 2_000,
    });
  }).toPass({ timeout: 20_000 });
}

const results = (page: import("@playwright/test").Page) => page.locator("#search-results article");

test("검색어로 진행 중인 프로젝트를 찾고 상세로 이동한다", async ({ page }) => {
  await page.goto("/search");
  await search(page, "무드등");

  await expect(page.getByRole("status").filter({ hasText: "총 2개" })).toBeVisible();
  await expect(results(page)).toHaveCount(2);

  await Promise.all([
    page.waitForURL(new RegExp(`/projects/${FIXTURE_PROJECT_ID}`)),
    page.getByRole("link", { name: "감성 캠핑 무드등 세트 상세 보기" }).click(),
  ]);
});

test("정렬을 바꾸면 그 기준으로 다시 검색한다", async ({ page }) => {
  await page.goto("/search");
  await search(page, "무드등");
  await expect(results(page).first()).toHaveAccessibleName("무드등 미니 블렌더");

  await page.getByRole("button", { name: "검색 결과 정렬" }).click();
  await page.getByRole("option", { name: "인기순" }).click();

  await expect(page).toHaveURL(/sort=popular/);
  // 인기순은 달성률이 높은 프로젝트가 먼저 온다(목업: 180% > 24%).
  await expect(results(page).first()).toHaveAccessibleName("무드등 미니 블렌더");
  await page.getByRole("button", { name: "검색 결과 정렬" }).click();
  await page.getByRole("option", { name: "마감 임박순" }).click();
  await expect(page).toHaveURL(/sort=closing/);
  // 마감 임박순은 남은 일수가 적은 프로젝트가 먼저 온다(목업: 3일 < 10일).
  await expect(results(page).first()).toHaveAccessibleName("무드등 미니 블렌더");
});

test("종료 프로젝트만 보기를 켜면 종료된 프로젝트만 나온다", async ({ page }) => {
  await page.goto("/search");
  await search(page, "무드등");

  // 체크 상태는 URL이 정하므로 눌러서 이동한 뒤 확인한다.
  await page.getByRole("checkbox", { name: "종료 프로젝트만 보기" }).click({ force: true });

  await expect(page).toHaveURL(/closed=true/);
  await expect(results(page)).toHaveCount(1);
  await expect(results(page).first()).toHaveAccessibleName("종료된 무드등 스탠드");
});

test("결과가 없으면 빈 상태를 안내한다", async ({ page }) => {
  await page.goto("/search");
  await search(page, "존재하지않는검색어");

  await expect(page.getByText("검색 결과가 없습니다")).toBeVisible();
});

test("판매자 탭에서 판매자를 찾는다", async ({ page }) => {
  await page.goto("/search");
  await search(page, "무드등");

  await page.getByRole("tab", { name: /판매자/ }).click();

  await expect(page).toHaveURL(/tab=sellers/);
  await expect(page.getByRole("article", { name: "무드등 공방" })).toBeVisible();
});

test("인기 검색어를 누르면 그 검색어로 검색한다", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("button", { name: "2 블렌더" }).click();

  await expect(page).toHaveURL(/q=%EB%B8%94%EB%A0%8C%EB%8D%94/);
  await expect(results(page).first()).toHaveAccessibleName("무드등 미니 블렌더");
});

test("비로그인이면 최근 검색어 대신 로그인 안내를 보인다", async ({ page }) => {
  await page.goto("/search");

  await expect(page.getByText("로그인하면 최근 검색어를 확인할 수 있습니다.")).toBeVisible();
});

test("로그인하면 검색어가 최근 검색어에 남고 삭제할 수 있다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/search");
  await search(page, "무드등");

  // 모바일 전용 "뒤로가기" 버튼은 데스크톱에서 숨겨져 브라우저 뒤로가기를 쓴다.
  await page.goBack();
  await expect(page).toHaveURL(/\/search$/);
  const recent = page.getByRole("region", { name: "최근 검색어" });
  await expect(recent.getByRole("button", { name: "무드등", exact: true })).toBeVisible();
  // 이름 붙은 목록 의미(aria-prohibited-attr 회귀 방지)와 항목이 없을 때 빈 목록이 남지 않는지 잠근다.
  const track = recent.getByRole("list", { name: "최근 검색어 가로 목록" });
  await expect(track.getByRole("listitem")).toHaveCount(1);

  await recent.getByRole("button", { name: "무드등 최근 검색어 삭제" }).click();

  await expect(recent.getByText("최근 검색어가 없습니다.")).toBeVisible();
  await expect(track).toHaveCount(0);
});
