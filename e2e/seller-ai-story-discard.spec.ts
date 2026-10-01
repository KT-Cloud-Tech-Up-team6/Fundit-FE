import { expect, test } from "@playwright/test";
import { FIXTURE_AI_STORY_PROJECT_ID } from "@/mocks/fixtures";
import { loginAsFixtureUser } from "./support/login";

test("QA-189: 생성 중 결과 폐기 후 모달이 닫히고 polling을 멈춘다", async ({ page }) => {
  let runPolls = 0;
  page.on("request", (request) => {
    if (
      request.method() === "GET" &&
      /\/api\/v1\/ai\/runs\/99999999-9999-4999-8999-999999999999$/.test(request.url())
    )
      runPolls += 1;
  });

  await loginAsFixtureUser(page);
  await page.goto(`/seller/projects/${FIXTURE_AI_STORY_PROJECT_ID}?tab=story`);
  await page.getByRole("button", { name: "AI로 펀딩 스토리 작성" }).click();

  const storyModal = page.getByRole("dialog", { name: "AI 스토리 작성" });
  await storyModal.getByRole("button", { name: "그대로 생성하기" }).click();
  await expect(storyModal.getByText("AI가 스토리를 생성중이에요...")).toBeVisible();
  await expect.poll(() => runPolls).toBe(1);

  const discardRequest = page.waitForRequest(
    (request) => request.method() === "POST" && request.url().endsWith("/api/v1/ai/runs/discard"),
  );
  await storyModal.getByRole("button", { name: "AI 스토리 작성 닫기" }).click();

  const confirmation = page.getByRole("dialog", { name: "AI 스토리 생성을 그만둘까요?" });
  await expect(confirmation).toContainText("생성 결과는 스토리에 반영되지 않습니다.");
  await confirmation.getByRole("button", { name: "생성 결과 폐기" }).click();

  const body = (await discardRequest).postDataJSON();
  expect(body).toEqual({ run_id: "99999999-9999-4999-8999-999999999999" });
  await expect(confirmation).not.toBeVisible();
  // 최초 polling 1회와 폐기 직후 상태 확인 GET 1회만 허용한다.
  await expect.poll(() => runPolls).toBe(2);
  await page.waitForTimeout(1_700);
  expect(runPolls).toBe(2);
});
