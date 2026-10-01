import { test, expect } from "@playwright/test";
import { loginAsFixtureUser } from "./support/login";

import { fillBasicInfo, openNewProjectForm, openRewardModal } from "./support/seller-project-form";

test("판매자가 프로젝트 기본정보와 리워드를 함께 등록한다", async ({ page }) => {
  await loginAsFixtureUser(page);
  await openNewProjectForm(page);

  // 리워드는 저장 전에 이 화면에서 추가한다. 서버에는 프로젝트 저장 때 함께 등록된다.
  const rewardModal = await openRewardModal(page);
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

  // 설명을 비우면 등록할 수 없다. 서버가 설명을 필수로 받아, 프로젝트를 만든 뒤 거절되는 일을 막는다.
  const register = rewardModal.getByRole("button", { name: /^등록$/ });
  await rewardModal.getByRole("textbox", { name: /^가격$/ }).fill("10000");
  await expect(register).toBeDisabled();
  await rewardModal
    .getByPlaceholder("리워드 설명을 입력해주세요")
    .fill("E2E 테스트용 리워드입니다.");
  await register.click();
  await expect(rewardModal).toBeHidden();
  await expect(page.getByRole("table").getByText("테스트 리워드")).toBeVisible();

  await fillBasicInfo(page, "E2E 테스트 프로젝트");
  const rewardRequest = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/v1\/projects\/[^/]+\/rewards$/.test(req.url()),
  );
  await page.getByRole("button", { name: "저장", exact: true }).click();
  expect((await rewardRequest).postDataJSON()).toMatchObject({
    name: "테스트 리워드",
    description: "E2E 테스트용 리워드입니다.",
    price: 10000,
  });

  const savedModal = page.getByRole("dialog", { name: "기본정보가 저장되었습니다" });
  await expect(savedModal).toBeVisible();
  await savedModal.getByRole("button", { name: "다음에" }).click();

  // 편집 화면에는 방금 등록한 리워드가 서버에서 조회되어 보인다.
  await expect(page).toHaveURL(/\/seller\/projects\/.+\?tab=basic-info/);
  await expect(page.getByText("테스트 리워드")).toBeVisible();

  // 배경을 누르고 그 자리에서 떼면 지금처럼 닫힌다. 리워드가 생기면 여는 버튼 이름은 "추가"다.
  await page.getByRole("button", { name: "추가", exact: true }).click();
  await expect(rewardModal).toBeVisible();
  await page.mouse.click(backdrop.x, backdrop.y);
  await expect(rewardModal).toBeHidden();
});
