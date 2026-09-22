/* Toss 복귀 URL의 orderId는 pgOrderId라 주문 UUID를 알 수 없다. 결제 화면에서 잠깐 기억해
   실패 후 "다시 결제하기"를 복원하고, 승인 직후 주문 상태가 아직 PENDING인 동안 재결제 진입을 막는다.
   저장소 접근 실패(사생활 보호 모드 등)는 기능 저하로만 다루고 흐름을 막지 않는다. */
type Store = Pick<Storage, "getItem" | "setItem">;

const attemptKey = (pgOrderId: string) => `fundit-payment-attempt:${pgOrderId}`;
const confirmedKey = (orderId: string) => `fundit-payment-confirmed:${orderId}`;
const lastAttemptKey = "fundit-payment-last-attempt";

function safe<T>(run: () => T, fallback: T): T {
  try {
    return run();
  } catch {
    return fallback;
  }
}

/* `sessionStorage`/`localStorage` 식별자 접근 자체가 던지는 환경이 있어 호출 지점에서 직접 참조하지 않는다. */
export function sessionStore(): Store {
  return safe<Store>(() => window.sessionStorage, {
    getItem: () => null,
    setItem: () => undefined,
  });
}

/* 결제 완료 여부는 탭이 아니라 주문에 속한 사실이라 같은 기기의 다른 탭에서도 재결제를 막으려면
   `localStorage`에 둔다. pgOrderId↔주문 UUID 매핑(복귀 URL 복원용)은 탭 범위가 맞아 sessionStorage에 남긴다. */
export function localStore(): Store {
  return safe<Store>(() => window.localStorage, {
    getItem: () => null,
    setItem: () => undefined,
  });
}

export const rememberAttempt = (store: Store, pgOrderId: string, orderId: string, amount: number) =>
  safe(() => {
    store.setItem(attemptKey(pgOrderId), JSON.stringify({ orderId, amount }));
    store.setItem(lastAttemptKey, orderId);
  }, undefined);

function recalledAttempt(store: Store, pgOrderId: string) {
  return safe(() => {
    const value = store.getItem(attemptKey(pgOrderId));
    if (!value) return null;
    // 이전 탭에서 만든 시도는 주문 UUID만 저장돼 있을 수 있다. 재결제 링크는 계속 복원하되 금액 대조만 건너뛴다.
    try {
      const parsed: unknown = JSON.parse(value);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "orderId" in parsed &&
        typeof parsed.orderId === "string" &&
        "amount" in parsed &&
        typeof parsed.amount === "number" &&
        Number.isSafeInteger(parsed.amount)
      )
        return { orderId: parsed.orderId, amount: parsed.amount };
    } catch {
      return { orderId: value, amount: null };
    }
    return null;
  }, null);
}

export const recallAttempt = (store: Store, pgOrderId: string) =>
  recalledAttempt(store, pgOrderId)?.orderId ?? null;

export const recallAttemptAmount = (store: Store, pgOrderId: string) =>
  recalledAttempt(store, pgOrderId)?.amount ?? null;

/* 사용자가 결제창을 닫으면(PAY_PROCESS_CANCELED) Toss는 failUrl에 orderId를 붙이지 않는다.
   그때는 pgOrderId로 찾을 수 없으니 가장 최근 시도로 복원한다. 링크만 만들고 재진입 때 다시 검증한다. */
export const recallLastAttempt = (store: Store) => safe(() => store.getItem(lastAttemptKey), null);

/* 승인 직후 주문 상태가 반영되기를 기다리는 동안만 쓰는 표시다. 반영이 끝내 오지 않으면 이 표시가
   남아 재결제도 재시도도 영영 막으므로 유효기간을 둔다. 지난 값(숫자가 아닌 과거 형식 포함)은
   만료로 보고 주문 상태를 다시 따른다. */
const confirmedTtlMs = 60 * 60 * 1000;

export const markConfirmed = (store: Store, orderId: string, now = Date.now()) =>
  safe(() => store.setItem(confirmedKey(orderId), String(now)), undefined);

export const isConfirmed = (store: Store, orderId: string, now = Date.now()) =>
  safe(() => {
    const markedAt = Number(store.getItem(confirmedKey(orderId)));
    return markedAt > 0 && now - markedAt < confirmedTtlMs;
  }, false);
