import assert from "node:assert/strict";
import test from "node:test";
import {
  addAmount,
  caretAfterDigits,
  convertDiscount,
  digitInput,
  discountedPrice,
  discountError,
  editDigits,
  emptyReward,
  formatDigits,
  positiveInteger,
  rewardError,
  upsertReward,
} from "./basic-info-demo.ts";

test("목표 금액 증액은 정수 범위에서만 반영한다", () => {
  assert.equal(addAmount("", 500000), "500000");
  assert.equal(addAmount("500000", 100000), "600000");
  assert.equal(addAmount(String(Number.MAX_SAFE_INTEGER), 100000), String(Number.MAX_SAFE_INTEGER));
  for (const value of ["-1", "1.5", "abc", "", "0"]) assert.equal(positiveInteger(value), false);
});

test("리워드는 이름과 양의 정수 가격 및 제한 수량을 검증한다", () => {
  const draft = { ...emptyReward(), name: "  기본 패키지  ", price: "39000" };
  assert.equal(rewardError(draft), "");
  assert.notEqual(rewardError({ ...draft, name: " " }), "");
  assert.notEqual(rewardError({ ...draft, price: "-1" }), "");
  assert.notEqual(rewardError({ ...draft, limited: true, quantity: "0" }), "");
  assert.equal(rewardError({ ...draft, limited: true, quantity: "100" }), "");
});

test("리워드 수정은 중복 추가하지 않고 옵션과 제한 여부를 보존한다", () => {
  const draft = {
    ...emptyReward(),
    name: "패키지",
    price: "29000",
    discount: true,
    discountValue: "5000",
    options: true,
    limited: true,
    quantity: "100",
  };
  const added = upsertReward([], draft, 3);
  const edited = upsertReward(added, { ...draft, name: "수정", limited: false }, 3);
  assert.equal(edited.length, 1);
  assert.equal(edited[0].name, "수정");
  assert.equal(edited[0].quantity, "");
  assert.equal(edited[0].discount, true);
  assert.equal(edited[0].options, true);
  assert.equal(added[0].name, "패키지");
  assert.equal(upsertReward(added, emptyReward(), 4), added);
});

test("할인 단위 환산과 판매가를 계산한다", () => {
  assert.equal(convertDiscount("5000", "won", "percent", "29000"), "17");
  assert.equal(convertDiscount("10", "percent", "won", "29000"), "2900");
  const reward = { ...emptyReward(), price: "29000", discount: true, discountValue: "5000" };
  assert.equal(discountedPrice(reward), 24000);
  assert.notEqual(rewardError({ ...reward, discountValue: "29000" }), "");
});

test("정률 할인은 0~99%, 정액은 1원 이상 가격 미만만 허용한다(BE와 같음, QA-156)", () => {
  const rate = { ...emptyReward(), price: "1000", discount: true, discountUnit: "percent" };
  const rangeMessage = "할인율은 0~99%로 입력해주세요.";
  for (const value of ["0", "1", "99"])
    assert.equal(discountError({ ...rate, discountValue: value }), "");
  for (const value of ["100", "101", "1.5"])
    assert.equal(discountError({ ...rate, discountValue: value }), rangeMessage);
  assert.equal(discountError({ ...rate, discountValue: "" }), "할인 값을 입력해주세요.");
  assert.equal(rewardError({ ...rate, name: "패키지", discountValue: "100" }), rangeMessage);
  assert.equal(rewardError({ ...rate, name: "패키지", discountValue: "99" }), "");
  const won = { ...rate, discountUnit: "won" };
  assert.equal(discountError({ ...won, discountValue: "999" }), "");
  const wonMessage = "할인 금액은 1원 이상, 리워드 가격 미만으로 입력해주세요.";
  for (const value of ["1000", "0"])
    assert.equal(discountError({ ...won, discountValue: value }), wonMessage);
  assert.equal(discountError({ ...won, discountValue: "" }), "할인 값을 입력해주세요.");
  // 가격을 아직 못 읽을 때(비어 있음)는 가격 오류만 보이도록 할인 문구를 띄우지 않는다.
  assert.equal(discountError({ ...won, price: "", discountValue: "500" }), "");
  assert.equal(discountError({ ...rate, discount: false, discountValue: "100" }), "");
  // 화면에서는 digitInput이 앞자리 0을 먼저 지우므로 "099"는 99, "00"은 0, "0100"은 100으로 검사된다.
  const typed = (raw) => discountError({ ...rate, discountValue: digitInput(raw) });
  assert.equal(typed("099"), "");
  assert.equal(typed("00"), "");
  assert.equal(typed("0100"), rangeMessage);
});

test("할인 단위 환산과 판매가는 BE처럼 할인액을 버림한다(QA-156)", () => {
  assert.equal(convertDiscount("996", "won", "percent", "1000"), "99"); // 반올림이면 100
  assert.equal(convertDiscount("29", "won", "percent", "100"), "29"); // 29/100*100은 28이 된다
  assert.equal(convertDiscount("4", "won", "percent", "1000"), "0");
  assert.equal(convertDiscount("99", "percent", "won", "10"), "9"); // 반올림이면 10(가격과 같음)
  const price = (value, unit, base) =>
    discountedPrice({
      ...emptyReward(),
      price: base,
      discount: true,
      discountValue: value,
      discountUnit: unit,
    });
  assert.equal(price("99", "percent", "1"), 1);
  assert.equal(price("99", "percent", "49"), 1); // 반올림이면 0원
  assert.equal(price("15", "percent", "29950"), 25458); // 반올림이면 25457
  assert.equal(price("0", "percent", "1000"), 1000);
});

test("숫자 입력은 쉼표와 앞자리 0을 지우고 숫자가 아닌 글자는 거부한다", () => {
  assert.equal(digitInput(""), "");
  assert.equal(digitInput(","), "");
  assert.equal(digitInput("0"), "0");
  assert.equal(digitInput("000"), "0");
  assert.equal(digitInput("000500000"), "500000");
  assert.equal(digitInput("500000"), "500000");
  assert.equal(digitInput("500,000"), "500000");
  assert.equal(digitInput("5,00,0"), "5000");
  assert.equal(digitInput("1,00"), "100"); // 쉼표 위치가 틀려도 숫자만 남긴다
  assert.equal(digitInput("9".repeat(16)), "9".repeat(16));
  assert.equal(digitInput("9".repeat(17)), null);
  assert.equal(digitInput("0".repeat(30) + "5"), "5"); // 길이는 앞자리 0을 지운 뒤 센다
  for (const value of ["-1", "1.5", "abc", " 5"]) assert.equal(digitInput(value), null);
});

test("숫자 문자열에 천 단위 쉼표를 붙인다", () => {
  assert.equal(formatDigits(""), "");
  assert.equal(formatDigits("999"), "999");
  assert.equal(formatDigits("1000"), "1,000");
  assert.equal(formatDigits("500000"), "500,000");
  assert.equal(formatDigits("1234567"), "1,234,567");
});

test("쉼표만 지워지는 입력은 쉼표 옆 숫자를 대신 지우고 커서를 숫자 개수로 돌려준다", () => {
  // 표시값 `1,234,567`에서 쉼표(인덱스 1)를 Backspace로 지우면 raw `1234,567`, 커서 1
  assert.deepEqual(editDigits("1234567", "1234,567", 1, "deleteContentBackward"), {
    value: "234567",
    caret: 0,
  });
  // 같은 쉼표를 Delete로 지우면 쉼표 뒤 숫자가 지워진다
  assert.deepEqual(editDigits("1234567", "1234,567", 1, "deleteContentForward"), {
    value: "134567",
    caret: 1,
  });
  // 숫자를 지우는 입력은 그대로 처리하고, 커서는 지운 자리에 남는다
  assert.deepEqual(editDigits("1234567", "1,24,567", 3, "deleteContentBackward"), {
    value: "124567",
    caret: 2,
  });
  // 끝에 쳐서 쉼표가 새로 생겨도 커서는 입력한 숫자 뒤다
  assert.deepEqual(editDigits("999", "9999", 4, "insertText"), { value: "9999", caret: 4 });
  // `1,234`를 전체 선택하고 같은 숫자 `1234`를 붙여넣어도 값은 그대로다(삭제가 아니다)
  assert.deepEqual(editDigits("1234", "1234", 4, "insertFromPaste"), { value: "1234", caret: 4 });
  assert.deepEqual(editDigits("1234", "1234", 4, "insertReplacementText"), {
    value: "1234",
    caret: 4,
  });
  // 앞자리 0은 지워지고 커서 앞 숫자도 그만큼 줄어든다
  assert.deepEqual(editDigits("500", "0500", 1, "insertText"), { value: "500", caret: 0 });
  assert.deepEqual(editDigits("", "0", 1, "insertText"), { value: "0", caret: 1 });
  // 거부된 입력은 value가 null이고 커서는 입력 전 자리로 돌아간다
  assert.deepEqual(editDigits("1234", "1,2a34", 4, "insertText"), { value: null, caret: 2 });
  assert.deepEqual(editDigits("9".repeat(16), "9".repeat(17), 17, "insertText"), {
    value: null,
    caret: 16,
  });
});

test("숫자 개수 뒤의 커서 위치를 쉼표가 붙은 표시값에서 찾는다", () => {
  assert.equal(caretAfterDigits("1,234,567", 0), 0);
  assert.equal(caretAfterDigits("1,234,567", 1), 1);
  assert.equal(caretAfterDigits("1,234,567", 2), 3);
  assert.equal(caretAfterDigits("1,234,567", 4), 5);
  assert.equal(caretAfterDigits("1,234,567", 7), 9);
  assert.equal(caretAfterDigits("1,234,567", 99), 9);
  assert.equal(caretAfterDigits("", 3), 0);
});
