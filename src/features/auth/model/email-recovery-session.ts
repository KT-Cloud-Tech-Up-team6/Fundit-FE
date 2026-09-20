const KEY = "fundit-email-recovery";
type Session = {
  identityVerificationId: string;
  name: string;
  phoneNumber: string;
  expiresAt: number;
};

export function saveEmailRecoverySession(session: Omit<Session, "expiresAt">) {
  // 콜백 상관관계가 없으면 복구를 진행하지 않는다. 저장 실패도 호출자에게 전달한다.
  sessionStorage.setItem(
    KEY,
    JSON.stringify({ ...session, expiresAt: Date.now() + 10 * 60 * 1000 }),
  );
}

export function clearEmailRecoverySession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* 저장 불가 환경. */
  }
}

export function consumeEmailRecoverySession(id: string): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<Session>;
    if (
      session.identityVerificationId !== id ||
      typeof session.name !== "string" ||
      typeof session.phoneNumber !== "string" ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Date.now()
    )
      return null;
    return session as Session;
  } catch {
    return null;
  }
}
