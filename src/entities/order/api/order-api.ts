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
export type OrderLineItem = {
  rewardId: number;
  rewardName: string;
  quantity: number;
  unitPrice: number;
  options: { optionGroupName: string; optionValue: string }[];
};
/** 이 주문의 취소·반품·교환 신청 이력(최신순). 값은 payment-service enum 이름 그대로다.
    BE는 조회에 실패해도 빈 배열로 내려준다(부가 정보). */
export type OrderRefundRequest = {
  refundId: number;
  triggerType: string;
  status: string;
  requestedAt: string;
};
export type OrderDetail = {
  orderId: string;
  /* project-service 배치 조회가 실패하면 null로 내려온다(BE OrderDetailResponse). */
  projectTitle: string | null;
  thumbnailUrl: string | null;
  status: string;
  /** 화면 배지용 진행 단계(BE `FundingProgressStage` 9종). `status`를 대체하지 않는다. */
  progressStage: string;
  finalAmount: number;
  shippingFee: number;
  discountAmount: number;
  shippingAddress: OrderAddress;
  /** 결제 전이거나 결제 시각이 기록되기 전의 옛 주문이면 키가 없다. */
  paidAt?: string;
  /** 결제 기한이 설정되지 않은 옛 주문이면 BE가 키 자체를 뺀다(paidAt과 동일). */
  paymentExpiresAt?: string;
  availableActions: string[];
  refundRequests: OrderRefundRequest[];
  lineItems: OrderLineItem[];
  /** 참여일(주문 생성 시각). BE #181 전 응답에는 키가 없다. */
  createdAt?: string;
};
/** 목록 응답(BE `OrderSummaryResponse`). BE는 null 필드를 JSON에서 빼므로 값이 없을 수 있는
    필드는 선택 키다. 판매자명·썸네일은 project-service 조회가 실패하면 빠진다. */
export type OrderSummary = {
  orderId: string;
  projectId: string;
  projectTitle?: string;
  status: string;
  progressStage: string;
  discountAmount: number;
  finalAmount: number;
  createdAt: string;
  paidAt?: string;
  sellerDisplayName?: string;
  thumbnailUrl?: string;
  /** "첫 리워드명 외 N건". 리워드가 하나면 그 이름이다. */
  rewardSummary: string;
  totalQuantity: number;
  lineItems: OrderLineItem[];
  availableActions: string[];
  refundRequests: OrderRefundRequest[];
};
export type PaymentAttempt = {
  paymentId: string;
  pgOrderId: string;
  amount: number;
  orderName: string;
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
export type CheckoutAddress = OrderAddress & { id: number; isDefault: boolean };
export function getCheckoutAddresses(signal?: AbortSignal) {
  return apiRequest<CheckoutAddress[]>("/api/v1/addresses", {
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
export const ORDER_PAGE_SIZE = 20;
/** 목록 조건(BE #181). `q`는 프로젝트명 부분 일치, `from`·`to`는 한국 날짜 `yyyy-MM-dd`의
    참여일이며 양 끝을 포함한다. `from`이 `to`보다 늦으면 400이다. `status`(주문 상태)는 여러 번
    보내면 합집합이다. 비운 조건은 보내지 않는다. */
export type OrderListFilter = {
  q?: string;
  from?: string;
  to?: string;
  status?: readonly string[];
};
export type OrderPage = { content: OrderSummary[]; totalElements: number; hasNext: boolean };
/** BE #181부터 목록은 최신 참여순 고정이다. 그 전 서버에는 기본 정렬이 없어 `sort`를 계속 보낸다. */
export function getOrders(
  page: number,
  filter: OrderListFilter = {},
  signal?: AbortSignal,
  size = ORDER_PAGE_SIZE,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: "createdAt,desc",
  });
  for (const key of ["q", "from", "to"] as const) {
    const value = filter[key];
    if (value) params.set(key, value);
  }
  for (const status of filter.status ?? []) params.append("status", status);
  return apiRequest<OrderPage>(`/api/v1/orders?${params}`, { auth: true, signal });
}

/** 한 번에 받는 건수와 최대 요청 수. 서버에 크기 상한이 따로 없어 100건씩 20번(2,000건)까지 받는다. */
export const ORDER_FETCH_ALL_SIZE = 100;
export const ORDER_FETCH_ALL_MAX_REQUESTS = 20;
/** 조건에 맞는 주문을 최신 참여순으로 끝까지 받는다. 최대 요청 수에 닿으면 받은 데까지 주고
    `truncated`로 알린다. 서버가 거르지 못하는 조건(진행 단계)을 화면이 거를 때 쓴다. */
export async function getAllOrders(filter: OrderListFilter, signal?: AbortSignal) {
  const content: OrderSummary[] = [];
  for (let page = 0; page < ORDER_FETCH_ALL_MAX_REQUESTS; page += 1) {
    const result = await getOrders(page, filter, signal, ORDER_FETCH_ALL_SIZE);
    content.push(...result.content);
    if (!result.hasNext) return { content, truncated: false };
  }
  return { content, truncated: true };
}
/** BE `CancelReason`. `ETC`는 `reasonDetail`이 비어 있으면 400 `INVALID_INPUT`이다. */
export type OrderCancelReason =
  "SIMPLE_CHANGE_OF_MIND" | "PAYMENT_INFO_ERROR" | "OPTION_SELECTION_ERROR" | "ETC";
export type OrderCancelBody = { cancelReason: OrderCancelReason; reasonDetail?: string };
/** 본문은 선택이다. 없이 보내도 BE는 취소하고 사유만 저장하지 않는다(`OrderCancelRequest`). */
export function cancelOrder(id: string, body?: OrderCancelBody) {
  return apiRequest<{ orderId: string; status: string }>(`/api/v1/orders/${id}/cancel`, {
    auth: true,
    method: "POST",
    body,
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
