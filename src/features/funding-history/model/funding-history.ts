/* 펀딩 내역 목록(FL_B_MY_FUND_1 2323:52376)·상세(FL_B_MY_FUND_MNG 2323:53132)의 화면 데이터.
   진행 단계·버튼은 BE 08 회신의 `progressStage`·`availableActions`·`refundRequests`로 정하고,
   조합은 Figma 정리표 "진행 단계 별 노출 될 버튼"(2323:53727)을 따른다. */
import type {
  OrderDetail,
  OrderLineItem,
  OrderRefundRequest,
  OrderSummary,
} from "../../../entities/order/api/order-api";
import { refundTypeByTrigger } from "../../../entities/refund/api/refund-api";

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 서버 Instant(UTC ISO)를 한국 날짜 `yyyy.mm.dd`로 옮긴다. 값이 없으면 빈 문자열이다. */
export function formatKoreanDate(value: string | undefined): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date(value))
    .replaceAll("-", ".");
}

/* 정리표(2323:53727)에 있는 여섯 단계는 정리표 문구를, 없는 세 단계는 기존 주문 상태 문구를 쓴다.
   목록 FUND_1의 "펀딩 완료"는 정리표·분류 필터·IA(취소선)를 따라 "펀딩 성공"으로 쓴다(노션 FE 자체 판단 33·34). */
export const fundingStageLabels: Record<string, string> = {
  FUNDING_IN_PROGRESS: "펀딩 진행 중",
  FUNDING_SUCCEEDED: "펀딩 성공",
  SHIPPING_DELAYED: "발송 지연",
  SHIPPING: "배송 중",
  DELIVERED: "배송 완료",
  GOAL_FAILED: "펀딩 목표 미달",
  CANCELLED: "참여 취소",
  PAYMENT_EXPIRED: "결제 기한 만료",
  REFUNDED: "환불 완료",
};

/** 카드·상세의 버튼. `href`가 없으면 누를 수 없는 안내 버튼이다. */
export type FundingAction = { label: string; href?: string };

const returnActions = ["RETURN_REQUEST", "EXCHANGE_REQUEST", "DEFECT_REFUND_REQUEST"];

/* 정리표의 "내역" 버튼은 목적지가 적혀 있지 않다. 가장 최근 신청의 유형으로 취소·반품·교환 내역의
   유형 필터(`/my/refunds?type=`)를 골라 연다(노션 FE 자체 판단 35). */
function historyAction(request: OrderRefundRequest | undefined): FundingAction | undefined {
  if (!request) return undefined;
  const type = refundTypeByTrigger[request.triggerType] ?? "환불";
  if (type === "취소") return { label: "취소 내역", href: "/my/refunds?type=cancel" };
  if (type === "교환") return { label: "반품·교환 내역", href: "/my/refunds?type=exchange" };
  return request.triggerType === "GOAL_FAILED_AUTO" ||
    request.triggerType === "SYSTEM_RECONCILIATION"
    ? { label: "환불 내역", href: "/my/refunds?type=refund" }
    : { label: "반품·교환 내역", href: "/my/refunds?type=refund" };
}

/**
 * 단계별 버튼. 신청 버튼은 서버가 허락한 액션이 있을 때만 두고, 신청 이력이 있으면 내역 버튼으로 바꾼다.
 * `availableActions`는 이미 낸 신청을 반영하지 않아 `refundRequests`를 먼저 본다(BE 08 회신).
 */
export function fundingActions(
  order: Pick<OrderSummary, "orderId" | "progressStage" | "availableActions" | "refundRequests">,
): FundingAction[] {
  const base = `/my/fundings/${order.orderId}`;
  const fulfillment = { label: "제작·배송 현황", href: `${base}/fulfillment` };
  const history = historyAction(order.refundRequests[0]);
  switch (order.progressStage) {
    case "FUNDING_IN_PROGRESS":
    case "SHIPPING_DELAYED": {
      if (history) return [history];
      /* 발송 지연의 참여 취소도 같은 경로다. 취소 화면이 액션을 보고 발송 지연 취소(CL_1-1)를 연다. */
      const cancellable = order.availableActions.some(
        (action) => action === "CANCEL" || action === "SHIPPING_DELAY_REFUND_REQUEST",
      );
      return cancellable
        ? [{ label: "참여 취소", href: `${base}/cancel` }, fulfillment]
        : [fulfillment];
    }
    case "FUNDING_SUCCEEDED":
    case "SHIPPING":
      return [fulfillment];
    /* 기본·신청 후는 FUND_1·IA 46·47처럼 제작·배송 현황을 함께 두고, 수령 후 7일이 지나 서버가
       반품·교환 액션을 내려주지 않으면 정리표의 비활성 버튼 하나만 둔다(노션 FE 자체 판단 36). */
    case "DELIVERED":
      if (history) return [history, fulfillment];
      return order.availableActions.some((action) => returnActions.includes(action))
        ? [{ label: "반품·교환 신청", href: `${base}/refund/new` }, fulfillment]
        : [{ label: "반품·교환 가능 기간이 지났어요" }];
    case "GOAL_FAILED":
      return [{ label: "환불 내역", href: "/my/refunds?type=refund" }];
    default:
      return history ? [history] : [];
  }
}

/** BE 목록의 `rewardSummary`와 같은 규칙(첫 리워드명 외 N건)을 상세 응답에 적용한다. */
function rewardSummaryOf(lineItems: OrderLineItem[]): string {
  const [first, ...rest] = lineItems;
  if (!first) return "";
  return rest.length ? `${first.rewardName} 외 ${rest.length}건` : first.rewardName;
}

/** 목록 카드(card_funding_item 2323:52379). 채우지 못한 값은 빈 문자열이다. */
export type FundingCard = {
  id: string;
  stage: string;
  /** `yyyy.mm.dd`. 결제 전이거나 옛 주문이면 비어 있고 화면에서 숨긴다. */
  paidAt: string;
  creatorName: string;
  projectTitle: string;
  imageSrc: string;
  reward: string;
  quantity: number;
  amount: number;
  actions: FundingAction[];
};

export function toFundingCard(order: OrderSummary): FundingCard {
  return {
    id: order.orderId,
    stage: fundingStageLabels[order.progressStage] ?? order.progressStage,
    paidAt: formatKoreanDate(order.paidAt),
    creatorName: order.sellerDisplayName ?? "",
    projectTitle: order.projectTitle ?? "",
    imageSrc: order.thumbnailUrl ?? "",
    reward: order.rewardSummary,
    quantity: order.totalQuantity,
    amount: order.finalAmount,
    actions: fundingActions(order),
  };
}

/** 펀딩 정보(card_fdinfo_item 2323:53155)의 리워드·옵션 한 벌. */
export type FundingDetailItem = { reward: string; option: string };

/** 상세(FL_B_MY_FUND_MNG). 주문번호·창작자·참여일은 상세 응답에 없어 두지 않는다(노션 FE 자체 판단 39). */
export type FundingDetailView = {
  id: string;
  projectTitle: string;
  imageSrc: string;
  reward: string;
  quantity: number;
  /** `yyyy.mm.dd`. 비어 있으면 결제일 행을 숨긴다. */
  paidAt: string;
  items: FundingDetailItem[];
  amount: number;
  actions: FundingAction[];
};

export function toFundingDetailView(order: OrderDetail): FundingDetailView {
  return {
    id: order.orderId,
    projectTitle: order.projectTitle ?? "",
    imageSrc: order.thumbnailUrl ?? "",
    reward: rewardSummaryOf(order.lineItems),
    quantity: order.lineItems.reduce((sum, item) => sum + item.quantity, 0),
    paidAt: formatKoreanDate(order.paidAt),
    /* 원본은 옵션이 없는 리워드를 "단일옵션"으로 그린다. 여러 옵션은 내역 화면처럼 ` · `로 잇는다. */
    items: order.lineItems.map((item) => ({
      reward: item.rewardName,
      option: `${
        item.options.map((o) => `${o.optionGroupName} ${o.optionValue}`).join(" · ") || "단일옵션"
      } · ${item.quantity}개`,
    })),
    amount: order.finalAmount,
    actions: fundingActions(order),
  };
}

// 데모 id(`/my/fundings/in_progress` 등)와 다른 기능의 목업이 쓰는 표시값 ---------------------

export const fundingHistoryStatuses = [
  "in_progress",
  "completed",
  "production",
  "shipping",
  "delivered",
] as const;

export type FundingHistoryStatus = (typeof fundingHistoryStatuses)[number];

export type FundingHistoryItem = {
  id: string;
  status: FundingHistoryStatus;
  creatorName: string;
  projectTitle: string;
  rewardOption: string;
  rewardQuantity: number;
  amount: number;
  /** `yyyy-mm-dd`. */
  paidAt: string;
  imageSrc: string;
};

/* Figma FL_B_MY_FUND_CL_1(1165:16434) 카드 4개를 그대로 옮긴 값이다.
   ponytail: "production"(제작 중)은 Figma에 예시 카드가 없어 기존 placeholder 상품으로 채운다. */
const FUNDING_HISTORY_DEMO: Record<
  FundingHistoryStatus,
  Omit<FundingHistoryItem, "id" | "status">
> = {
  in_progress: {
    creatorName: "벨라포뮬라",
    projectTitle: "탄탄하고 촉촉한 피부를 위한 데일리 콜라겐 크림",
    rewardOption: "콜라겐 크림 1개 + 미니 선크림 증정",
    rewardQuantity: 1,
    amount: 32_000,
    paidAt: "2026-09-15",
    imageSrc: "/images/funding-history/collagen-cream.png",
  },
  completed: {
    creatorName: "테크메이트 스튜디오",
    projectTitle: "아이패드를 노트북처럼, 슬림한 키보드 케이스",
    rewardOption: "키보드 케이스 + 펜슬 홀더",
    rewardQuantity: 1,
    amount: 89_000,
    paidAt: "2026-09-05",
    imageSrc: "/images/funding-history/keyboard-case.png",
  },
  production: {
    creatorName: "창작자 명",
    projectTitle: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    rewardOption: "[얼리버드] 가장 먼저 만나는 스타터 세트",
    rewardQuantity: 1,
    amount: 599_000,
    paidAt: "2026-08-30",
    imageSrc: "/images/funding-history/keyboard-case.png",
  },
  shipping: {
    creatorName: "키친모먼트",
    projectTitle: "빠른 가열과 깔끔한 디자인의 스테인리스 전기주전자",
    rewardOption: "전기주전자 단품",
    rewardQuantity: 1,
    amount: 79_000,
    paidAt: "2026-08-27",
    imageSrc: "/images/funding-history/kettle.png",
  },
  delivered: {
    creatorName: "센트모먼트",
    projectTitle: "하루 종일 은은하게 퍼지는 데일리 바디미스트",
    rewardOption: "바디미스트 2종 세트",
    rewardQuantity: 1,
    amount: 24_000,
    paidAt: "2026-08-18",
    imageSrc: "/images/funding-history/body-mist.png",
  },
};

function isFundingHistoryStatus(value: string): value is FundingHistoryStatus {
  return (fundingHistoryStatuses as readonly string[]).includes(value);
}

/** 목업 상품. id가 상태 키 그대로라 같은 id로 진입하면 해당 상태로 보이고, 모르는 id는 진행 중이다. */
export function demoFundingDetail(fundingId: string): FundingHistoryItem {
  const status = isFundingHistoryStatus(fundingId) ? fundingId : "in_progress";
  return { id: fundingId, status, ...FUNDING_HISTORY_DEMO[status] };
}
