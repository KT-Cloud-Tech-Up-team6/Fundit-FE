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

export function validRecoveryIdentity(name: string, phone: string) {
  return Boolean(name.trim()) && /^01\d{8,9}$/.test(phone.replace(/-/g, ""));
}

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
    !/^\/(?:$|(?:projects|categories|search|live|my|seller|funding|support)(?:\/|$))/.test(
      url.pathname,
    )
  )
    return "/";
  return `${url.pathname}${url.search}${url.hash}`;
}
