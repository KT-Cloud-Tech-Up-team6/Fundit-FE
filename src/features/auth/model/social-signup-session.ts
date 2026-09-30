import type { SocialProvider } from "../api/auth-types";

import type { SocialAuthEntry } from "./social-auth-session";

const STORAGE_KEY = "fundit-auth-social-signup";
const TTL_MS = 10 * 60 * 1000;

/* 콜백이 미가입(needsSignup)으로 판정한 뒤 가입 화면이 이어받는 정보다. BE의 signupToken 유효 시간과
   같은 10분이고 URL에는 싣지 않는다. 새로고침해도 폼이 이어지도록 읽기만 하고, 제출 직전에 지운다. */
export type SocialSignupSession = {
  /* 가입 화면에서 진입했다면 OAuth 앞에서 받은 동의 코드, 로그인 화면 진입이면 빈 배열(가입 화면에서 받는다). */
  agreedTerms: string[];
  /* 제공자가 이메일을 주지 않으면(카카오 미동의) null이라 가입 화면에서 직접 받는다. */
  email: string | null;
  entry: SocialAuthEntry;
  expiresAt: number;
  /* 구글은 프로필 이름, 카카오는 닉네임이다. 어느 칸에 채울지는 제공자마다 다르다. */
  name: string | null;
  provider: SocialProvider;
  signupToken: string;
};

function isSocialSignupSession(value: unknown): value is SocialSignupSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<SocialSignupSession>;
  return (
    Array.isArray(session.agreedTerms) &&
    session.agreedTerms.every((code) => typeof code === "string") &&
    (session.email === null || typeof session.email === "string") &&
    (session.entry === "login" || session.entry === "signup") &&
    typeof session.expiresAt === "number" &&
    (session.name === null || typeof session.name === "string") &&
    (session.provider === "KAKAO" || session.provider === "GOOGLE") &&
    typeof session.signupToken === "string" &&
    session.signupToken.length > 0
  );
}

export function saveSocialSignupSession(payload: Omit<SocialSignupSession, "expiresAt">) {
  try {
    const session: SocialSignupSession = { ...payload, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    // 세션 스토리지 접근 불가(프라이빗 모드 등)면 가입 화면이 이어받을 수 없다.
    return false;
  }
}

/* 지우지 않고 읽는다. 스키마가 다르거나 만료됐으면 버리고 null을 돌려준다. */
export function readSocialSignupSession(): SocialSignupSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSocialSignupSession(parsed) || parsed.expiresAt < Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/* 가입 화면에서 약관에 동의하면(로그인 진입) 새로고침해도 다시 묻지 않도록 동의 코드를 덧붙인다. */
export function saveSocialSignupAgreedTerms(agreedTerms: string[]) {
  const current = readSocialSignupSession();
  if (!current) return false;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, agreedTerms }));
    return true;
  } catch {
    return false;
  }
}

export function clearSocialSignupSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 접근 불가 환경에서는 애초에 값도 없으므로 무시한다.
  }
}
