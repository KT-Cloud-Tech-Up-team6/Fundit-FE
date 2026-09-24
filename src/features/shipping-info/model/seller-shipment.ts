/* UUID 프로젝트 발송정보(#312)를 BE 판매자 발송 목록 계약에 맞추는 순수 헬퍼. */
import type { Shipment as ShipmentRecord } from "@/entities/fulfillment/api/fulfillment-api";
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

/* 발송 여부는 탭 필터·건수와 같은 주문의 `shippedAt`으로 정한다. 이 값은 발송 이벤트로 늦게 채워질 수
   있어, 송장 조회가 발송 이후 상태를 주면 그것도 발송 완료로 본다. 택배사·운송장은 판매자 송장 조회 값이다. */
export function toShipment(order: SellerOrder, record?: ShipmentRecord): Shipment {
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
    courier: record?.carrier ?? "",
    trackingNo: record?.trackingNumber ?? "",
    status:
      order.shippedAt !== undefined || (record !== undefined && record.status !== "PREPARING")
        ? "shipped"
        : "pending",
  };
}

export type ShipmentAction = "ship" | "save";

/** 발송 처리·저장 결과 안내. 처리한 건·이미 발송된 건·택배사·운송장이 빈 건·실패한 건을 나눠 알린다. */
export function shipmentResultMessage(
  action: ShipmentAction,
  {
    done,
    already,
    skipped,
    failed,
  }: {
    done: number;
    already: number;
    skipped: number;
    failed: number;
  },
) {
  const verb = action === "ship" ? "발송 처리" : "저장";
  const parts: string[] = [];
  if (done > 0 || already + skipped + failed === 0)
    parts.push(
      action === "ship"
        ? `${done}건을 발송 처리했어요.`
        : `${done}건의 택배사·운송장을 저장했어요.`,
    );
  /* 발송 후에는 송장을 고칠 수 없다(BE `ALREADY_SHIPPED`). 화면은 입력값 대신 등록된 값을 다시 보여 준다. */
  if (already > 0)
    parts.push(`이미 발송된 ${already}건은 송장을 수정할 수 없어 발송 완료로 표시했어요.`);
  if (skipped > 0) parts.push(`택배사·운송장 번호가 비어 ${skipped}건은 ${verb}하지 못했어요.`);
  if (failed > 0) parts.push(`${failed}건은 ${verb}하지 못했어요. 다시 시도해 주세요.`);
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
