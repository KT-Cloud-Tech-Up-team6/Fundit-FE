import { ApiError } from "../../../shared/api/api-error";
import {
  createOrder,
  getOrder,
  orderStatusLabels,
  type OrderCreated,
  type OrderRequest,
} from "../../../entities/order/api/order-api";

export class OrderAttemptError extends Error {}

/** 서버가 주문 생성을 확정적으로 거절했다. 주문은 만들어지지 않았다(#387). `code`는 BE 오류 코드다. */
export class OrderRejectedError extends OrderAttemptError {
  constructor(readonly code: string) {
    super(rejectedOrderMessage(code));
  }
}

/* BE 메시지에는 `rewardId=…`·`couponCode=…` 같은 내부 값이 있어 코드별 문구를 쓴다
   (BE OrderCreateService·OrderPricingService가 주문 생성에서 던지는 코드). */
function rejectedOrderMessage(code: string) {
  switch (code) {
    case "INSUFFICIENT_STOCK":
      return "남은 수량이 부족한 리워드가 있어 주문하지 못했습니다. 수량을 확인해주세요.";
    case "COUPON_BUDGET_EXCEEDED":
    case "COUPON_EXHAUSTED":
      return "쿠폰이 모두 소진되어 주문하지 못했습니다. 쿠폰을 다시 선택해주세요.";
    case "COUPON_NOT_APPLICABLE":
      return "적용할 수 없는 쿠폰이 있어 주문하지 못했습니다. 쿠폰을 다시 선택해주세요.";
    case "NOT_FOUND":
      return "주문할 수 없는 리워드나 옵션이 있어 주문하지 못했습니다. 프로젝트에서 리워드를 다시 선택해주세요.";
    default:
      return "주문 내용을 확인하지 못해 주문하지 못했습니다. 리워드와 쿠폰을 확인한 뒤 다시 시도해주세요.";
  }
}

type AttemptStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** 주문 시도 하나. `order`가 없으면 서버가 주문을 만들었는지 아직 모른다. */
type Attempt = { key: string; fingerprint: string; body: OrderRequest; order?: OrderCreated };

const unconfirmedStatuses = new Set([401, 403, 408, 429]);

/* 같은 탭의 중복 클릭은 진행 중인 시도 하나를 함께 기다린다. */
const inFlight = new Map<string, Promise<OrderCreated>>();

export function submitOrderOnce(
  storage: AttemptStorage,
  memberId: string,
  body: OrderRequest,
): Promise<OrderCreated> {
  const storageKey = `fundit-order-attempt:${memberId}:${body.projectId}`;
  const running = inFlight.get(storageKey);
  if (running) return running;
  const attempt = submit(storage, storageKey, body).finally(() => inFlight.delete(storageKey));
  inFlight.set(storageKey, attempt);
  return attempt;
}

/** 주문을 취소해 이전 멱등성 시도를 더 이상 재사용하면 안 될 때만 호출한다. */
export function clearOrderAttempt(storage: AttemptStorage, memberId: string, projectId: string) {
  storage.removeItem(`fundit-order-attempt:${memberId}:${projectId}`);
}

async function submit(
  storage: AttemptStorage,
  storageKey: string,
  body: OrderRequest,
): Promise<OrderCreated> {
  const fingerprint = await digest(body);
  const previous = storage.getItem(storageKey);
  if (previous) {
    const saved = JSON.parse(previous) as Partial<Attempt>;
    if (!saved.order && !saved.key)
      throw new OrderAttemptError("이전 주문 결과를 확인해야 합니다. 참여 내역에서 확인해주세요.");
    // 결과를 모르는 시도는 새 주문보다 먼저 같은 키·같은 본문으로 다시 보내 확정한다.
    const order = saved.order ?? (await send(storage, storageKey, saved as Attempt));
    const current = await getOrder(order.orderId);
    if (current.status === "PENDING") {
      if (saved.fingerprint !== fingerprint)
        throw new OrderAttemptError(
          "이 프로젝트에 결제 대기 주문이 있습니다. 참여 내역에서 기존 주문을 확인하거나 취소한 뒤 다시 주문해주세요.",
        );
      return order;
    }
    if (!Object.hasOwn(orderStatusLabels, current.status))
      throw new OrderAttemptError("이전 주문 상태를 확인해야 합니다. 참여 내역에서 확인해주세요.");
  }
  return send(storage, storageKey, { key: crypto.randomUUID(), fingerprint, body });
}

async function send(
  storage: AttemptStorage,
  storageKey: string,
  attempt: Attempt,
): Promise<OrderCreated> {
  // 요청 전에 키를 남겨야 응답 유실·새로고침 뒤에도 같은 키로 서버 결과를 되찾는다.
  storage.setItem(storageKey, JSON.stringify(attempt));
  let order: OrderCreated;
  try {
    order = await createOrder(attempt.body, attempt.key);
  } catch (error) {
    if (error instanceof ApiError && error.code === "CONFLICT")
      throw new OrderAttemptError("같은 주문을 처리하고 있습니다. 잠시 후 다시 시도해주세요.");
    // 서버가 거절을 확정한 4xx만 시도를 버린다. 네트워크·5xx·파싱 실패는 같은 키로 다시 보낸다.
    // 인증·권한·시간 초과·요청 제한 응답만으로는 이전 요청의 생성 여부를 확정할 수 없다.
    // 키를 버리면 다음 시도가 새 키로 나가 중복 주문이 될 수 있다.
    if (
      error instanceof ApiError &&
      error.status >= 400 &&
      error.status < 500 &&
      !unconfirmedStatuses.has(error.status)
    ) {
      storage.removeItem(storageKey);
      throw new OrderRejectedError(error.code);
    }
    throw new OrderAttemptError(
      "주문 결과를 확인하지 못했습니다. 다시 시도하면 같은 주문으로 이어집니다.",
    );
  }
  if (!order?.orderId)
    throw new OrderAttemptError(
      "주문 결과를 확인하지 못했습니다. 다시 시도하면 같은 주문으로 이어집니다.",
    );
  storage.setItem(storageKey, JSON.stringify({ ...attempt, order }));
  return order;
}

async function digest(body: OrderRequest) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(body)),
  );
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
