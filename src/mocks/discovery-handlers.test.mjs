import test from "node:test";
import assert from "node:assert/strict";
import { setupServer } from "msw/node";
import { discoveryHandlers } from "./discovery-handlers.ts";
import { FIXTURE_PROJECT_ID } from "./fixtures.ts";

/* MSW 경로 변수는 `/`를 넘지 않아 `wishes/:projectId`가 `wishes/projects/{uuid}`를 받지 못한다.
   목업이 빠지면 요청이 그대로 통과해(bypass) 하트가 항상 실패하므로 두 경로를 함께 잠근다. */
test("공개 UUID 찜 목업은 숫자 id 찜과 상태를 공유하고 BE 상태코드를 따른다", async () => {
  const server = setupServer(...discoveryHandlers);
  server.listen({ onUnhandledRequest: "error" });
  const url = (id) => `http://mock.test/api/v1/wishes/projects/${id}`;

  try {
    const initial = await fetch(url(FIXTURE_PROJECT_ID));
    assert.equal(initial.status, 200);
    assert.deepEqual(await initial.json(), {
      projectPublicId: FIXTURE_PROJECT_ID,
      wished: true,
    });

    const removed = await fetch(url(FIXTURE_PROJECT_ID), { method: "DELETE" });
    assert.equal(removed.status, 204);
    assert.equal(await removed.text(), "");
    assert.equal((await (await fetch(url(FIXTURE_PROJECT_ID))).json()).wished, false);

    const added = await fetch(url(FIXTURE_PROJECT_ID), { method: "PUT" });
    assert.equal(added.status, 200);
    assert.deepEqual(await added.json(), { projectPublicId: FIXTURE_PROJECT_ID, wished: true });

    /* 스냅샷 없는 공개 id는 세 메서드 모두 404다(BE `WishService.projectIdOf`). */
    for (const method of ["GET", "PUT", "DELETE"]) {
      const missing = await fetch(url("99999999-9999-4999-8999-999999999999"), { method });
      assert.equal(missing.status, 404, method);
    }

    /* 숫자 id 경로를 UUID 경로가 가로채지 않는다. */
    const numeric = await fetch("http://mock.test/api/v1/wishes/7", { method: "PUT" });
    assert.deepEqual(await numeric.json(), { projectId: 7, wished: true });
  } finally {
    server.close();
  }
});
