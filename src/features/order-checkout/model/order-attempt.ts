import { ApiError } from "../../../shared/api/api-error";
import {
  createOrder,
  type OrderCreated,
  type OrderRequest,
} from "../../../entities/order/api/order-api";

export async function submitOrderOnce(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  memberId: string,
  body: OrderRequest,
): Promise<OrderCreated> {
  const key = `fundit-order-attempt:${memberId}:${body.projectId}`;
  const previous = storage.getItem(key);
  if (previous) {
    if (previous === "pending")
      throw new Error("이전 주문 결과를 확인해야 합니다. 참여 내역에서 확인해주세요.");
    return JSON.parse(previous) as OrderCreated;
  }
  storage.setItem(key, "pending");
  try {
    const order = await createOrder(body);
    storage.setItem(key, JSON.stringify(order));
    return order;
  } catch (error) {
    // 네트워크/5xx/응답 파싱 실패는 서버 생성 여부를 알 수 없어 재생성을 막는다.
    if (error instanceof ApiError && error.status >= 400 && error.status < 500)
      storage.removeItem(key);
    throw error;
  }
}
