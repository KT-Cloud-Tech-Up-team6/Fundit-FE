import assert from "node:assert/strict";
import test from "node:test";
import { isPublicUuid } from "./public-uuid";

test("실제 BE가 발급하는 UUIDv7을 통과시킨다", () => {
  /* 이 검사가 이 파일의 이유다. 버전 자리를 [1-5]로 제한하면 여기서 실패한다 — #269·#276에서
     시청 화면과 판매자 콘솔이 각각 그 제한 때문에 실제 LIVE ID를 전부 404로 떨어뜨렸다. */
  assert.equal(isPublicUuid("0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d"), true);
});

test("버전·변형 자리를 가리지 않고 형식만 본다", () => {
  for (const value of [
    "11111111-2222-4333-8444-555555555555",
    "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d",
    "00000000-0000-0000-0000-000000000000",
    "ffffffff-ffff-ffff-ffff-ffffffffffff",
    "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
  ]) {
    assert.equal(isPublicUuid(value), true);
  }
});

test("형식이 어긋나면 받지 않는다", () => {
  for (const value of [
    undefined,
    null,
    "",
    "   ",
    42,
    "demo-live",
    "../admin",
    "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d ",
    " 0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d",
    "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d?tab=story",
    "0199c3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0",
    "0199c3a0-1b2c-7a3b-8c4d5e6f7a8b9c0d",
    "0199c3a01b2c7a3b8c4d5e6f7a8b9c0d",
    "0199g3a0-1b2c-7a3b-8c4d-5e6f7a8b9c0d",
  ]) {
    assert.equal(isPublicUuid(value), false);
  }
});
