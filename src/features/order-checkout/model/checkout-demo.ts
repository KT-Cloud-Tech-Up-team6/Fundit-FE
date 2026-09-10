/* 주문서 화면(FL_B_PY_ORD)의 화면 데이터와 순수 계산 헬퍼.
   ponytail: 주문/결제 조회 API가 없어(docs/OPEN_DECISIONS.md P0 "결제") 값은 목업 상수다.
   API가 생기면 타입을 응답 스키마에 맞추고 계산·포맷 헬퍼는 그대로 재사용한다.
   쿠폰·적립금 입력 반영과 실시간 재계산은 후속 이슈(Issue #58 제외 범위). */

export type ShippingAddress = {
  recipientName: string;
  phone: string;
  /** 우편번호 찾기(다음 우편번호 서비스)로 채워지는 값. */
  zipCode: string;
  /** 도로명 또는 지번 기본 주소. 우편번호 찾기로 채워진다. */
  baseAddress: string;
  detailAddress: string;
  /** 배송 요청 사항 (선택). */
  deliveryMemo?: string;
};

/** 배송지 섹션 표시 상태.
   saved=저장된 배송지, empty=배송지 없음, warning=미입력 + 결제 시도 후 강조. */
export type ShippingSectionState = "saved" | "empty" | "warning";

export type OrderItem = {
  projectTitle: string;
  rewardName: string;
  quantity: number;
  /** 메타 줄 조각. 가운뎃점으로 잇는다. 예: ["무료배송", "예상 발송일 2026.10.12"]. */
  meta: string[];
  /** 정가. 상품 카드의 쿠폰 적용가는 이 값 − 적용 쿠폰 할인으로 계산한다. */
  originalPrice: number;
};

export type PaymentMethod = "credit_card" | "toss_pay";

export type Coupon = {
  id: string;
  name: string;
  /** 정액이면 amount, 정률이면 percent + 상한(maxAmount). */
  discount:
    { type: "amount"; amount: number } | { type: "percent"; percent: number; maxAmount: number };
  /** 최소 주문 금액. 미만이면 사용 불가(회색 표시). */
  minOrderAmount: number;
  /** "50만원 이상 펀딩 시 사용 가능" 같은 조건 문구. */
  conditionLabel: string;
  /** "~2026.09.30 까지사용가능". */
  expiryLabel: string;
  /** "최고 할인율" 같은 배지 문구. */
  badge?: string;
};

/** 결제 금액 요약. 할인액은 양수로 들고 표시할 때 부호를 붙인다. */
export type PaymentSummary = {
  fundingAmount: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
};

export type TermsItem = { id: string; label: string; required: boolean };

/** 주문 완료 화면(FL_B_PY_CMPL) 영수증. 결제 API 전까지 목업. */
export type OrderReceipt = {
  orderId: string;
  /** "리워드 외 0건" */
  itemSummary: string;
  paidAmount: number;
  /** 축약된 배송지 문자열. */
  shippingAddress: string;
  ordererName: string;
  ordererPhone: string;
  /** "리워드 참여가 확정됐습니다" 같은 안내 문구. */
  completeMessage: string;
  /** "2026.11.02" */
  expectedShippingDate: string;
};

/** 5000000 → "5,000,000원"
   ponytail: reward-selection·entities/project에도 같은 한 줄이 있다. 세 번째 사본이라
   shared로 뺄 만하지만 이 PR 범위 밖이다. */
export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 할인 전 총 주문 금액 = 펀딩 금액 + 배송비. */
export function totalOrderAmount(summary: PaymentSummary): number {
  return summary.fundingAmount + summary.shippingFee;
}

/** 총 할인 금액 = 펀딩 쿠폰 + 보유 적립금 사용. */
export function totalDiscount(summary: PaymentSummary): number {
  return summary.couponDiscount + summary.pointDiscount;
}

/** 최종 결제 금액 = 총 주문 금액 − 총 할인 금액. 음수면 0으로 막는다. */
export function finalPaymentAmount(summary: PaymentSummary): number {
  return Math.max(0, totalOrderAmount(summary) - totalDiscount(summary));
}

/** 이번 주문에서 적립금으로 상쇄 가능한 최대 금액 = 총 주문 − 쿠폰 할인. (최종 결제 금액이 음수가 되지 않도록) */
export function maxPointUsage(summary: PaymentSummary): number {
  return Math.max(0, totalOrderAmount(summary) - summary.couponDiscount);
}

/** 쿠폰을 이 주문 금액에 적용했을 때 할인액. 최소 주문액 미달이면 0. */
export function couponDiscountAmount(coupon: Coupon, orderAmount: number): number {
  if (orderAmount < coupon.minOrderAmount) return 0;
  if (coupon.discount.type === "amount") return coupon.discount.amount;
  return Math.min(
    Math.floor((orderAmount * coupon.discount.percent) / 100),
    coupon.discount.maxAmount,
  );
}

/** 이 주문에서 사용 가능한 쿠폰인지 (최소 주문액 충족). */
export function isCouponUsable(coupon: Coupon, orderAmount: number): boolean {
  return orderAmount >= coupon.minOrderAmount;
}

/** 입력한 적립금 사용액을 유효 범위로 자른다: 0 이상, 보유 잔액 이하, 상쇄 가능액 이하. */
export function clampPointUsage(raw: number, balance: number, maxUsable: number): number {
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(Math.trunc(raw), balance, Math.max(0, maxUsable)));
}

/** 적립금 입력 문자열 → 정수. 빈 값은 0, 천 단위 콤마는 허용,
   부호·소수점·문자가 섞이면 null(무효 입력이므로 값 변경 없이 무시). */
export function parsePointInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (cleaned === "") return 0;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : null;
}

/** 필수 약관이 모두 동의됐는지. "전체 동의합니다" 체크 여부와 같은 조건이다. */
export function requiredTermsMet(terms: TermsItem[], agreedIds: readonly string[]): boolean {
  const agreed = new Set(agreedIds);
  return terms.filter((term) => term.required).every((term) => agreed.has(term.id));
}

/** 배송지 입력값이 전부 빈 시작 상태. */
export function emptyShippingAddress(): ShippingAddress {
  return {
    recipientName: "",
    phone: "",
    zipCode: "",
    baseAddress: "",
    detailAddress: "",
    deliveryMemo: "",
  };
}

/** 배송지 저장 가능 여부: 배송 요청 사항(선택) 외 필수 항목이 모두 채워졌는지 (FL_B_PY_ADDR interaction_spec). */
export function isShippingAddressComplete(address: ShippingAddress): boolean {
  return [
    address.recipientName,
    address.phone,
    address.zipCode,
    address.baseAddress,
    address.detailAddress,
  ].every((value) => value.trim().length > 0);
}

export function demoOrderItem(): OrderItem {
  return {
    projectTitle: "바닥 청소부터 걸레 건조까지 한 번에 관리하는 올인원 로봇청소기, 클린포지 R1",
    rewardName: "얼리버드 클린포지 R1",
    quantity: 1,
    meta: ["무료배송", "예상 발송일 2026.10.12"],
    originalPrice: 699_000,
  };
}

/* Figma FL_B_PY_CPN 목록. "100,000원 할인 쿠폰"은 최소 주문액 미달로 사용 불가(회색).
   쿠폰 조회 API 전까지 목업. */
export function demoCoupons(): Coupon[] {
  return [
    {
      id: "flat-3000",
      name: "3,000원 할인 쿠폰",
      discount: { type: "amount", amount: 3_000 },
      minOrderAmount: 500_000,
      conditionLabel: "50만원 이상 펀딩 시 사용 가능",
      expiryLabel: "~2026.09.30 까지사용가능",
    },
    {
      id: "percent-5",
      name: "5% 할인 쿠폰(최대 5,000원)",
      discount: { type: "percent", percent: 5, maxAmount: 5_000 },
      minOrderAmount: 0,
      conditionLabel: "전체 상품",
      expiryLabel: "~2026.09.30 까지사용가능",
    },
    {
      id: "flat-10000",
      name: "10,000원 할인 쿠폰",
      discount: { type: "amount", amount: 10_000 },
      minOrderAmount: 100_000,
      conditionLabel: "10만원 이상 구매 시 사용 가능",
      expiryLabel: "~2026.09.30 까지사용가능",
      badge: "최고 할인율",
    },
    {
      id: "flat-100000",
      name: "100,000원 할인 쿠폰",
      discount: { type: "amount", amount: 100_000 },
      minOrderAmount: 1_000_000,
      conditionLabel: "100만원 이상 구매 시 사용 가능",
      expiryLabel: "~2026.09.30 까지사용가능",
    },
  ];
}

/** 화면 진입 시 기본 선택 쿠폰 id. 목업: 이 주문에 쓸 수 있는 것 중 할인액이 가장 큰 것. */
export const DEMO_SELECTED_COUPON_ID = "flat-10000";

export function demoShippingAddress(): ShippingAddress {
  return {
    recipientName: "홍길동",
    phone: "010-1111-2222",
    zipCode: "06099",
    baseAddress: "서울 강남구 학동로 343",
    /* 저장된 배송지는 isShippingAddressComplete 를 통과하는 완성 상태여야 한다
       (배송지 변경 시트가 이 값으로 열려 저장 버튼이 바로 활성). */
    detailAddress: "5층 501호",
  };
}

/* couponDiscount·pointDiscount 는 화면에서 쿠폰 선택·적립금 입력으로 실시간으로 덮어쓴다.
   기본값은 진입 시 상태(기본 선택 쿠폰 "10,000원 할인 쿠폰" 적용, 적립금 0)와 일치시킨다:
   상품 카드 쿠폰 적용가 = 정가 699,000 − 10,000 = 689,000 = 최종 결제 금액. */
export function demoPaymentSummary(): PaymentSummary {
  return {
    fundingAmount: 699_000,
    shippingFee: 0,
    couponDiscount: 10_000,
    pointDiscount: 0,
  };
}

export function demoTerms(): TermsItem[] {
  return [
    { id: "purchase", label: "구매조건 및 결제대행 서비스 동의 (필수)", required: true },
    { id: "privacy-third-party", label: "개인정보 제3자 제공 동의 (필수)", required: true },
    { id: "liability", label: "책임 규정 동의 (필수)", required: true },
    { id: "news", label: "펀딩 관련 새 소식 알림 동의 (선택)", required: false },
  ];
}

/** 적립금 섹션 "보유 N원" 표시용 목업. */
export const DEMO_POINT_BALANCE = 5_000;

/* FL_B_PY_CMPL 목업. 결제/주문 API가 없어 이 화면만의 독립 값(체크아웃 금액과 별개). */
export function demoOrderReceipt(): OrderReceipt {
  return {
    orderId: "FD20261108-000123",
    itemSummary: "리워드 외 0건",
    paidAmount: 39_000,
    shippingAddress: "서울특별시 강남구 학동로 343",
    ordererName: "홍길동",
    ordererPhone: "010-1111-2222",
    completeMessage: "리워드 참여가 확정됐습니다",
    expectedShippingDate: "2026.11.02",
  };
}

/** 주문 완료 후 펀딩내역 화면으로 자동 이동하기까지의 초. Figma는 10초(IA는 3초 — 확인 필요). */
export const ORDER_COMPLETE_REDIRECT_SECONDS = 10;
