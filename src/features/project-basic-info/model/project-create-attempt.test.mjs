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

const idempotencyKey = (init) => new Headers(init?.headers).get("Idempotency-Key");

for (const failure of ["network", "server", "parse", "missing-id", "conflict"]) {
  test(`생성 결과 불확실(${failure}) 후 다시 저장하면 같은 키로 보내 서버가 만든 프로젝트를 되찾는다`, async (t) => {
    const session = storage();
    const keys = [];
    t.mock.method(globalThis, "fetch", async (_url, init) => {
      keys.push(idempotencyKey(init));
      if (keys.length > 1) return Response.json({ projectId: "created" }, { status: 200 });
      if (failure === "network") throw new TypeError("connection lost");
      if (failure === "server") return new Response("", { status: 503 });
      if (failure === "parse") return new Response("invalid json", { status: 201 });
      if (failure === "conflict") return Response.json({ code: "CONFLICT" }, { status: 409 });
      return Response.json({}, { status: 201 });
    });
    await assert.rejects(createProjectOnce(session, "owner"), ProjectCreationUncertainError);
    assert.equal(await createProjectOnce(session, "owner"), "created");
    assert.equal(keys.length, 2);
    assert.ok(keys[0]);
    assert.equal(keys[1], keys[0]);
  });
}

test("생성 ID를 보존하여 기본정보 저장 재시도에 재사용하고 계정별로 다른 키를 쓴다", async (t) => {
  const session = storage();
  const keys = [];
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    keys.push(idempotencyKey(init));
    return Response.json({ projectId: `id-${keys.length}` }, { status: 201 });
  });
  assert.equal(await createProjectOnce(session, "a"), "id-1");
  assert.equal(await createProjectOnce(session, "a"), "id-1");
  assert.equal(await createProjectOnce(session, "b"), "id-2");
  assert.equal(keys.length, 2);
  assert.notEqual(keys[0], keys[1]);
});

test("서버가 거절을 확정한 요청은 그 오류를 알리고, 다시 저장할 수 있다", async (t) => {
  const session = storage();
  let calls = 0;
  authTokenStore.set("test");
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return calls === 1
      ? new Response("", { status: 403 })
      : Response.json({ projectId: "created" }, { status: 201 });
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
