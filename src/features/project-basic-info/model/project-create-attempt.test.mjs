import assert from "node:assert/strict";
import test from "node:test";
import { createProjectOnce, ProjectCreationUncertainError } from "./project-create-attempt.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

function storage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

for (const failure of ["network", "server", "parse", "missing-id"]) {
  test(`생성 결과 불확실(${failure}) 후 재진입해도 POST를 반복하지 않는다`, async (t) => {
    const session = storage();
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => {
      calls++;
      if (failure === "network") throw new TypeError("connection lost");
      if (failure === "server") return new Response("", { status: 503 });
      if (failure === "parse") return new Response("invalid json");
      return Response.json({});
    });
    await assert.rejects(createProjectOnce(session, "owner"), ProjectCreationUncertainError);
    await assert.rejects(createProjectOnce(session, "owner"), ProjectCreationUncertainError);
    assert.equal(calls, 1);
  });
}

test("생성 ID를 보존하여 기본정보 저장 재시도에 재사용하고 계정별로 분리한다", async (t) => {
  const session = storage();
  let calls = 0;
  t.mock.method(globalThis, "fetch", async () => Response.json({ projectId: `id-${++calls}` }));
  assert.equal(await createProjectOnce(session, "a"), "id-1");
  assert.equal(await createProjectOnce(session, "a"), "id-1");
  assert.equal(await createProjectOnce(session, "b"), "id-2");
  assert.equal(calls, 2);
});

test("명확한 요청 거절은 수정 후 재시도할 수 있다", async (t) => {
  const session = storage();
  let calls = 0;
  authTokenStore.set("test");
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1
      ? new Response("", { status: 403 })
      : Response.json({ projectId: "created" });
  });
  await assert.rejects(createProjectOnce(session, "owner"), { status: 403 });
  assert.equal(await createProjectOnce(session, "owner"), "created");
});

test("저장소를 사용할 수 없으면 생성 요청 전에 중단한다", async (t) => {
  const session = storage();
  session.setItem = () => {
    throw new Error("storage unavailable");
  };
  const request = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  await assert.rejects(createProjectOnce(session, "owner"), /storage unavailable/);
  assert.equal(request.mock.callCount(), 0);
});
