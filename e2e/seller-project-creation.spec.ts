import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";

test("판매자가 프로젝트 기본정보를 등록하고 리워드를 추가한다", async ({ page }) => {
  await loginAsFixtureUser(page);

  await page.goto("/seller/projects/new");

  await page.getByRole("checkbox", { name: "약관 전체 동의" }).check({ force: true });
  await page.getByRole("button", { name: "동의하기" }).click();

  await page.getByRole("radio", { name: "일반 사업자" }).check({ force: true });
  await page.getByPlaceholder("프로젝트 제목을 입력해주세요").fill("E2E 테스트 프로젝트");

  await page.getByRole("button", { name: "대분류" }).click();
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: "상세 카테고리" }).click();
  await page.getByRole("option").first().click();

  await page.getByLabel("목표 금액").fill("600000");

  await page.getByRole("button", { name: "저장", exact: true }).click();

  const savedModal = page.getByRole("dialog", { name: "기본정보가 저장되었습니다" });
  await expect(savedModal).toBeVisible();
  await savedModal.getByRole("button", { name: "다음에" }).click();

  await expect(page).toHaveURL(/\/seller\/projects\/.+\?tab=basic-info/);
  await expect(page.getByRole("button", { name: "리워드 추가" })).toBeVisible();

  await page.getByRole("button", { name: "리워드 추가" }).click();
  const rewardModal = page.getByRole("dialog", { name: "리워드 추가" });
  await expect(rewardModal).toBeVisible();
  const rewardName = rewardModal.getByRole("textbox", { name: "리워드 명" });
  await rewardName.fill("테스트 리워드");

  // 창 안에서 누른 채 배경으로 끌어 떼거나 그 반대로 끌어도 닫히지 않고 입력이 남는다(#506).
  const nameBox = (await rewardName.boundingBox())!;
  const modalBox = (await rewardModal.boundingBox())!;
  const inside = { x: nameBox.x + nameBox.width / 2, y: nameBox.y + nameBox.height / 2 };
  const backdrop = { x: modalBox.x - 40, y: modalBox.y + 40 };
  for (const [from, to] of [
    [inside, backdrop],
    [backdrop, inside],
  ]) {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 5 });
    await page.mouse.up();
    await expect(rewardName).toHaveValue("테스트 리워드");
  }

  await rewardModal
    .getByPlaceholder("리워드 설명을 입력해주세요")
    .fill("E2E 테스트용 리워드입니다.");
  await rewardModal.getByRole("textbox", { name: /^가격$/ }).fill("10000");
  await rewardModal.getByRole("button", { name: /^등록$/ }).click();

  await expect(page.getByText("테스트 리워드")).toBeVisible();

  // 배경을 누르고 그 자리에서 떼면 지금처럼 닫힌다. 리워드가 생기면 여는 버튼 이름은 "추가"다.
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(rewardModal).toBeVisible();
  await page.mouse.click(backdrop.x, backdrop.y);
  await expect(rewardModal).toBeHidden();
});
