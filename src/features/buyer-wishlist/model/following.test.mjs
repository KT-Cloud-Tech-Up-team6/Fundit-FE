import assert from "node:assert/strict";
import test from "node:test";
import { followingName } from "./following.ts";

test("the following row prefers the nickname", () => {
  assert.equal(followingName({ sellerName: "홍길동", sellerNickname: "길동 공방" }), "길동 공방");
});

test("the following row falls back to the member name when the nickname is missing or blank", () => {
  assert.equal(followingName({ sellerName: "홍길동" }), "홍길동");
  assert.equal(followingName({ sellerName: " 홍길동 ", sellerNickname: "  " }), "홍길동");
});

test("the following row uses a generic label when both names are missing", () => {
  assert.equal(followingName({}), "판매자");
});
