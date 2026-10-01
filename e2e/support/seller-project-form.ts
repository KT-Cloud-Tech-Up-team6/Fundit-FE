import type { Page } from "@playwright/test";

/** 신규 프로젝트 화면을 열고 약관에 동의해 기본 정보 폼까지 연다. */
export async function openNewProjectForm(page: Page) {
  await page.goto("/seller/projects/new");
  await page.getByRole("checkbox", { name: "약관 전체 동의" }).check({ force: true });
  await page.getByRole("button", { name: "동의하기" }).click();
}

export async function fillBusinessType(page: Page) {
  await page.getByRole("radio", { name: "일반 사업자" }).check({ force: true });
}

export async function fillCategory(page: Page) {
  await page.getByRole("button", { name: "대분류" }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "상세 카테고리" }).click();
  await page.getByRole("option").first().click();
}

/** 리워드를 뺀 기본 정보 4개 항목을 채운다. */
export async function fillBasicInfo(page: Page, title: string) {
  await fillBusinessType(page);
  await page.getByPlaceholder("프로젝트 제목을 입력해주세요").fill(title);
  await fillCategory(page);
  await page.getByLabel("목표 금액").fill("600000");
}

/** 리워드 추가 모달을 연다. 리워드가 이미 있으면 여는 버튼 이름이 "추가"다. */
export async function openRewardModal(page: Page) {
  await page
    .getByRole("button", { name: "리워드 추가", exact: true })
    .or(page.getByRole("button", { name: "추가", exact: true }))
    .first()
    .click();
  return page.getByRole("dialog", { name: "리워드 추가" });
}

/** 리워드 하나를 모달에서 채워 등록한다. 서버 저장은 프로젝트 `저장`을 누를 때 일어난다. */
export async function addReward(page: Page, name: string) {
  const modal = await openRewardModal(page);
  await modal.getByRole("textbox", { name: "리워드 명" }).fill(name);
  await modal.getByPlaceholder("리워드 설명을 입력해주세요").fill(`${name} 설명`);
  await modal.getByRole("textbox", { name: /^가격$/ }).fill("10000");
  await modal.getByRole("button", { name: /^등록$/ }).click();
}
