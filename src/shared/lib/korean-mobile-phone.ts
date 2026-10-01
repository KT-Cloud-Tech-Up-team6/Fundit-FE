/* BE 배송지·가입 배송지 연락처 검사와 같은 형식(BE PR #210, `^01[016789]-?\d{3,4}-?\d{4}$`, 하이픈 선택).
   BE는 값을 다듬지 않고 검사하므로 앞뒤 공백도 그대로 거절한다. 여기서도 trim하지 않는다. */
const KOREAN_MOBILE_PHONE = /^01[016789]-?\d{3,4}-?\d{4}$/;

export function isKoreanMobilePhone(value: string) {
  return KOREAN_MOBILE_PHONE.test(value);
}

/* 입력 칸용: 숫자만 남기고 11자리까지만 받는다. 하이픈 없는 형식도 BE가 받는다. */
export function normalizeMobilePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

/* 입력 칸 표시용: 숫자 문자열을 010-1234-5678(10자리는 011-123-4567) 형태로 나눈다(디자인 QA #528). */
export function formatMobilePhone(digits: string) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const middleEnd = digits.length === 10 ? 6 : 7;
  return `${digits.slice(0, 3)}-${digits.slice(3, middleEnd)}-${digits.slice(middleEnd)}`;
}

/* 저장된 연락처로 입력 칸을 열 때: 휴대폰 형식인 값만 숫자로 맞춘다. 형식이 틀린 값(예: 12자리)을 잘라 맞추면
   다른 번호로 바뀐 채 저장될 수 있어, 사용자가 고칠 때까지 그대로 두고 오류로 보인다(#528). */
export function initialMobilePhoneInput(value: string) {
  return isKoreanMobilePhone(value) ? normalizeMobilePhoneInput(value) : value;
}

/* 입력 칸 표시값: 숫자만 든 값은 하이픈으로 나누고, 형식이 틀린 채 저장된 값은 그대로 보인다. */
export function mobilePhoneInputDisplay(value: string) {
  return /^\d*$/.test(value) ? formatMobilePhone(value) : value;
}

/* 목록 표시용: 휴대폰 형식인 저장값만 하이픈 형태로 보이고, 그 밖의 값은 그대로 둔다. */
export function displayMobilePhone(value: string) {
  return isKoreanMobilePhone(value) ? formatMobilePhone(normalizeMobilePhoneInput(value)) : value;
}

/** 하이픈이 보이는 칸의 입력 이벤트(raw, 커서 caret)를 숫자 문자열 `value`로 만들고,
 *  입력 뒤 커서가 놓여야 할 곳을 "커서 앞 숫자 개수" `caret`으로 돌려준다.
 *  하이픈만 지워진 입력은 숫자가 그대로라 지워지지 않으므로, 하이픈 옆 숫자를 대신 지운다. */
export function editMobilePhone(current: string, raw: string, caret: number, inputType = "") {
  const typed = raw.slice(0, caret).replace(/\D/g, "").length;
  const next = normalizeMobilePhoneInput(raw);
  const deleting = inputType === "deleteContentBackward" || inputType === "deleteContentForward";
  if (deleting && next === current && raw.length < formatMobilePhone(current).length) {
    const cut = inputType === "deleteContentForward" ? typed : typed - 1;
    if (cut >= 0 && cut < current.length)
      return { value: current.slice(0, cut) + current.slice(cut + 1), caret: cut };
  }
  return { value: next, caret: Math.min(typed, next.length) };
}

/** 하이픈이 붙은 표시값에서 숫자 `count`개 바로 뒤의 커서 위치. */
export function caretAfterPhoneDigits(display: string, count: number) {
  let seen = 0;
  for (let i = 0; i < display.length && count > 0; i++) {
    if (display[i] !== "-" && ++seen === count) return i + 1;
  }
  return count > 0 ? display.length : 0;
}

export const invalidPhoneMessage = "휴대폰 번호 형식을 확인해 주세요.";
