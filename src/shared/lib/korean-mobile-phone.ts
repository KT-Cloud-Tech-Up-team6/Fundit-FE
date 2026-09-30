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

export const invalidPhoneMessage = "휴대폰 번호 형식을 확인해 주세요.";
