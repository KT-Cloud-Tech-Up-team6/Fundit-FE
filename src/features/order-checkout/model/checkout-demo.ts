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
  originalPrice: number;
  /** 상품 카드에 노출되는 쿠폰 적용가. */
  couponPrice: number;
};

export type PaymentMethod = "credit_card" | "toss_pay";

/** 결제 금액 요약. 할인액은 양수로 들고 표시할 때 부호를 붙인다. */
export type PaymentSummary = {
  fundingAmount: number;
  shippingFee: number;
  couponDiscount: number;
  pointDiscount: number;
};

export type TermsItem = { id: string; label: string; required: boolean };

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
    couponPrice: 599_000,
  };
}

export function demoShippingAddress(): ShippingAddress {
  return {
    recipientName: "홍길동",
    phone: "010-1111-2222",
    zipCode: "06099",
    baseAddress: "서울 강남구 학동로 343",
    detailAddress: "",
  };
}

/* 목업은 한 주문 안에서 숫자가 맞아떨어지게 둔다: 상품 카드의 쿠폰 적용가(599,000)
   = 정가(699,000) − 쿠폰 할인(100,000). Figma 쿠폰 목록의 "100,000원 할인 쿠폰" 시나리오.
   pointDiscount 는 화면의 적립금 입력이 실시간으로 덮어쓰므로 기본 0,
   couponDiscount 는 쿠폰 모달(FL_B_PY_CPN, 후속 이슈) 전까지 고정값. */
export function demoPaymentSummary(): PaymentSummary {
  return {
    fundingAmount: 699_000,
    shippingFee: 0,
    couponDiscount: 100_000,
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
