/* UUID 프로젝트 발송정보(#312)를 BE 판매자 발송 목록 계약에 맞추는 순수 헬퍼. */
import type { SellerOrder, SellerShippingFilter } from "@/entities/order/api/seller-order-api";
import { shippingFilters, type Shipment, type ShippingFilter } from "./shipping-demo";

/** 화면 탭 값 → BE `ShippingFilter`. */
export const sellerShippingFilter: Record<ShippingFilter, SellerShippingFilter> = {
  all: "ALL",
  pending: "WAITING",
  shipped: "SHIPPED",
};

export type ShippingView = { status: ShippingFilter; search: string; page: number };

type SearchParam = string | string[] | undefined;
const single = (value: SearchParam) => (Array.isArray(value) ? value[0] : value);

/** URL의 탭·검색어·페이지(1부터)를 읽는다. 모르는 값은 전체 탭·1페이지로 둔다. */
export function parseShippingView(query: {
  status?: SearchParam;
  search?: SearchParam;
  page?: SearchParam;
}): ShippingView {
  const status = single(query.status);
  const page = Number(single(query.page));
  return {
    status: shippingFilters.find((filter) => filter.value === status)?.value ?? "all",
    search: single(query.search)?.trim() ?? "",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

/* Figma 주문번호 칸(488:7625)은 100px 한 줄의 짧은 번호다. BE는 UUID만 주므로 무작위인 끝 12자리
   (UUID 마지막 묶음)를 보여 주고 전체는 마우스를 올리면 보인다. 검색은 주문번호 부분 일치라 이 값으로도 찾는다. */
const shortOrderNo = (orderId: string) => orderId.slice(-12);

/* 응답에 주문별 발송 상태가 없다. 발송 대기·완료 탭은 서버가 그 상태로 거른 목록이라 탭 상태를 쓴다.
   Figma 상태 명세(488:8247)는 발송 처리·발송 완료 두 가지뿐이라 전체 탭은 우선 발송 처리로 둔다
   (2026-09-23 사용자 결정, 주문별 발송 여부 필드가 오면 바꾼다). 택배사·운송장은 판매자 조회 계약이 없어 비운다. */
export function toShipment(order: SellerOrder, filter: ShippingFilter): Shipment {
  const lines = order.lineItems.map((line) => {
    const option = line.options
      .map((item) => `${item.optionGroupName}: ${item.optionValue}`)
      .join(", ");
    return `${line.rewardName}${option ? ` (${option})` : ""}`;
  });
  return {
    id: order.orderId,
    orderNo: shortOrderNo(order.orderId),
    fullOrderNo: order.orderId,
    supporter: order.shippingAddress.recipientName,
    option: lines.join(" / "),
    quantity: order.lineItems.reduce((total, line) => total + line.quantity, 0),
    address: [order.shippingAddress.addressLine1, order.shippingAddress.addressLine2]
      .filter(Boolean)
      .join(" "),
    courier: "",
    trackingNo: "",
    status: filter === "shipped" ? "shipped" : "pending",
  };
}

/** 발송 처리 결과 안내. 등록한 건·이미 발송된 건·택배사·운송장이 빈 건·실패한 건을 나눠 알린다. */
export function shipResultMessage({
  shipped,
  already,
  skipped,
  failed,
}: {
  shipped: number;
  already: number;
  skipped: number;
  failed: number;
}) {
  const parts: string[] = [];
  if (shipped > 0 || already + skipped + failed === 0)
    parts.push(`${shipped}건을 발송 처리했어요.`);
  if (already > 0) parts.push(`이미 발송된 ${already}건은 발송 완료로 표시했어요.`);
  if (skipped > 0) parts.push(`택배사·운송장 번호가 비어 ${skipped}건은 처리하지 못했어요.`);
  if (failed > 0) parts.push(`${failed}건은 처리하지 못했어요. 다시 시도해 주세요.`);
  return parts.join(" ");
}

/** 전체 = 발송 대기 + 발송 완료. 건수 API는 목록과 같은 목표 달성 주문을 센다. */
export function shippingCounts(counts: {
  waiting: number;
  shipped: number;
}): Record<ShippingFilter, number> {
  return {
    all: counts.waiting + counts.shipped,
    pending: counts.waiting,
    shipped: counts.shipped,
  };
}
