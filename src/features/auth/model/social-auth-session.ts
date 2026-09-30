import type { SocialProvider } from "../api/auth-types";

import { safeReturnTo } from "./auth-input";

const STORAGE_KEY = "fundit-auth-social";
const TTL_MS = 10 * 60 * 1000;

export type SocialAuthEntry = "login" | "signup";

export type SocialAuthSession = {
  /* 가입 화면에서 진입할 때만 채운다. 약관을 OAuth 앞에서 받는다(Figma 회원가입 플로우). */
  agreedTerms: string[];
  entry: SocialAuthEntry;
  expiresAt: number;
  provider: SocialProvider;
  returnTo: string;
  /* BE는 state를 검증하지 않는다. CSRF 방어는 FE가 이 값을 콜백에서 대조해서 한다. */
  state: string;
};

function isSocialAuthSession(value: unknown): value is SocialAuthSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<SocialAuthSession>;
  return (
    Array.isArray(session.agreedTerms) &&
    session.agreedTerms.every((code) => typeof code === "string") &&
    (session.entry === "login" || session.entry === "signup") &&
    typeof session.expiresAt === "number" &&
    (session.provider === "KAKAO" || session.provider === "GOOGLE") &&
    typeof session.returnTo === "string" &&
    typeof session.state === "string" &&
    session.state.length > 0
  );
}

/* OAuth는 전체 페이지 이동이라 메모리 상태(AuthFlowProvider)가 비워진다. 콜백이 복구할 수 있도록
   만료 시각과 함께 잠깐 보관한다. 토큰이 아니라 진입 맥락뿐이다. */
export function saveSocialAuthSession(payload: Omit<SocialAuthSession, "expiresAt">) {
  try {
    const session: SocialAuthSession = { ...payload, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return true;
  } catch {
    // 세션 스토리지 접근 불가(프라이빗 모드 등)면 state를 대조할 수 없어 OAuth를 시작하지 않는다.
    return false;
  }
}

/* 1회성: 읽는 즉시 지운다. 스키마가 다르거나 만료됐으면 예상하지 않은 값을 신뢰하지 않고 버린다. */
export function consumeSocialAuthSession(): SocialAuthSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSocialAuthSession(parsed) || parsed.expiresAt < Date.now()) return null;
    // 저장 때 걸러도 저장소 값은 신뢰하지 않는다. 읽을 때 한 번 더 허용 경로로 좁힌다.
    return { ...parsed, returnTo: safeReturnTo(parsed.returnTo) };
  } catch {
    return null;
  }
}
