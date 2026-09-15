import type { IdentityDraft } from "../api/auth-types";

const STORAGE_KEY = "fundit-auth-identity-recovery";
const TTL_MS = 10 * 60 * 1000;

type RecoverySession = {
  agreedTerms: string[];
  identityDraft: IdentityDraft;
  expiresAt: number;
};

function isIdentityDraft(value: unknown): value is IdentityDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Partial<IdentityDraft>;
  return (
    typeof draft.name === "string" &&
    typeof draft.birthDate === "string" &&
    typeof draft.phoneNumber === "string"
  );
}

function isRecoverySession(value: unknown): value is RecoverySession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Partial<RecoverySession>;
  return (
    Array.isArray(session.agreedTerms) &&
    session.agreedTerms.every((code) => typeof code === "string") &&
    isIdentityDraft(session.identityDraft) &&
    typeof session.expiresAt === "number"
  );
}

/* 모바일 PortOne 리다이렉트는 전체 페이지 이동이라 AuthFlowProvider(메모리)가 비워진다.
   콜백 라우트가 복구할 수 있도록 최소 정보만 만료 시각과 함께 잠깐 보관한다. */
export function saveIdentityRecoverySession(payload: {
  agreedTerms: string[];
  identityDraft: IdentityDraft;
}) {
  try {
    const session: RecoverySession = { ...payload, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // 세션 스토리지 접근 불가(프라이빗 모드 등)면 모바일 리다이렉트 복구를 포기한다.
  }
}

/* 1회성: 읽는 즉시 지운다. 스키마가 다르거나 만료됐으면 예상하지 않은 값을 신뢰하지 않고 버린다. */
export function consumeIdentityRecoverySession(): RecoverySession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecoverySession(parsed) || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearIdentityRecoverySession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 접근 불가 환경에서는 애초에 값도 없으므로 무시한다.
  }
}
