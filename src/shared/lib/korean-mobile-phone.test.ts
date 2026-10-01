import assert from "node:assert/strict";
import test from "node:test";
import {
  caretAfterPhoneDigits,
  displayMobilePhone,
  editMobilePhone,
  formatMobilePhone,
  initialMobilePhoneInput,
  isKoreanMobilePhone,
  mobilePhoneInputDisplay,
  normalizeMobilePhoneInput,
} from "./korean-mobile-phone";

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

test("입력 칸은 숫자를 하이픈으로 나눠 보인다(#528)", () => {
  assert.equal(formatMobilePhone(""), "");
  assert.equal(formatMobilePhone("010"), "010");
  assert.equal(formatMobilePhone("0101"), "010-1");
  assert.equal(formatMobilePhone("0101234"), "010-1234");
  assert.equal(formatMobilePhone("01012345"), "010-1234-5");
  assert.equal(formatMobilePhone("0111234567"), "011-123-4567");
  assert.equal(formatMobilePhone("01012345678"), "010-1234-5678");
});

test("목록은 휴대폰 형식인 값만 하이픈으로 보이고 나머지는 그대로 둔다", () => {
  assert.equal(displayMobilePhone("01012345678"), "010-1234-5678");
  assert.equal(displayMobilePhone("010-1234-5678"), "010-1234-5678");
  assert.equal(displayMobilePhone("0101234-5678"), "010-1234-5678");
  assert.equal(displayMobilePhone("abc"), "abc");
  assert.equal(displayMobilePhone("010123"), "010123");
});

test("하이픈 칸의 입력을 숫자 문자열과 커서 앞 숫자 개수로 바꾼다", () => {
  // 끝에 숫자를 입력하면 하이픈은 다시 붙고 커서는 마지막 숫자 뒤에 둔다
  assert.deepEqual(editMobilePhone("0101", "010-12", 6, "insertText"), {
    value: "01012",
    caret: 5,
  });
  // 붙여넣은 하이픈·공백은 지운다
  assert.deepEqual(editMobilePhone("", " 010-1234-5678", 14, "insertFromPaste"), {
    value: "01012345678",
    caret: 11,
  });
  // 하이픈 바로 뒤에서 지우면(지운 뒤 커서는 3) 하이픈 앞 숫자를 지운다
  assert.deepEqual(editMobilePhone("01012345678", "0101234-5678", 3, "deleteContentBackward"), {
    value: "0112345678",
    caret: 2,
  });
  // 하이픈 바로 앞에서 Delete를 누르면 하이픈 뒤 숫자를 지운다
  assert.deepEqual(editMobilePhone("01012345678", "0101234-5678", 3, "deleteContentForward"), {
    value: "0102345678",
    caret: 3,
  });
  // 가운데 숫자를 지우면 그 숫자만 빠지고 커서는 제자리다
  assert.deepEqual(editMobilePhone("01012345678", "010-124-5678", 6, "deleteContentBackward"), {
    value: "0101245678",
    caret: 5,
  });
});

test("하이픈 표시값에서 숫자 개수로 커서 위치를 찾는다", () => {
  assert.equal(caretAfterPhoneDigits("010-1234-5678", 0), 0);
  assert.equal(caretAfterPhoneDigits("010-1234-5678", 3), 3);
  assert.equal(caretAfterPhoneDigits("010-1234-5678", 4), 5);
  assert.equal(caretAfterPhoneDigits("010-1234-5678", 11), 13);
  assert.equal(caretAfterPhoneDigits("010", 5), 3);
});

test("저장된 연락처는 형식이 맞을 때만 숫자로 맞추고, 틀린 값은 잘라 바꾸지 않는다", () => {
  assert.equal(initialMobilePhoneInput("010-1234-5678"), "01012345678");
  assert.equal(initialMobilePhoneInput("01012345678"), "01012345678");
  // 12자리를 11자리로 자르면 다른 번호가 되므로 그대로 둔다
  assert.equal(initialMobilePhoneInput("010123456789"), "010123456789");
  assert.equal(initialMobilePhoneInput("abc"), "abc");
  assert.equal(initialMobilePhoneInput("010-123-456"), "010-123-456");
});

test("입력 칸 표시값은 숫자만 든 값만 하이픈으로 나눈다", () => {
  assert.equal(mobilePhoneInputDisplay("01012345678"), "010-1234-5678");
  assert.equal(mobilePhoneInputDisplay(""), "");
  assert.equal(mobilePhoneInputDisplay("abc"), "abc");
  assert.equal(mobilePhoneInputDisplay("010-123-456"), "010-123-456");
});
