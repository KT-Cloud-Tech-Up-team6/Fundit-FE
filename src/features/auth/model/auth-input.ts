import { z } from "zod";

export function passwordCategoryCount(value: string) {
  return [/\p{Uppercase}/u, /\p{Lowercase}/u, /\p{Nd}/u, /[^\p{L}\p{Nd}]/u].filter((pattern) =>
    pattern.test(value),
  ).length;
}

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .refine((value) => passwordCategoryCount(value) >= 3, {
    message: "대문자, 소문자, 숫자, 특수문자 중 3종 이상을 포함해 주세요.",
  });

export function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const middleEnd = digits.length === 10 ? 6 : 7;
  return `${digits.slice(0, 3)}-${digits.slice(3, middleEnd)}-${digits.slice(middleEnd)}`;
}

/* 휴대폰 번호 입력은 숫자만 받고 11자리까지 자른다. */
export function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

/* 하이픈 없는 국내 휴대폰 번호. BE는 전화번호 형식을 검사하지 않으므로 FE가 막는다. */
export function isValidPhone(phone: string) {
  return /^01\d{8,9}$/.test(phone);
}

export function validRecoveryIdentity(name: string, phone: string) {
  return Boolean(name.trim()) && isValidPhone(phone.replace(/-/g, ""));
}

/* 닉네임은 공백을 뗀 1~50자다(BE `@Size(max = 50)`). 일반 가입과 소셜 가입이 같이 쓴다. */
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "닉네임을 입력해 주세요.")
  .max(50, "50자 이하로 입력해 주세요.");

// 앱의 진입 경로만 허용한다. 이중 인코딩·역슬래시·auth 복귀 루프는 거부한다.
export function safeReturnTo(value: unknown) {
  if (
    typeof value !== "string" ||
    /[\\\s%]/.test(value.split(/[?#]/)[0]) ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return "/";
  const url = new URL(value, "https://fundit.invalid");
  if (url.origin !== "https://fundit.invalid") return "/";
  if (
    !/^\/(?:$|(?:projects|categories|search|live|my|seller|funding|payment|support)(?:\/|$))/.test(
      url.pathname,
    )
  )
    return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
