import assert from "node:assert/strict";
import test from "node:test";
import { isKoreanMobilePhone, normalizeMobilePhoneInput } from "./korean-mobile-phone";

test("BE가 받는 휴대폰 번호를 통과시킨다(하이픈은 선택)", () => {
  for (const value of [
    "01012345678",
    "010-1234-5678",
    "0111234567",
    "011-123-4567",
    "01612345678",
    "01712345678",
    "01812345678",
    "01912345678",
    /* BE 정규식은 하이픈 위치를 따로 묻지 않아 섞어 써도 통과한다. */
    "010-12345678",
    "0101234-5678",
  ])
    assert.equal(isKoreanMobilePhone(value), true, value);
});

test("QA-061~063 값과 형식이 어긋난 번호를 거절한다", () => {
  for (const value of [
    "abc",
    "010123",
    "00000000000",
    "",
    /* 0121234567처럼 두 번째 자리가 016789가 아니면 BE가 거절한다. */
    "0121234567",
    "02012345678",
    "010123456789",
    "1012345678",
    "010-123-45678",
    "０１０１２３４５６７８",
  ])
    assert.equal(isKoreanMobilePhone(value), false, value);
});

test("앞뒤 공백·줄바꿈은 BE와 같이 거절한다", () => {
  for (const value of [" 01012345678", "01012345678 ", "01012345678\n"])
    assert.equal(isKoreanMobilePhone(value), false, JSON.stringify(value));
});

test("입력 칸은 숫자만 11자리까지 받는다", () => {
  assert.equal(normalizeMobilePhoneInput("010-1234-5678"), "01012345678");
  assert.equal(normalizeMobilePhoneInput(" 010 1234 5678 "), "01012345678");
  assert.equal(normalizeMobilePhoneInput("abc"), "");
  assert.equal(normalizeMobilePhoneInput("０１０"), "");
  assert.equal(normalizeMobilePhoneInput("0101234567890123"), "01012345678");
  // 붙여넣기한 하이픈 번호도 BE 형식을 통과한다
  assert.equal(isKoreanMobilePhone(normalizeMobilePhoneInput(" 010-1234-5678")), true);
});
