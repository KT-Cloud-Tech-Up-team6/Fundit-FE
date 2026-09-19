import { ApiError } from "../../../shared/api/api-error";
import {
  createOrder,
  getOrder,
  orderStatusLabels,
  type OrderCreated,
  type OrderRequest,
} from "../../../entities/order/api/order-api";

export class OrderAttemptError extends Error {}

export async function submitOrderOnce(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  memberId: string,
  body: OrderRequest,
): Promise<OrderCreated> {
  const key = `fundit-order-attempt:${memberId}:${body.projectId}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(body)),
  );
  const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const previous = storage.getItem(key);
  if (previous === "pending")
    throw new OrderAttemptError("이전 주문 결과를 확인해야 합니다. 참여 내역에서 확인해주세요.");
  storage.setItem(key, "pending");
  let creating = false;
  try {
    if (previous) {
      const saved = JSON.parse(previous) as {
        fingerprint?: string;
        order?: OrderCreated;
        orderId?: string;
      };
      const orderId = saved.order?.orderId ?? saved.orderId;
      if (!orderId) throw new OrderAttemptError("이전 주문을 참여 내역에서 확인해주세요.");
      const current = await getOrder(orderId);
      if (current.status === "PENDING") {
        if (!saved.order || saved.fingerprint !== fingerprint)
          throw new OrderAttemptError(
            "이 프로젝트에 결제 대기 주문이 있습니다. 참여 내역에서 기존 주문을 확인하거나 취소한 뒤 다시 주문해주세요.",
          );
        storage.setItem(key, previous);
        return saved.order;
      }
      if (!Object.hasOwn(orderStatusLabels, current.status))
        throw new OrderAttemptError(
          "이전 주문 상태를 확인해야 합니다. 참여 내역에서 확인해주세요.",
        );
    }
    creating = true;
    const order = await createOrder(body);
    if (!order?.orderId)
      throw new OrderAttemptError("주문 결과를 확인하지 못했습니다. 참여 내역에서 확인해주세요.");
    storage.setItem(key, JSON.stringify({ fingerprint, order }));
    return order;
  } catch (error) {
    // 네트워크/5xx/응답 파싱 실패는 서버 생성 여부를 알 수 없어 재생성을 막는다.
    if (!creating && previous) storage.setItem(key, previous);
    else if (error instanceof ApiError && error.status >= 400 && error.status < 500)
      storage.removeItem(key);
    throw error;
  }
}
