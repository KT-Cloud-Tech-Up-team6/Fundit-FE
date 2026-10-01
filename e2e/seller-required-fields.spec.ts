import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";
import {
  addReward,
  fillBusinessType,
  fillCategory,
  openNewProjectForm,
} from "./support/seller-project-form";

/* QA-102 / 예외케이스 판매자 10: 필수 항목이 비면 저장할 수 없고, 빠진 칸을 칸마다 알리며, 입력값은 유지된다. */
test("필수 항목이 비어 있으면 저장되지 않고 빠진 칸마다 안내한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  const createRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && /\/api\/v1\/projects$/.test(request.url()))
      createRequests.push(request.url());
  });
  await openNewProjectForm(page);

  const save = page.getByRole("button", { name: "저장", exact: true });
  const summary = page.getByRole("alert").filter({ hasText: "필수정보 입력이 필요합니다" });
  const saved = page.getByRole("dialog", { name: "기본정보가 저장되었습니다" });
  const errors = {
    business: "사업자 유형을 선택해주세요.",
    title: "프로젝트 제목을 입력해주세요.",
    category: "대분류와 상세 카테고리를 선택해주세요.",
    amount: "목표 금액을 입력해주세요.",
    rewards: "리워드를 최소 1개 등록해주세요.",
  };
  const title = page.getByPlaceholder("프로젝트 제목을 입력해주세요");
  const amount = page.getByLabel("목표 금액");

  // 비어 있어도 저장 버튼은 눌린다. 빠진 5개 칸이 모두 표시되고 첫 칸으로 포커스가 간다.
  await expect(save).toBeEnabled();
  await save.click();
  await expect(summary).toBeVisible();
  for (const text of Object.values(errors)) await expect(page.getByText(text)).toBeVisible();
  await expect(page.getByRole("radio", { name: "일반 사업자" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByRole("radio", { name: "일반 사업자" })).toBeFocused();

  // 사업자 유형만 채우면 그 칸의 안내만 사라지고 나머지는 남는다.
  await fillBusinessType(page);
  await save.click();
  await expect(page.getByText(errors.business)).toHaveCount(0);
  await expect(page.getByText(errors.title)).toBeVisible();
  await expect(title).toBeFocused();

  // 제목. 이후에도 이미 입력한 값은 그대로 남는다.
  await title.fill("E2E 필수 항목 프로젝트");
  await save.click();
  await expect(page.getByText(errors.title)).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "일반 사업자" })).toBeChecked();
  await expect(page.getByRole("button", { name: "대분류" })).toBeFocused();

  // 카테고리. 대분류만 고르면 상세 카테고리 칸이 따로 안내된다.
  await page.getByRole("button", { name: "대분류" }).click();
  await page.getByRole("option").first().click();
  await save.click();
  await expect(page.getByText("대분류와 상세 카테고리를 선택해주세요.")).toHaveCount(0);
  await expect(page.getByText("상세 카테고리를 선택해주세요.")).toBeVisible();
  await expect(page.getByRole("button", { name: "상세 카테고리" })).toBeFocused();
  await page.getByRole("button", { name: "상세 카테고리" }).click();
  await page.getByRole("option").first().click();

  // 목표 금액. 최소 금액(500,000원) 미만은 형식 오류로 같은 칸에 알린다.
  await save.click();
  await expect(page.getByText(errors.amount)).toBeVisible();
  await expect(amount).toBeFocused();
  await amount.fill("1000");
  await save.click();
  await expect(
    page.getByText("목표 금액은 최소 500,000원 이상의 정수로 입력해주세요."),
  ).toBeVisible();
  await expect(amount).toHaveAttribute("aria-invalid", "true");
  await amount.fill("600000");

  // 리워드만 남았다. 빈 칸 안내와 함께 추가 버튼으로 포커스가 간다.
  await save.click();
  await expect(page.getByText(errors.rewards)).toBeVisible();
  await expect(page.getByRole("button", { name: "리워드 추가", exact: true })).toBeFocused();
  await expect(title).toHaveValue("E2E 필수 항목 프로젝트");
  await expect(amount).toHaveValue("600000");

  // 지금까지 한 번도 저장 요청이 나가지 않았고, 모든 항목을 채우면 비로소 저장된다.
  await expect(saved).toBeHidden();
  expect(createRequests).toEqual([]);
  await addReward(page, "E2E 필수 항목 리워드");
  await save.click();
  await expect(saved).toBeVisible();
  expect(createRequests).toHaveLength(1);
});

/* 임시저장은 필수값 없이도 되고, 형식이 틀린 값만 막는다. */
test("임시저장은 필수값이 없어도 저장되고 추가한 리워드도 함께 등록한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);

  // 입력이 하나도 없으면 안내 문구만 띄우고 요청을 보내지 않는다.
  await page.getByRole("button", { name: "임시저장", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "저장할 기본 정보를 입력해주세요." }),
  ).toBeVisible();

  // 형식이 틀린 값은 임시저장도 막는다.
  const amount = page.getByLabel("목표 금액");
  await amount.fill("1000");
  await page.getByRole("button", { name: "임시저장", exact: true }).click();
  await expect(
    page.getByText("목표 금액은 최소 500,000원 이상의 정수로 입력해주세요."),
  ).toBeVisible();
  await amount.fill("");

  // 사업자 유형·제목·금액 없이 리워드만 있어도 프로젝트와 리워드가 만들어지고 편집 화면에 보인다.
  await fillCategory(page);
  await addReward(page, "초안 리워드");
  await page.getByRole("button", { name: "임시저장", exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/projects\/[^/]+\?tab=basic-info/);
  await expect(page.getByText("초안 리워드")).toBeVisible();
});

/* 편집 화면의 저장도 신규 생성과 같은 규칙이다. 리워드는 서버에 등록된 목록으로 센다. */
test("기존 프로젝트 저장도 필수 항목이 비면 막고, 채우면 저장된다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);

  // 제목과 금액만 임시저장해 사업자 유형·카테고리·리워드가 없는 프로젝트의 편집 화면으로 간다.
  await page.getByPlaceholder("프로젝트 제목을 입력해주세요").fill("편집 필수 항목 프로젝트");
  await page.getByLabel("목표 금액").fill("600000");
  await page.getByRole("button", { name: "임시저장", exact: true }).click();
  await expect(page).toHaveURL(/\/seller\/projects\/[^/]+\?tab=basic-info/);
  await expect(page.getByRole("button", { name: "리워드 추가", exact: true })).toBeVisible();

  const save = page.getByRole("button", { name: "저장", exact: true });
  await save.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "필수정보 입력이 필요합니다" }),
  ).toBeVisible();
  for (const text of [
    "사업자 유형을 선택해주세요.",
    "대분류와 상세 카테고리를 선택해주세요.",
    "리워드를 최소 1개 등록해주세요.",
  ])
    await expect(page.getByText(text)).toBeVisible();
  await expect(page.getByPlaceholder("프로젝트 제목을 입력해주세요")).toHaveValue(
    "편집 필수 항목 프로젝트",
  );

  // 빠진 항목을 채우면 저장된다. 리워드는 관리 영역에서 바로 등록된다.
  await fillBusinessType(page);
  await fillCategory(page);
  await addReward(page, "편집 화면 리워드");
  await expect(page.getByText("리워드를 최소 1개 등록해주세요.")).toHaveCount(0);
  await save.click();
  await expect(
    page.getByRole("status").filter({ hasText: "기본 정보를 저장했습니다." }),
  ).toBeVisible();
});
