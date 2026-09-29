import { ApiError } from "../../../shared/api/api-error";

type Query = Record<string, string | string[] | undefined>;

/* Toss가 successUrl/failUrl에 붙이는 쿼리를 해석한다.
   successUrl: ?paymentKey&orderId(=BE pgOrderId)&amount / failUrl: ?code&message&orderId */
export type PaymentResultParams =
  | { kind: "confirm"; paymentKey: string; orderId: string; amount: number }
  | { kind: "fail"; code: string; message: string; orderId?: string }
  | { kind: "invalid" }
  | { kind: "none" };

const text = (value: string | string[] | undefined) =>
  typeof value === "string" && value ? value : undefined;

export function parseResultParams(query: Query): PaymentResultParams {
  const paymentKey = text(query.paymentKey),
    orderId = text(query.orderId),
    amount = text(query.amount),
    code = text(query.code);
  if (paymentKey || amount) {
    // 브랜드페이(paymentType=BRANDPAY)는 별도 승인 API를 써야 하는데 BE는 일반 승인만 제공한다.
    // 잘못된 승인 경로로 보내지 않는다. 인증만 끝난 결제는 승인하지 않으면 청구되지 않는다.
    const paymentType = text(query.paymentType);
    if (paymentType && paymentType !== "NORMAL") return { kind: "invalid" };
    const value = Number(amount);
    return paymentKey &&
      orderId &&
      amount &&
      /^\d+$/.test(amount) &&
      Number.isSafeInteger(value) &&
      value > 0
      ? { kind: "confirm", paymentKey, orderId, amount: value }
      : { kind: "invalid" };
  }
  if (code)
    return { kind: "fail", code, message: (text(query.message) ?? "").slice(0, 200), orderId };
  return { kind: "none" };
}

export type PaymentOutcome = {
  message: string;
  /* retry: 결제를 다시 시도해도 이중 청구 위험이 없다. check: 결제 여부를 서버 상태로 먼저 확인해야 한다.
     recheck: 같은 paymentKey로 승인을 다시 확인한다(새 결제 아님). */
  next: "retry" | "check" | "recheck";
};

export function failureOutcome({
  code,
  message,
}: {
  code: string;
  message: string;
}): PaymentOutcome {
  return {
    message:
      code === "PAY_PROCESS_CANCELED"
        ? "결제를 취소했습니다."
        : message || "결제를 완료하지 못했습니다.",
    next: "retry",
  };
}

const confirmMessages: Record<string, PaymentOutcome> = {
  PAYMENT_AMOUNT_MISMATCH: {
    message: "결제 금액이 주문 금액과 달라 승인하지 못했습니다. 다시 결제해주세요.",
    next: "retry",
  },
  /* 토스 확정 거절(4xx)이다(BE #181, 요청서 BE-3). 결제는 FAILED로 끝나 청구되지 않고, 같은 주문으로
     결제를 다시 만들면 새 결제가 된다. 결과 불명(5xx·타임아웃·이미 처리된 결제)은 503으로 따로 온다. */
  PG_CONFIRM_FAILED: {
    message: "결제가 승인되지 않았습니다. 카드 한도·잔액 등을 확인한 뒤 다시 결제해주세요.",
    next: "retry",
  },
  PAYMENT_EXPIRED: {
    message: "결제 인증 유효 시간이 지났습니다. 다시 결제해주세요.",
    next: "retry",
  },
  PAYMENT_NOT_PENDING: {
    message: "이미 처리된 결제입니다. 참여 내역에서 주문 상태를 확인해주세요.",
    next: "check",
  },
};

/* BE #181은 확정 거절에 늘 `detail.tossErrorCode`를 싣는다. 그 전 BE는 detail 없이 타임아웃·이미 처리된
   결제까지 이 코드로 합쳤으므로(승인됐을 수 있음), detail이 없으면 재결제 대신 같은 결제를 재확인한다.
   거절 사유별 문구는 원본이 없어 코드를 문구에 쓰지 않는다. */
function isConfirmedRejection(error: ApiError) {
  const detail = error.detail;
  return (
    typeof detail === "object" &&
    detail !== null &&
    "tossErrorCode" in detail &&
    typeof detail.tossErrorCode === "string"
  );
}

export function confirmOutcome(error: unknown): PaymentOutcome {
  // 네트워크·5xx·응답 파싱 실패는 승인 여부를 알 수 없으므로 재결제를 권하지 않는다.
  if (
    error instanceof ApiError &&
    error.status < 500 &&
    Object.hasOwn(confirmMessages, error.code) &&
    (error.code !== "PG_CONFIRM_FAILED" || isConfirmedRejection(error))
  )
    return confirmMessages[error.code];
  return {
    message:
      "결제 결과를 확인하지 못했습니다. 결제 확인을 다시 시도하거나 참여 내역에서 확인해주세요.",
    next: "recheck",
  };
}

export function createAttemptOutcome(error: unknown): string {
  // 다른 탭·기기에서 먼저 결제를 끝낸 주문에 재진입하면 BE(PaymentCreateService)가 이 코드로 던진다.
  if (error instanceof ApiError && error.code === "CONFLICT")
    return "이미 결제가 완료된 주문입니다. 참여 내역에서 확인해주세요.";
  if (error instanceof ApiError && error.code === "FUNDING_NOT_PENDING")
    return "결제할 수 없는 주문입니다. 참여 내역에서 주문 상태를 확인해주세요.";
  if (error instanceof ApiError && error.status === 403) return "본인의 주문만 결제할 수 있습니다.";
  return "결제를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

/** 기한이 없는 주문(키 자체가 없는 옛 주문, entities/order/api/order-api.ts `paymentExpiresAt?`)은
    만료로 볼 근거가 없으니 만료 아님으로 본다. */
export function isPaymentExpired(paymentExpiresAt: string | undefined, now = Date.now()): boolean {
  if (!paymentExpiresAt) return false;
  return Date.parse(paymentExpiresAt) <= now;
}

export function isUserCancel(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "USER_CANCEL" || error.code === "PAY_PROCESS_CANCELED")
  );
}

export function paymentWindowErrorMessage(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    const message = error.message.trim();
    return message ? message.slice(0, 200) : null;
  }
  return null;
}
