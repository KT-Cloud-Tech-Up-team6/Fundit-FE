import type { SocialProvider } from "../api/auth-types";

export const providerLabel: Record<SocialProvider, string> = { GOOGLE: "구글", KAKAO: "카카오" };

/* 409 SOCIAL_ACCOUNT_EXISTS의 `detail.provider`는 기계가 읽는 값이다. 지금 시도한 제공자가 아니라
   이미 가입돼 있는 제공자를 가리킨다. 모양이 다르면 null로 돌려 호출자가 현재 제공자로 대신한다. */
export function existingProvider(detail: unknown): SocialProvider | null {
  if (typeof detail !== "object" || detail === null || !("provider" in detail)) return null;
  return detail.provider === "KAKAO" || detail.provider === "GOOGLE" ? detail.provider : null;
}
