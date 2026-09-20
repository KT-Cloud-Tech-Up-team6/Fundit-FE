import test from "node:test";
import assert from "node:assert/strict";
import { createRewardOnce, RewardCreationUncertainError } from "./reward-create-attempt.ts";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
for (const mode of ["network", "503", "parse", "missing-id"])
  test("생성 결과 유실 후 재시도 차단 " + mode, async (t) => {
    const s = storage();
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => {
      calls++;
      if (mode === "network") throw new TypeError("lost");
      if (mode === "503") return new Response("", { status: 503 });
      if (mode === "parse") return new Response("invalid");
      return Response.json({});
    });
    await assert.rejects(createRewardOnce(s, "owner", "project", {}), RewardCreationUncertainError);
    await assert.rejects(createRewardOnce(s, "owner", "project", {}), RewardCreationUncertainError);
    assert.equal(calls, 1);
  });
test("확정 거절 뒤 재시도와 성공 뒤 다음 리워드 생성 허용", async (t) => {
  const s = storage();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () =>
    ++calls === 1 ? new Response("", { status: 403 }) : Response.json({ rewardId: calls }),
  );
  await assert.rejects(createRewardOnce(s, "owner", "project", {}), { status: 403 });
  assert.equal((await createRewardOnce(s, "owner", "project", {})).rewardId, 2);
  assert.equal((await createRewardOnce(s, "owner", "project", {})).rewardId, 3);
});
test("사용자 및 프로젝트별 불확실한 시도 분리", async (t) => {
  const s = storage();
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("lost");
  });
  await assert.rejects(createRewardOnce(s, "a", "p", {}));
  t.mock.method(globalThis, "fetch", async () => Response.json({ rewardId: 1 }));
  await createRewardOnce(s, "b", "p", {});
  await createRewardOnce(s, "a", "q", {});
  await assert.rejects(createRewardOnce(s, "a", "p", {}), RewardCreationUncertainError);
});
