import assert from "node:assert/strict";
import test from "node:test";
import { rewardRequest, rewardToDraft } from "./reward-request.ts";
import { saveReward, deleteReward } from "../../../entities/project/api/reward-api.ts";
import { uploadProjectMedia } from "../../../entities/project/api/media-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

const reward = {
  rewardId: 42,
  name: "세트",
  description: "설명",
  imageUrl: "https://media/image.png",
  price: 20000,
  isLimited: false,
  quantity: null,
  hasOption: true,
  isEarlyBird: true,
  earlyBirdDiscountType: "RATE",
  earlyBirdDiscountValue: 10,
  simpleRefundDisabled: true,
  options: [{ groupId: 7, groupName: "색상", values: [{ valueId: 8, value: "블랙" }] }],
};
test("서버 숫자 ID와 옵션 유무를 복원하고 편집하지 않은 옵션·배송·이미지는 보내지 않는다", () => {
  const draft = rewardToDraft(reward);
  assert.equal(draft.id, 42);
  assert.equal(draft.options, true);
  assert.equal(draft.optionSummary, "색상: 블랙");
  assert.equal(draft.simpleRefundDisabled, true);
  assert.equal(draft.quantity, "");
  const body = rewardRequest(draft);
  assert.equal(body.quantity, null);
  assert.equal(body.earlyBirdDiscountType, "RATE");
  for (const key of ["options", "shippingFee", "estimatedDeliveryDays", "imageUrl"])
    assert.equal(key in body, false);
});
test("할인을 해제하면 이전 할인 값을 재전송하지 않는다", () => {
  const body = rewardRequest({ ...rewardToDraft(reward), discount: false });
  assert.equal(body.isEarlyBird, false);
  assert.equal(body.earlyBirdDiscountValue, null);
});
test("등록은 프로젝트 UUID, 수정·삭제는 서버 리워드 ID를 사용하고 오류를 전파한다", async (t) => {
  authTokenStore.set("test");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([url, init]);
    return init.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json(reward);
  });
  await saveReward("project-uuid", rewardRequest(rewardToDraft(reward)));
  await saveReward("project-uuid", rewardRequest(rewardToDraft(reward)), 42);
  await deleteReward(42);
  assert.deepEqual(
    calls.map(([url, init]) => [url, init.method]),
    [
      ["/api/v1/projects/project-uuid/rewards", "POST"],
      ["/api/v1/rewards/42", "PATCH"],
      ["/api/v1/rewards/42", "DELETE"],
    ],
  );
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ code: "FORBIDDEN" }, { status: 403 }),
  );
  await assert.rejects(deleteReward(42), { status: 403 });
});
test("서명 URL에는 인증 정보를 보내지 않고 PUT 실패를 저장 성공으로 처리하지 않는다", async (t) => {
  authTokenStore.set("test");
  const file = new File(["image"], "image.png", { type: "image/png" });
  let uploadInit;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (String(url).endsWith("upload-url"))
      return Response.json({ uploadUrl: "https://upload/image", fileUrl: "https://cdn/image" });
    uploadInit = init;
    return new Response(null, { status: 503 });
  });
  await assert.rejects(uploadProjectMedia("project-uuid", file));
  assert.equal(uploadInit.credentials, "omit");
  assert.equal(uploadInit.body, file);
  assert.equal(uploadInit.headers.Authorization, undefined);
});
