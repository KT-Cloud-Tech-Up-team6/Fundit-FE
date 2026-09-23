import { apiRequest } from "../../../shared/api/client";

export type OrderAddress = {
  recipientName: string;
  phoneNumber: string;
  zipcode: string;
  addressLine1: string;
  addressLine2: string;
};
export type OrderLine = { rewardId: number; quantity: number; optionValueIds: number[] };
export type OrderRequest = {
  projectId: string;
  lineItems: OrderLine[];
  shippingAddress: OrderAddress;
  couponCodes: string[];
};
export type OrderPreview = {
  rewardAmount: number;
  shippingFee: number;
  discountAmount: number;
  finalAmount: number;
  appliedCoupons?: { couponCode: string; issuerType: string; discountType: string }[];
  unavailableCoupons?: { couponCode: string; reason: string }[];
};
export type CheckoutCoupon = {
  couponCode: string;
  couponName: string | null;
  discountType: string | null;
  discountValue: number;
  status: string;
  expiresAt: string | null;
  minFundingAmount: number;
  perMemberLimit: number;
  targetScope: string | null;
  targetRefId: string | null;
  issuerType: "PLATFORM" | "MAKER" | null;
  maxDiscountAmount: number | null;
};
export function getCheckoutCoupons(page: number, signal?: AbortSignal) {
  return apiRequest<{ content: CheckoutCoupon[]; hasNext: boolean }>(
    `/api/v1/coupons/me?page=${page}&size=20&status=AVAILABLE`,
    { auth: true, signal },
  );
}
export type OrderCreated = {
  orderId: string;
  projectId: string;
  status: string;
  finalAmount: number;
  paymentExpiresAt: string;
};
export type OrderDetail = {
  orderId: string;
  /* project-service 배치 조회가 실패하면 null로 내려온다(BE OrderDetailResponse). */
  projectTitle: string | null;
  thumbnailUrl: string | null;
  status: string;
  finalAmount: number;
  shippingFee: number;
  discountAmount: number;
  shippingAddress: OrderAddress;
  paidAt?: string;
  availableActions: string[];
  lineItems: {
    rewardId: number;
    rewardName: string;
    quantity: number;
    unitPrice: number;
    options: { optionGroupName: string; optionValue: string }[];
  }[];
};
export type PaymentAttempt = {
  paymentId: string;
  pgOrderId: string;
  amount: number;
  orderName: string;
};
export type CheckoutReward = {
  rewardId: number;
  name: string;
  description: string;
  price: number;
  isEarlyBird: boolean;
  earlyBirdDiscountedPrice: number | null;
  soldOut: boolean;
  remainingStock: number | null;
  options: { groupId: number; groupName: string; values: { valueId: number; value: string }[] }[];
};
export const orderStatusLabels: Record<string, string> = {
  PENDING: "결제 대기",
  FUNDING_IN_PROGRESS: "펀딩 진행 중",
  CANCELLED_BY_MEMBER: "참여 취소",
  PAYMENT_EXPIRED: "결제 기한 만료",
  GOAL_FAILED_REFUNDED: "목표 미달 환불",
  GOAL_ACHIEVED: "목표 달성",
  REFUNDED_AFTER_SUCCESS: "환불 완료",
};
export function getCheckoutRewards(id: string, signal?: AbortSignal) {
  return apiRequest<CheckoutReward[]>(`/api/v1/projects/${id}/rewards`, { signal });
}
export function getCheckoutAddresses(signal?: AbortSignal) {
  return apiRequest<(OrderAddress & { id: number; isDefault: boolean })[]>("/api/v1/addresses", {
    auth: true,
    signal,
  });
}
export function previewOrder(body: OrderRequest) {
  return apiRequest<OrderPreview>("/api/v1/orders/preview", { auth: true, method: "POST", body });
}
/** 같은 회원이 같은 키로 다시 보내면 BE는 새 주문 대신 기존 주문을 200으로 돌려준다.
    같은 키에 다른 본문이거나 같은 키 요청이 처리 중이면 409 `CONFLICT`다. */
export function createOrder(body: OrderRequest, idempotencyKey: string) {
  return apiRequest<OrderCreated>("/api/v1/orders", {
    auth: true,
    method: "POST",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}
export function getOrder(id: string, signal?: AbortSignal) {
  return apiRequest<OrderDetail>(`/api/v1/orders/${id}`, { auth: true, signal });
}
export function getOrders(page: number, status: string, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(page), size: "20" });
  if (status) params.set("status", status);
  return apiRequest<{
    content: {
      orderId: string;
      projectId: string;
      projectTitle: string;
      status: string;
      discountAmount: number;
      finalAmount: number;
      createdAt: string;
    }[];
    totalElements: number;
    hasNext: boolean;
  }>(`/api/v1/orders?${params}`, { auth: true, signal });
}
export function cancelOrder(id: string) {
  return apiRequest<{ orderId: string; status: string }>(`/api/v1/orders/${id}/cancel`, {
    auth: true,
    method: "POST",
  });
}
export function createPayment(fundingId: string) {
  return apiRequest<PaymentAttempt>("/api/v2/payments", {
    auth: true,
    method: "POST",
    body: { fundingId },
  });
}
export function confirmPayment(body: { paymentKey: string; orderId: string; amount: number }) {
  return apiRequest<{ paymentId: string; fundingId: string; status: string; paidAt: string }>(
    "/api/v2/payments/confirm",
    { auth: true, method: "POST", body },
  );
}
