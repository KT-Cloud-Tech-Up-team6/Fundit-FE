import { test, expect } from "@playwright/test";
import { FIXTURE_SELLER_PROJECT_ID } from "@/mocks/fixtures";
import { loginAsFixtureUser } from "./support/login";
import {
  addReward,
  fillBasicInfo,
  openNewProjectForm,
  openRewardModal,
} from "./support/seller-project-form";

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

/* PM 요청(2026-10-02, #562): 판매자 화면에서 공개 상세를 확인할 수 있게 진행중 썸네일이 같은 탭에서 상세로 간다. */
test("진행중 카드의 썸네일을 누르면 공개 상세로 가고, 뒤로 가기로 돌아온다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await page.goto("/seller/projects");

  await page.getByRole("link", { name: "E2E 제작·배송 프로젝트 상세페이지 보기" }).click();
  await expect(page).toHaveURL(`/projects/${FIXTURE_SELLER_PROJECT_ID}`);

  await page.goBack();
  await expect(page).toHaveURL(/\/seller\/projects$/);
});

test("준비 중 프로젝트를 확인한 뒤 삭제할 수 있다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);
  await fillBasicInfo(page, "삭제할 테스트 프로젝트");
  await addReward(page, "삭제할 프로젝트 리워드");
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
  // 준비중은 공개 전이라 상세가 없어 썸네일에 링크가 없다(#562).
  await expect(
    page.getByRole("link", { name: "삭제할 테스트 프로젝트 상세페이지 보기" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "프로젝트를 삭제할까요?" });
  await expect(dialog).toContainText("삭제한 프로젝트는 복구할 수 없습니다.");
  await dialog.getByRole("button", { name: "삭제하기" }).click();

  await expect(page.getByRole("link", { name: "삭제할 테스트 프로젝트" })).not.toBeVisible();
});

/* UCS 판매자 6~7: 리워드에 할인·옵션을 설정해 등록하면 그 값이 신청에 실린다. */
test("리워드 할인과 옵션을 설정해 등록한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);
  await fillBasicInfo(page, "리워드 옵션 프로젝트");

  const modal = await openRewardModal(page);
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
  await modal.getByRole("button", { name: /^등록$/ }).click();
  await expect(page.getByRole("table").getByText("색상 선택 리워드")).toBeVisible();

  // 신규 생성 화면에서는 프로젝트 저장 때 리워드가 함께 등록된다. 옵션이 빠지면 안 된다.
  const request = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/v1\/projects\/[^/]+\/rewards$/.test(req.url()),
  );
  await page.getByRole("button", { name: "저장", exact: true }).click();

  const body = (await request).postDataJSON();
  expect(body).toMatchObject({
    name: "색상 선택 리워드",
    price: 20000,
    isEarlyBird: true,
    earlyBirdDiscountValue: 3000,
    options: [{ groupName: "색상", values: ["화이트"] }],
  });
  await page
    .getByRole("dialog", { name: "기본정보가 저장되었습니다" })
    .getByRole("button", { name: "다음에" })
    .click();
  await expect(page.getByText("색상 선택 리워드")).toBeVisible();
});

/* QA-156: 정률 할인은 BE와 같이 0~99%만 등록할 수 있고, 막힌 이유가 입력칸 아래에 보인다. */
test("리워드 정률 할인은 99%까지만 등록할 수 있다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);
  await fillBasicInfo(page, "리워드 할인율 프로젝트");

  const modal = await openRewardModal(page);
  await modal.getByRole("textbox", { name: "리워드 명" }).fill("할인율 리워드");
  await modal.getByPlaceholder("리워드 설명을 입력해주세요").fill("할인율을 확인해요.");
  await modal.getByRole("textbox", { name: /^가격$/ }).fill("1000");
  await modal.getByRole("checkbox", { name: /리워드 할인 설정/ }).check({ force: true });

  // 996원 할인을 %로 바꾸면 버림해 99%다(반올림이면 100%가 되어 등록이 막힌다).
  await modal.getByLabel("할인 값").fill("996");
  await modal.getByRole("button", { name: "할인 단위" }).click();
  await page.getByRole("option", { name: "%" }).click();
  await expect(modal.getByLabel("할인 값")).toHaveValue("99");

  const submit = modal.getByRole("button", { name: /^등록$/ });
  await expect(submit).toBeEnabled();
  await modal.getByLabel("할인 값").fill("100");
  await expect(submit).toBeDisabled();
  await expect(modal.getByText("할인율은 0~99%로 입력해주세요.")).toBeVisible();

  await modal.getByLabel("할인 값").fill("0");
  await expect(submit).toBeEnabled();
  await expect(modal.getByText("할인율은 0~99%로 입력해주세요.")).toBeHidden();
});
