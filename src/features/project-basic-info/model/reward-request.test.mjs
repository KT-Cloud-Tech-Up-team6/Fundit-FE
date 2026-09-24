import assert from "node:assert/strict";
import test from "node:test";
import { rewardOptionsError, rewardRequest, rewardToDraft } from "./reward-request.ts";
import {
  createReward,
  deleteReward,
  updateReward,
} from "../../../entities/project/api/reward-api.ts";
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

test("옵션 편집은 기존 그룹 ID를 유지하고 신규 그룹·전체 삭제를 구분한다", () => {
  const draft = rewardToDraft(reward);
  draft.optionGroups[0].groupName = " 색깔 ";
  draft.optionGroups[0].values = [" 화이트 ", "블루"];
  draft.optionGroups.push({ groupName: "사이즈", values: ["M"] });
  assert.deepEqual(rewardRequest(draft, undefined, true).options, [
    { optionGroupId: 7, groupName: "색깔", values: ["화이트", "블루"] },
    { groupName: "사이즈", values: ["M"] },
  ]);
  assert.deepEqual(rewardRequest({ ...draft, options: false }, undefined, true).options, []);
  assert.equal("options" in rewardRequest(draft), false);
  draft.optionGroups.shift();
  assert.deepEqual(rewardRequest(draft, undefined, true).options, [
    { groupName: "사이즈", values: ["M"] },
  ]);
});

test("저장 응답의 새 groupId와 null valueId로 다시 편집할 수 있다", () => {
  const saved = {
    ...reward,
    options: [{ groupId: 25, groupName: "색상", values: [{ valueId: null, value: "레드" }] }],
  };
  assert.deepEqual(rewardRequest(rewardToDraft(saved), undefined, true).options, [
    { optionGroupId: 25, groupName: "색상", values: ["레드"] },
  ]);
});

test("옵션 활성화 시 그룹·이름·값 누락을 차단한다", () => {
  const draft = rewardToDraft(reward);
  assert.equal(rewardOptionsError(draft), "");
  for (const groups of [
    [],
    [{ groupName: " ", values: ["값"] }],
    [{ groupName: "색상", values: [] }],
    [{ groupName: "색상", values: [" "] }],
  ]) {
    assert.ok(rewardOptionsError({ ...draft, optionGroups: groups }));
  }
  assert.equal(rewardOptionsError({ ...draft, options: false, optionGroups: [] }), "");
});
test("등록은 프로젝트 UUID, 수정·삭제는 서버 리워드 ID를 사용하고 오류를 전파한다", async (t) => {
  authTokenStore.set("test");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([url, init]);
    return init.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json(reward);
  });
  await createReward("project-uuid", rewardRequest(rewardToDraft(reward)), "attempt-key");
  await updateReward(42, rewardRequest(rewardToDraft(reward)));
  await deleteReward(42);
  assert.deepEqual(
    calls.map(([url, init]) => [url, init.method, init.headers.get("Idempotency-Key")]),
    [
      ["/api/v1/projects/project-uuid/rewards", "POST", "attempt-key"],
      ["/api/v1/rewards/42", "PATCH", null],
      ["/api/v1/rewards/42", "DELETE", null],
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
