import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";

/* UCS 판매자 2~4: 프로젝트 목록에서 신규 생성하기를 선택하면 개인정보 동의 모달이 열린다. */
test("프로젝트 목록에서 신규 생성하기를 누르면 기본정보 등록으로 이동해 동의를 받는다", async ({
  page,
}) => {
  await loginAsFixtureUser(page);
  await page.goto("/seller/projects");

  await expect(page.getByRole("heading", { name: "내 프로젝트", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "내 프로젝트 목록", level: 2 })).toBeVisible();
  const projectHeading = page.getByRole("heading", {
    name: "E2E 제작·배송 프로젝트",
    level: 3,
  });
  await expect(projectHeading).toBeVisible();
  await expect(projectHeading.getByRole("link", { name: "E2E 제작·배송 프로젝트" })).toBeVisible();
  await expect(page.getByRole("link", { name: /진행중/ })).toContainText("1");

  await page.getByRole("link", { name: "신규 생성하기" }).click();

  await expect(page).toHaveURL(/\/seller\/projects\/new/);
  await expect(page.getByRole("checkbox", { name: "약관 전체 동의" })).toBeVisible();
});

test("준비 중 프로젝트를 확인한 뒤 삭제할 수 있다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/seller/projects/new");
  await page.getByRole("checkbox", { name: "약관 전체 동의" }).check({ force: true });
  await page.getByRole("button", { name: "동의하기" }).click();
  await page.getByRole("radio", { name: "일반 사업자" }).check({ force: true });
  await page.getByPlaceholder("프로젝트 제목을 입력해주세요").fill("삭제할 테스트 프로젝트");
  await page.getByRole("button", { name: "대분류" }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "상세 카테고리" }).click();
  await page.getByRole("option").first().click();
  await page.getByLabel("목표 금액").fill("600000");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page
    .getByRole("dialog", { name: "기본정보가 저장되었습니다" })
    .getByRole("button", { name: "다음에" })
    .click();

  /* page.goto는 브라우저 문서를 새로 만들어 MSW의 인메모리 프로젝트를 초기화한다. 목록과
     준비중 탭 모두 Link를 눌러 클라이언트 라우팅으로 이동해야 생성한 프로젝트가 유지된다. */
  await page.getByRole("link", { name: "내 프로젝트로" }).click();
  await page.getByRole("link", { name: /준비중/ }).click();
  await expect(page.getByText("삭제할 테스트 프로젝트")).toBeVisible();
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "프로젝트를 삭제할까요?" });
  await expect(dialog).toContainText("삭제한 프로젝트는 복구할 수 없습니다.");
  await dialog.getByRole("button", { name: "삭제하기" }).click();

  await expect(page.getByRole("link", { name: "삭제할 테스트 프로젝트" })).not.toBeVisible();
});

/* UCS 판매자 6~7: 리워드에 할인·옵션을 설정해 등록하면 그 값이 신청에 실린다. */
test("리워드 할인과 옵션을 설정해 등록한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/seller/projects/new");
  await page.getByRole("checkbox", { name: "약관 전체 동의" }).check({ force: true });
  await page.getByRole("button", { name: "동의하기" }).click();
  await page.getByRole("radio", { name: "일반 사업자" }).check({ force: true });
  await page.getByPlaceholder("프로젝트 제목을 입력해주세요").fill("리워드 옵션 프로젝트");
  await page.getByRole("button", { name: "대분류" }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "상세 카테고리" }).click();
  await page.getByRole("option").first().click();
  await page.getByLabel("목표 금액").fill("600000");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page
    .getByRole("dialog", { name: "기본정보가 저장되었습니다" })
    .getByRole("button", { name: "다음에" })
    .click();

  await page.getByRole("button", { name: "리워드 추가" }).click();
  const modal = page.getByRole("dialog", { name: "리워드 추가" });
  await modal.getByRole("textbox", { name: "리워드 명" }).fill("색상 선택 리워드");
  await modal.getByPlaceholder("리워드 설명을 입력해주세요").fill("색상을 고를 수 있어요.");
  await modal.getByRole("textbox", { name: /^가격$/ }).fill("20000");

  await modal.getByRole("checkbox", { name: /리워드 할인 설정/ }).check({ force: true });
  await modal.getByLabel("할인 값").fill("3000");

  await modal.getByRole("checkbox", { name: /옵션 설정/ }).check({ force: true });
  await modal.getByRole("button", { name: /옵션 카테고리 추가/ }).click();
  const category = modal.getByRole("textbox", { name: "옵션 카테고리 이름" });
  await category.fill("색상");
  await category.press("Enter");
  await modal.getByRole("button", { name: /선택지 추가/ }).click();
  const choice = modal.getByRole("textbox", { name: "색상 선택지" });
  await choice.fill("화이트");
  await choice.press("Enter");

  const request = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/v1\/projects\/[^/]+\/rewards$/.test(req.url()),
  );
  await modal.getByRole("button", { name: /^등록$/ }).click();

  const body = (await request).postDataJSON();
  expect(body).toMatchObject({
    name: "색상 선택 리워드",
    price: 20000,
    isEarlyBird: true,
    earlyBirdDiscountValue: 3000,
    options: [{ groupName: "색상", values: ["화이트"] }],
  });
  await expect(page.getByText("색상 선택 리워드")).toBeVisible();
});
