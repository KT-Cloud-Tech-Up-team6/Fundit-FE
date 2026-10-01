import test from "node:test";
import assert from "node:assert/strict";
import {
  createRewardOnce,
  registerRewards,
  RewardAlreadySubmittedError,
  RewardBatchError,
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

test("리워드를 순서대로 등록하다 첫 실패에서 멈추고, 다시 저장하면 등록한 리워드는 건너뛴다", async () => {
  const rewards = [1, 2, 3].map((id) => ({ id, name: `리워드${id}` }));
  const sent = [];
  let fail = true;
  const register = async (reward) => {
    sent.push(reward.id);
    if (reward.id === 2 && fail) throw new RewardCreationUncertainError();
  };
  const done = new Set();
  await assert.rejects(
    registerRewards(rewards, register, (id) => done.add(id)),
    (error) => error instanceof RewardBatchError && error.message.includes("리워드2"),
  );
  // 3번은 시도하지 않는다. 같은 멱등 키에 다른 본문이 가면 409가 나기 때문이다.
  assert.deepEqual(sent, [1, 2]);
  assert.deepEqual([...done], [1]);

  fail = false;
  sent.length = 0;
  const retry = rewards.map((reward) => ({ ...reward, registered: done.has(reward.id) }));
  await registerRewards(retry, register, (id) => done.add(id));
  assert.deepEqual(sent, [2, 3]);
  assert.deepEqual([...done], [1, 2, 3]);
});

test("결과를 모르는 실패만 uncertain으로 알려 화면이 그 리워드를 고치지 못하게 한다", async () => {
  const reward = { id: 5, name: "리워드5" };
  for (const [cause, uncertain] of [
    [new RewardCreationUncertainError(), true],
    [new RewardAlreadySubmittedError(), false],
    [new Error("확정 거절"), false],
  ]) {
    const error = await registerRewards(
      [reward],
      async () => {
        throw cause;
      },
      () => {},
    ).catch((caught) => caught);
    assert.ok(error instanceof RewardBatchError);
    assert.equal(error.rewardId, 5);
    assert.equal(error.uncertain, uncertain);
  }
});
