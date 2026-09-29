import { ApiError } from "../../../shared/api/api-error";
import type {
  OrderCancelBody,
  OrderCancelReason,
  OrderDetail,
} from "../../../entities/order/api/order-api";
import {
  RefundEvidenceValidationError,
  type RefundDefectType,
  type RefundEstimate,
  type RefundEstimateParams,
  type RefundExchangeReason,
  type RefundReturnReason,
} from "../../../entities/refund/api/refund-request-api";
import { formatWon } from "./funding-history";

/* 참여 취소·리워드 반품/교환 신청(FL_B_MY_FUND_CL, Figma 섹션 1143:22492의 2026-09-25 개정)의
   화면 데이터와 순수 헬퍼. 금액은 서버 예상 금액(`GET /api/v1/refunds/estimate`)을 그대로 쓰고
   여기서는 어떤 행에 어떤 값을 놓을지만 정한다. */

/** 신청 화면 종류. 발송 지연 취소(CL_1-1)는 주문의 `SHIPPING_DELAY_REFUND_REQUEST`일 때만 연다. */
export type FundingCancelVariant = "cancel" | "shipping-delay" | "return";

// 참여 취소 --------------------------------------------------------------

/** CL_2(2323:53242) 드롭다운 순서 그대로. "기타 창작자 귀책"은 Figma에만 있고 IA·BE에 없어
    PM 회신(2026-09-28, PM-4)으로 선택지에서 뺐다. */
export const cancelReasons = ["단순 변심", "결제 정보 오류", "옵션 선택 오류", "기타"] as const;

export type CancelReason = (typeof cancelReasons)[number];

/** BE `OrderCancelRequest.reasonDetail` `@Size(max = 100)`. 반품/교환 입력도 같은 길이로 받는다. */
export const cancelDetailMaxLength = 100;

const cancelReasonCodes: Record<CancelReason, OrderCancelReason> = {
  "단순 변심": "SIMPLE_CHANGE_OF_MIND",
  "결제 정보 오류": "PAYMENT_INFO_ERROR",
  "옵션 선택 오류": "OPTION_SELECTION_ERROR",
  기타: "ETC",
};

/** CL_1-1(2323:53685)의 고정 사유. 드롭다운 없이 이 문구만 보인다. */
export const shippingDelayCancelReason = "발송 예정일 지연 취소";

/** 상세 입력란을 보여 줄지. 발송 지연 취소(CL_1-1)는 IA와 BE `/shipping-delay`(`fundingId`만
    받는다)에 입력란이 없다(PM 회신 2026-09-28, PM-5). */
export function acceptsDetailInput(variant: FundingCancelVariant): boolean {
  return variant !== "shipping-delay";
}

/** 기타는 상세가 없으면 BE가 400으로 거절한다(`OrderCancelRequest` `@AssertTrue`). */
export function isCancelDetailRequired(reason: CancelReason | ""): boolean {
  return reason === "기타";
}

export function canSubmitCancel(reason: CancelReason | "", detail: string): boolean {
  return reason !== "" && (!isCancelDetailRequired(reason) || detail.trim().length > 0);
}

/** 참여 취소 요청 본문. */
export function cancelRequestBody(reason: CancelReason, detail: string): OrderCancelBody {
  const cancelReason = cancelReasonCodes[reason];
  const reasonDetail = detail.trim();
  return reasonDetail ? { cancelReason, reasonDetail } : { cancelReason };
}

// 리워드 반품/교환 ----------------------------------------------------------

/** CL_4(2323:53317) 유형 드롭다운 순서 그대로. */
export const returnTypes = ["교환", "반품"] as const;

export type ReturnType = (typeof returnTypes)[number];

/** CL_5(2323:53367)·CL_7(2323:53472) 사유 드롭다운. 반품과 교환이 같은 8종이다. */
export const refundReasons = [
  "단순 변심",
  "옵션 선택 오류",
  "불량·하자",
  "상품 파손",
  "상품이 잘못 배송됨",
  "구성품 누락",
  "상품 설명과 다름",
  "기타",
] as const;

export type RefundReason = (typeof refundReasons)[number];

/* 사유별 BE 코드. 교환 `ExchangeReason` 8개 이름을 반품도 그대로 쓴다 — 구매자 귀책 둘은 `/return`의
   `ReturnReason`, 나머지 여섯은 `/defect`의 `DefectType`과 이름이 같다. 귀책 구분은 Figma 가격표
   (2323:55325)와 BE `ExchangeReason`의 Fault가 같다. */
const refundReasonCodes: Record<RefundReason, RefundExchangeReason> = {
  "단순 변심": "CHANGE_OF_MIND",
  "옵션 선택 오류": "WRONG_OPTION",
  "불량·하자": "DEFECTIVE",
  "상품 파손": "DAMAGED",
  "상품이 잘못 배송됨": "WRONG_DELIVERY",
  "구성품 누락": "MISSING_COMPONENTS",
  "상품 설명과 다름": "DIFFERENT_FROM_DESCRIPTION",
  기타: "OTHER",
};

/** 유형·사유가 정해졌을 때 보낼 신청. 반품은 귀책에 따라 `/return`과 `/defect`로 나뉜다. */
export type ReturnRequestTarget =
  | { kind: "return"; returnReason: RefundReturnReason }
  | { kind: "defect"; defectType: RefundDefectType }
  | { kind: "exchange"; exchangeReason: RefundExchangeReason };

export function returnRequestTargetFor(
  type: ReturnType,
  reason: RefundReason,
): ReturnRequestTarget {
  const code = refundReasonCodes[reason];
  if (type === "교환") return { kind: "exchange", exchangeReason: code };
  if (code === "CHANGE_OF_MIND" || code === "WRONG_OPTION") {
    return { kind: "return", returnReason: code };
  }
  return { kind: "defect", defectType: code };
}

/** 하자 반품은 BE가 증빙을 필수로 받는다(`DefectRefundRequestV2` `@NotEmpty`). Figma는 모든
    화면에 "(선택)"으로 그려 두었다 — docs/OPEN_DECISIONS.md. */
export function requiresEvidence(target: ReturnRequestTarget | null): boolean {
  return target?.kind === "defect";
}

export function estimateParamsFor(target: ReturnRequestTarget): RefundEstimateParams {
  switch (target.kind) {
    case "return":
      return { triggerType: "RETURN_CHANGE_OF_MIND" };
    case "defect":
      return { triggerType: "DEFECT", defectType: target.defectType };
    case "exchange":
      return { triggerType: "EXCHANGE", exchangeReason: target.exchangeReason };
  }
}

// 환불·결제 정보 ------------------------------------------------------------

export type RefundInfoRow = { label: string; value: string };

/** 환불 정보(취소·반품) 또는 결제 정보(교환) 영역. 마지막 행(`total`)은 강조한다. */
export type RefundInfoView = {
  title: "환불 정보" | "결제 정보";
  rows: RefundInfoRow[];
  total: RefundInfoRow;
  notice: string;
};

/** 취소 두 화면은 사유와 무관하게 같은 규칙이라 하나로 본다. */
export type RefundInfoTarget = ReturnRequestTarget | { kind: "cancel" };

/** 기타처럼 판매자 검토 뒤 정해지는 금액(환불 정책 V.1.0 PD 확인 요청 3). */
export const undeterminedAmountText = "접수 후 확인하여 안내";
const creatorPaysText = "창작자 부담 예정";
/* 2323:53657(반품·창작자 귀책)의 원문은 "교환 배송비"라고 쓰여 있다. 반품 화면이라 "반품 배송비"로
   바꿨다 — docs/OPEN_DECISIONS.md에 확인 요청으로 남겼다. */
const returnCreatorNotice =
  "상품 확인 후 확정돼요. 구매자 사유로 확인되면 반품 배송비 5,000원이 청구될 수 있어요.";
/** CL_8(2323:53476) 원문. */
const exchangeCreatorNotice =
  "상품 확인 후 확정돼요. 구매자 사유로 확인되면 교환 배송비 5,000원이 청구될 수 있어요.";

type Fault = "buyer" | "creator" | "undetermined";

function faultOf(target: ReturnRequestTarget): Fault {
  const code =
    target.kind === "return"
      ? target.returnReason
      : target.kind === "defect"
        ? target.defectType
        : target.exchangeReason;
  if (code === "CHANGE_OF_MIND" || code === "WRONG_OPTION") return "buyer";
  return code === "OTHER" ? "undetermined" : "creator";
}

/** 서버가 확정액을 주지 않으면(교환·기타 하자) 금액 대신 안내 문구를 쓴다. */
function refundAmountText(estimate: RefundEstimate): string {
  return estimate.refundAmount == null ? undeterminedAmountText : formatWon(estimate.refundAmount);
}

/* 적립금 환불 금액 행은 적립금 기능이 구현 범위에서 빠져(PM 2026-09-23) 그리지 않는다.
   취소 CL_3·CL_1-1, 반품 CL_6·2323:53657, 교환 2323:53675·CL_8의 행 구성을 옮겼다. 반품·교환의
   기타는 그려진 화면이 없어 금액 행을 안내 문구로 채운다. */
export function refundInfoFor(target: RefundInfoTarget, estimate: RefundEstimate): RefundInfoView {
  const payment = { label: "결제 금액", value: formatWon(estimate.paymentAmount) };
  if (target.kind === "cancel") {
    return {
      title: "환불 정보",
      rows: [payment],
      total: { label: "예상 환불액", value: refundAmountText(estimate) },
      notice: "",
    };
  }
  const fault = faultOf(target);
  if (target.kind === "exchange") {
    const additional =
      fault === "undetermined"
        ? undeterminedAmountText
        : formatWon(estimate.additionalPaymentAmount);
    /* 구매자 귀책이면 교환 배송비가 곧 추가 결제 금액이다(BE `ExchangeReason.additionalPaymentAmount`). */
    const shippingFee = fault === "creator" ? creatorPaysText : additional;
    return {
      title: "결제 정보",
      rows: [{ label: "교환 배송비", value: shippingFee }],
      total: { label: "추가 결제 금액", value: additional },
      notice: fault === "creator" ? exchangeCreatorNotice : "",
    };
  }
  const returnShippingFee =
    fault === "buyer"
      ? `-${formatWon(estimate.returnShippingFee)}`
      : fault === "creator"
        ? creatorPaysText
        : undeterminedAmountText;
  return {
    title: "환불 정보",
    rows: [payment, { label: "반품 배송비", value: returnShippingFee }],
    total: { label: "예상 환불액", value: refundAmountText(estimate) },
    notice: fault === "creator" ? returnCreatorNotice : "",
  };
}

// 오류 안내 --------------------------------------------------------------

const requestErrorMessages: Record<string, string> = {
  // 참여 취소(order-service)
  RESOURCE_EXPIRED: "결제 기한이 지나 만료된 주문은 취소할 수 없습니다.",
  ORDER_NOT_CANCELLABLE: "펀딩이 종료되어 취소할 수 없습니다.",
  // 발송 지연 취소(payment-service)
  ALREADY_SHIPPED: "이미 발송이 시작되어 취소할 수 없습니다.",
  NOT_YET_DELAYED: "아직 발송 예정일이 지나지 않아 취소할 수 없습니다.",
  // 반품·교환(payment-service)
  NOT_DELIVERED: "배송이 완료된 뒤에 반품·교환을 신청할 수 있습니다.",
  RETURN_PERIOD_EXPIRED: "반품·교환 가능 기간이 지났습니다.",
  REFUND_ALREADY_REQUESTED:
    "이미 접수된 반품·교환 신청이 있습니다. 취소·반품·교환 내역에서 확인해주세요.",
  RETURN_FEE_EXCEEDS_AMOUNT: "결제 금액이 반품 배송비(5,000원)보다 적어 반품을 신청할 수 없습니다.",
  DEPENDENCY_FAILURE: "주문 정보를 확인하지 못해 신청하지 못했습니다. 잠시 후 다시 시도해주세요.",
};

function knownErrorMessage(error: unknown): string | undefined {
  return error instanceof ApiError ? requestErrorMessages[error.code] : undefined;
}

/** 취소는 결과를 알 수 없는 실패면 이미 접수됐을 수 있어 내역과 주문 상태를 보라고 안내한다. */
const cancelUnknownResultMessage =
  "취소가 접수됐는지 확인하지 못했습니다. 취소·반품·교환 내역이나 주문 상태를 확인해주세요.";

/* 발송 지연 취소의 503 `DEPENDENCY_FAILURE`는 토스 응답이 불명확해 취소가 처리 중으로 접수된
   경우일 수 있다(BE #182). 배송 상태 조회 실패도 같은 코드라 둘 다 결과를 모르는 실패로 본다. */
export function cancelErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code === "DEPENDENCY_FAILURE") {
    return cancelUnknownResultMessage;
  }
  return knownErrorMessage(error) ?? cancelUnknownResultMessage;
}

export function refundRequestErrorMessage(error: unknown): string {
  if (error instanceof RefundEvidenceValidationError) return error.message;
  return knownErrorMessage(error) ?? "신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

// 신청 화면 공통 -----------------------------------------------------------

/** 신청 화면 상단 상품 카드(card_cancel_item). 채우지 못하는 값은 빈 문자열로 둔다. */
export type FundingCancelDetail = {
  imageSrc: string;
  projectTitle: string;
  rewardOption: string;
  rewardQuantity: number | null;
  amount: number | null;
};

/** 카드는 상품 한 줄이라 BE 목록의 표시 규칙(첫 리워드명 외 N건)을 따른다. */
export function toFundingCancelDetail(order: OrderDetail): FundingCancelDetail {
  const [first, ...rest] = order.lineItems;
  const options = first?.options.map((o) => `${o.optionGroupName} ${o.optionValue}`) ?? [];
  return {
    /* project-service 조회가 실패하면 둘 다 null로 온다. 그때는 자리만 남긴다. */
    imageSrc: order.thumbnailUrl ?? "",
    projectTitle: order.projectTitle ?? "",
    rewardOption: first
      ? [first.rewardName, ...options].join(" · ") + (rest.length ? ` 외 ${rest.length}건` : "")
      : "",
    rewardQuantity: first?.quantity ?? null,
    amount: order.finalAmount,
  };
}

export type CancelPhoto = {
  id: string;
  url: string;
  name: string;
  /** 증빙 업로드에 그대로 넘길 원본 파일. */
  file: File;
};

/** Figma에 첨부 한도가 없어 임의로 둔 값. 실제 한도가 정해지면 이 값만 바꾼다. */
export const maxCancelPhotos = 5;

export function addCancelPhotos(current: CancelPhoto[], incoming: CancelPhoto[]): CancelPhoto[] {
  const room = Math.max(0, maxCancelPhotos - current.length);
  return room > 0 ? [...current, ...incoming.slice(0, room)] : current;
}

export function removeCancelPhoto(photos: CancelPhoto[], id: string): CancelPhoto[] {
  return photos.filter((photo) => photo.id !== id);
}
