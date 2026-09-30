import assert from "node:assert/strict";
import test from "node:test";
import { deleteProject } from "./seller-project-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("준비 중 프로젝트 삭제는 인증 DELETE 요청을 보낸다", async (t) => {
  authTokenStore.set("seller-token");
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "/api/v1/projects/project-uuid");
    assert.equal(init.method, "DELETE");
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer seller-token");
    return new Response(null, { status: 204 });
  });

  await deleteProject("project-uuid");
});
