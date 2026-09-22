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
  /* retry: 결제를 다시 시도해도 이중 청구 위험이 없다. check: 결제 여부를 서버 상태로 먼저 확인해야 한다. */
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
  /* BE는 세션 만료를 뺀 Toss 4xx를 모두 이 코드로 합친다. 카드 거절뿐 아니라 이미 처리된 결제도 섞여
     있어 "결제되지 않았다"고 단정하지 않는다. 같은 pgOrderId 재사용은 Toss가 거르므로 재시도는 안전하다. */
  PG_CONFIRM_FAILED: {
    message:
      "결제 승인에 실패했습니다. 카드 한도·잔액 등을 확인하고 다시 시도해주세요. 같은 문제가 반복되면 참여 내역에서 결제 여부를 확인해주세요.",
    // BE가 카드 거절과 이미 처리된 결제를 같은 코드로 합치므로 새 결제 전에 같은 paymentKey를 재확인한다.
    next: "recheck",
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

export function confirmOutcome(error: unknown): PaymentOutcome {
  // 네트워크·5xx·응답 파싱 실패는 승인 여부를 알 수 없으므로 재결제를 권하지 않는다.
  if (error instanceof ApiError && error.status < 500 && Object.hasOwn(confirmMessages, error.code))
    return confirmMessages[error.code];
  return {
    message:
      "결제 결과를 확인하지 못했습니다. 결제 확인을 다시 시도하거나 참여 내역에서 확인해주세요.",
    next: "recheck",
  };
}

export function createAttemptOutcome(error: unknown): string {
  if (error instanceof ApiError && error.code === "FUNDING_NOT_PENDING")
    return "결제할 수 없는 주문입니다. 참여 내역에서 주문 상태를 확인해주세요.";
  if (error instanceof ApiError && error.status === 403) return "본인의 주문만 결제할 수 있습니다.";
  return "결제를 준비하지 못했습니다. 잠시 후 다시 시도해주세요.";
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
