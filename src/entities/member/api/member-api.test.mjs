import test from "node:test";
import assert from "node:assert/strict";
import {
  getAddresses,
  registerAddress,
  updateAddress,
  changeDefaultAddress,
  deleteAddress,
  getWishes,
  setWish,
} from "./member-api.ts";
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

test("배송지 수정·기본 지정·삭제는 BE 경로와 메서드를 그대로 쓴다", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, method: init.method, body: init.body });
    return init.method === "DELETE"
      ? new Response(null, { status: 204 })
      : Response.json({
          id: 7,
          recipientName: "수령인",
          phoneNumber: "01012345678",
          zipcode: "12345",
          addressLine1: "주소",
          addressLine2: "상세",
          isDefault: true,
        });
  };
  try {
    const updated = await updateAddress(7, {
      recipientName: "수령인",
      phoneNumber: "01012345678",
      zipcode: "12345",
      addressLine1: "주소",
      addressLine2: "상세",
      isDefault: true,
    });
    // 등록과 달리 수정·기본 지정 응답은 목록 항목 전체다.
    assert.equal(updated.isDefault, true);
    assert.equal(updated.addressLine1, "주소");
    await changeDefaultAddress(7);
    await deleteAddress(7);
    assert.deepEqual(
      calls.map((call) => `${call.method} ${call.url}`),
      [
        "PUT /api/v1/addresses/7",
        "PATCH /api/v1/addresses/7/default",
        "DELETE /api/v1/addresses/7",
      ],
    );
    assert.equal(JSON.parse(calls[0].body).isDefault, true);
    // 기본 지정은 본문 없이 보낸다.
    assert.equal(calls[1].body, undefined);
  } finally {
    globalThis.fetch = original;
  }
});

test("배송지 삭제 실패를 성공으로 바꾸지 않는다", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: "삭제 실패" }, { status: 500 });
  try {
    await assert.rejects(deleteAddress(7), /삭제 실패/);
  } finally {
    globalThis.fetch = original;
  }
});
