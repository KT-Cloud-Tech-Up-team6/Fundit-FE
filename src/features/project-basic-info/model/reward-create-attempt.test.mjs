import test from "node:test";
import assert from "node:assert/strict";
import {
  createRewardOnce,
  RewardAlreadySubmittedError,
  RewardCreationUncertainError,
} from "./reward-create-attempt.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const idempotencyKey = (init) => new Headers(init?.headers).get("Idempotency-Key");

for (const mode of ["network", "503", "parse", "missing-id"])
  test(`생성 결과 불확실(${mode}) 후 다시 저장하면 같은 키로 보내 리워드를 되찾는다`, async (t) => {
    const s = storage();
    const keys = [];
    t.mock.method(globalThis, "fetch", async (_url, init) => {
      keys.push(idempotencyKey(init));
      if (keys.length > 1) return Response.json({ rewardId: 7 }, { status: 200 });
      if (mode === "network") throw new TypeError("lost");
      if (mode === "503") return new Response("", { status: 503 });
      if (mode === "parse") return new Response("invalid", { status: 201 });
      return Response.json({}, { status: 201 });
    });
    await assert.rejects(createRewardOnce(s, "owner", "project", {}), RewardCreationUncertainError);
    assert.equal((await createRewardOnce(s, "owner", "project", {})).rewardId, 7);
    assert.ok(keys[0]);
    assert.deepEqual(keys, [keys[0], keys[0]]);
  });

test("확정 거절 뒤에도 이전 요청이 만들었을 수 있어 같은 키로 다시 보낸다", async (t) => {
  const s = storage();
  const keys = [];
  authTokenStore.set("test");
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    keys.push(idempotencyKey(init));
    return keys.length === 1
      ? Response.json({ code: "INVALID_INPUT" }, { status: 400 })
      : Response.json({ rewardId: 2 }, { status: 201 });
  });
  await assert.rejects(createRewardOnce(s, "owner", "project", {}), { status: 400 });
  assert.equal((await createRewardOnce(s, "owner", "project", {})).rewardId, 2);
  assert.equal(keys[1], keys[0]);
});

test("같은 키의 리워드가 이미 있거나 처리 중(409)이면 알리고 다음 저장은 새 키로 보낸다", async (t) => {
  const s = storage();
  const keys = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    keys.push(idempotencyKey(init));
    return keys.length === 1
      ? Response.json({ code: "CONFLICT" }, { status: 409 })
      : Response.json({ rewardId: 3 }, { status: 201 });
  });
  await assert.rejects(createRewardOnce(s, "owner", "project", {}), RewardAlreadySubmittedError);
  assert.equal((await createRewardOnce(s, "owner", "project", {})).rewardId, 3);
  assert.notEqual(keys[1], keys[0]);
});

test("성공한 뒤 다음 리워드는 새 키로 만들고, 사용자·프로젝트별 시도를 분리한다", async (t) => {
  const s = storage();
  const keys = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    keys.push(idempotencyKey(init));
    if (keys.length === 1) throw new TypeError("lost");
    return Response.json({ rewardId: keys.length }, { status: 201 });
  });
  await assert.rejects(createRewardOnce(s, "a", "p", {}), RewardCreationUncertainError);
  await createRewardOnce(s, "b", "p", {});
  await createRewardOnce(s, "a", "q", {});
  await createRewardOnce(s, "a", "p", {});
  await createRewardOnce(s, "a", "p", {});
  const [lost, otherMember, otherProject, recovered, next] = keys;
  assert.equal(recovered, lost);
  assert.equal(new Set([lost, otherMember, otherProject, next]).size, 4);
});

test("저장소를 사용할 수 없으면 생성 요청 전에 중단한다", async (t) => {
  const s = storage();
  s.setItem = () => {
    throw new Error("storage unavailable");
  };
  const request = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  await assert.rejects(createRewardOnce(s, "owner", "project", {}), /storage unavailable/);
  assert.equal(request.mock.callCount(), 0);
});
