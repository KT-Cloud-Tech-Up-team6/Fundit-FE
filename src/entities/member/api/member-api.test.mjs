import test from "node:test";
import assert from "node:assert/strict";
import { getAddresses, registerAddress, getWishes, setWish } from "./member-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("회원 요청은 현재 토큰을 사용하고 배송지 기본값을 임의로 변경하지 않는다", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return Response.json(
      url.includes("wishes") ? { content: [], totalElements: 0, hasNext: false } : [],
    );
  };
  try {
    authTokenStore.set("first");
    await getAddresses();
    authTokenStore.set("second");
    await getWishes(2);
    await registerAddress({
      recipientName: "수령인",
      phoneNumber: "01012345678",
      zipcode: "12345",
      addressLine1: "주소",
      addressLine2: "",
      isDefault: false,
    });
    assert.equal(calls[0].init.headers.get("Authorization"), "Bearer first");
    assert.equal(calls[1].init.headers.get("Authorization"), "Bearer second");
    assert.equal(calls[1].url, "/api/v1/wishes?page=2&size=20");
    assert.equal(JSON.parse(calls[2].init.body).isDefault, false);
    assert.equal(calls[2].init.method, "POST");
  } finally {
    globalThis.fetch = original;
    authTokenStore.clear();
  }
});

test("찜 해제 204를 처리하고 등록 실패를 성공으로 바꾸지 않는다", async () => {
  const original = globalThis.fetch;
  const methods = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(url, "/api/v1/wishes/731");
    methods.push(init.method);
    return init.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({ message: "실패" }, { status: 500 });
  };
  try {
    await setWish(731, false);
    await assert.rejects(setWish(731, true), /실패/);
    assert.deepEqual(methods, ["DELETE", "PUT"]);
  } finally {
    globalThis.fetch = original;
  }
});
