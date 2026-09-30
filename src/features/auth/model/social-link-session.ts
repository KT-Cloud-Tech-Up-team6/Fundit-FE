import type { SocialProvider } from "../api/auth-types";

import { safeReturnTo } from "./auth-input";

const STORAGE_KEY = "fundit-auth-social-link";
const TTL_MS = 10 * 60 * 1000;

export type SocialLinkSession = {
  expiresAt: number;
  /** 모바일 PortOne 콜백은 이 요청에서 만든 식별자만 수락한다. */
  identityVerificationId?: string;
  linkToken: string;
  provider: SocialProvider;
  returnTo: string;
};

function isSocialLinkSession(value: unknown): value is SocialLinkSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<SocialLinkSession>;
  return (
    typeof session.expiresAt === "number" &&
    (session.identityVerificationId === undefined ||
      (typeof session.identityVerificationId === "string" &&
        session.identityVerificationId.length > 0)) &&
    typeof session.linkToken === "string" &&
    session.linkToken.length > 0 &&
    (session.provider === "KAKAO" || session.provider === "GOOGLE") &&
    typeof session.returnTo === "string"
  );
}

function read() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSocialLinkSession(parsed) || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return { ...parsed, returnTo: safeReturnTo(parsed.returnTo) };
  } catch {
    return null;
  }
}

/* linkToken은 OAuth 콜백 뒤의 연동 화면과 모바일 PortOne 복귀 화면에서만 필요하다.
   주소에는 절대 싣지 않고, 탭 수명인 sessionStorage에 10분만 둔다. */
export function saveSocialLinkSession(payload: Omit<SocialLinkSession, "expiresAt">) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, expiresAt: Date.now() + TTL_MS }),
    );
    return true;
  } catch {
    return false;
  }
}

export function getSocialLinkSession() {
  return read();
}

export function clearSocialLinkSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // sessionStorage를 쓸 수 없는 환경에서는 복구할 값도 없다.
  }
}
