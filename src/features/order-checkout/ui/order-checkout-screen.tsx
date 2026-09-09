"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Icon } from "@/shared/components/ui/icon";
import { Input } from "@/shared/components/ui/input";
import {
  DEMO_POINT_BALANCE,
  DEMO_SELECTED_COUPON_ID,
  clampPointUsage,
  couponDiscountAmount,
  demoCoupons,
  demoOrderItem,
  demoPaymentSummary,
  demoShippingAddress,
  demoTerms,
  finalPaymentAmount,
  formatWon,
  maxPointUsage,
  parsePointInput,
  totalDiscount,
  totalOrderAmount,
} from "../model/checkout-demo";
import type {
  Coupon,
  OrderItem,
  PaymentMethod,
  PaymentSummary,
  ShippingAddress,
  ShippingSectionState,
  TermsItem,
} from "../model/checkout-demo";
import { CouponSheet } from "./coupon-sheet";
import { ShippingAddressSection } from "./shipping-address-section";
import { ShippingAddressSheet } from "./shipping-address-sheet";

type OrderCheckoutScreenProps = {
  /** 저장된 배송지 유무. 없으면 "신규 배송지 추가" 노출 + 결제 시도 시 Warning. */
  hasSavedAddress?: boolean;
  /** Storybook에서 목업을 갈아끼우는 자리. 화면에서는 기본 목업을 쓴다. */
  orderItem?: OrderItem;
  address?: ShippingAddress;
  summary?: PaymentSummary;
  terms?: TermsItem[];
  coupons?: Coupon[];
};

const SHIPPING_SECTION_ID = "checkout-shipping-address";

const DEMO_ORDER_ITEM = demoOrderItem();
const DEMO_ADDRESS = demoShippingAddress();
const DEMO_SUMMARY = demoPaymentSummary();
const DEMO_TERMS = demoTerms();
const DEMO_COUPONS = demoCoupons();

export function OrderCheckoutScreen({
  hasSavedAddress = true,
  orderItem = DEMO_ORDER_ITEM,
  address = DEMO_ADDRESS,
  summary = DEMO_SUMMARY,
  terms = DEMO_TERMS,
  coupons = DEMO_COUPONS,
}: OrderCheckoutScreenProps) {
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [agreedIds, setAgreedIds] = useState<string[]>([]);
  /* interaction_spec: 배송지 미입력 상태로 결제하기를 누르면 Warning. 배송지 입력 완료 시 해제. */
  const [addressWarning, setAddressWarning] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(
    hasSavedAddress ? address : null,
  );
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  /* 선택된 쿠폰 id. null = 사용 안 함. */
  const [selectedCouponId, setSelectedCouponId] = useState<string | null>(DEMO_SELECTED_COUPON_ID);
  /* 적립금 입력값(숫자 문자열). 보유 잔액·상쇄 가능액을 넘기면 입력 시점에 잘라서 담는다. */
  const [pointInput, setPointInput] = useState("");

  const allTermIds = terms.map((term) => term.id);
  const isAllAgreed = allTermIds.every((id) => agreedIds.includes(id));

  const orderAmount = totalOrderAmount(summary);
  const selectedCoupon = coupons.find((coupon) => coupon.id === selectedCouponId) ?? null;
  const couponDiscount = selectedCoupon ? couponDiscountAmount(selectedCoupon, orderAmount) : 0;
  /* 쿠폰 선택·적립금 입력이 요약 금액을 실시간으로 덮어쓴다. */
  const couponAppliedSummary: PaymentSummary = { ...summary, couponDiscount };

  const usedPoints = clampPointUsage(
    Number(pointInput),
    DEMO_POINT_BALANCE,
    maxPointUsage(couponAppliedSummary),
  );
  const effectiveSummary: PaymentSummary = { ...couponAppliedSummary, pointDiscount: usedPoints };

  const shippingState: ShippingSectionState = savedAddress
    ? "saved"
    : addressWarning
      ? "warning"
      : "empty";

  function toggleTerm(id: string) {
    setAgreedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }

  function toggleAllTerms() {
    setAgreedIds(isAllAgreed ? [] : allTermIds);
  }

  function handlePointInput(next: string) {
    const parsed = parsePointInput(next);
    if (parsed === null) return; // 부호·소수점 등 무효 입력(붙여넣기 포함)은 무시
    const clamped = clampPointUsage(
      parsed,
      DEMO_POINT_BALANCE,
      maxPointUsage(couponAppliedSummary),
    );
    setPointInput(clamped === 0 ? "" : String(clamped));
  }

  function handleApplyCoupon(couponId: string | null) {
    setSelectedCouponId(couponId);
    setCouponSheetOpen(false);
  }

  function handleSaveShippingAddress(next: ShippingAddress) {
    setSavedAddress(next);
    setAddressWarning(false); // interaction_spec: 배송지 입력 완료 시 Warning 해제
    setAddressSheetOpen(false);
  }

  function handlePay() {
    if (!savedAddress) {
      // interaction_spec: 배송지 설정 영역으로 스크롤 + Warning 강조
      setAddressWarning(true);
      document
        .getElementById(SHIPPING_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // TODO(Issue: 결제 약관 바텀시트·PG): FL_B_PY_ORDAUTH → PG 결제 이동
  }

  return (
    <div className="bg-layer-bg min-h-dvh w-full">
      {/* 다른 전용 흐름 화면(AuthShell·BuyerLiveMain)과 같은 390px 모바일 컬럼 */}
      <div className="mx-auto flex min-h-dvh w-full max-w-[390px] flex-col">
        <header className="bg-layer-surface-default flex h-13 shrink-0 items-center justify-between px-3 py-1">
          <button
            type="button"
            aria-label="뒤로가기"
            onClick={() => router.back()}
            className="focus-visible:outline-border-primary flex size-10 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {/* Figma: frequently/arrow_up_line 을 -90° 돌린 좌향 화살표(꼬리 있음). 쉐브론(‹) 아님 */}
            <Icon name="arrowUp" className="size-6 -rotate-90" />
          </button>
          <h1 className="text-title-s text-text-default min-w-0 flex-1 truncate text-center">
            프로젝트 제목
          </h1>
          {/* 제목을 가운데 두기 위한 좌우 대칭 여백(Figma의 opacity-0 btn_back) */}
          <span aria-hidden className="size-10 shrink-0" />
        </header>

        <div className="flex flex-1 flex-col gap-3 pb-8">
          <ShippingAddressSection
            id={SHIPPING_SECTION_ID}
            state={shippingState}
            address={savedAddress ?? address}
            onChangeAddress={() => setAddressSheetOpen(true)}
            onAddAddress={() => setAddressSheetOpen(true)}
          />

          {/* 주문 상품 + 적립금: Figma에서 구분선 없이 이어진 한 흰 블록 */}
          <section className="bg-layer-surface-default flex flex-col">
            <OrderItemSection
              item={orderItem}
              couponDiscount={couponDiscount}
              onApplyCoupon={() => setCouponSheetOpen(true)}
            />
            <PointUsageSection
              value={pointInput}
              onChange={handlePointInput}
              balance={DEMO_POINT_BALANCE}
            />
          </section>

          <PaymentMethodSection method={method} onSelect={setMethod} />

          <PaymentSummarySection summary={effectiveSummary} />

          <TermsAgreementSection
            terms={terms}
            agreedIds={agreedIds}
            isAllAgreed={isAllAgreed}
            onToggleTerm={toggleTerm}
            onToggleAll={toggleAllTerms}
          />
        </div>

        <div className="bg-layer-surface-default border-border-default sticky bottom-0 border-t px-5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          {/* interaction_spec: 배송지 미입력 상태로 눌러도 동작해야(스크롤+Warning) 하므로 disabled 아님.
             결제 약관 동의·PG 이동은 후속 이슈. */}
          <Button className="w-full" appearance="cta" onClick={handlePay}>
            {formatWon(finalPaymentAmount(effectiveSummary))} 결제하기
          </Button>
        </div>
      </div>

      <ShippingAddressSheet
        open={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        initial={savedAddress}
        onSave={handleSaveShippingAddress}
      />

      <CouponSheet
        open={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        coupons={coupons}
        orderAmount={orderAmount}
        selectedId={selectedCouponId}
        onApply={handleApplyCoupon}
      />
    </div>
  );
}

function OrderItemSection({
  item,
  couponDiscount,
  onApplyCoupon,
}: {
  item: OrderItem;
  couponDiscount: number;
  onApplyCoupon: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex gap-2">
        <div className="bg-layer-surface-disabled text-caption-s flex size-19 shrink-0 items-center justify-center rounded-xs">
          IMG
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-body-m text-text-default truncate">{item.projectTitle}</p>
          <div className="text-body-s text-text-default flex flex-col gap-1">
            <span>
              {item.rewardName} · {item.quantity}개
            </span>
            {item.meta.length > 0 && (
              <span className="flex flex-wrap items-center gap-1">
                {item.meta.map((piece, index) => (
                  <span key={piece} className="flex items-center gap-1">
                    {index > 0 && <span aria-hidden>·</span>}
                    {piece}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end">
        {couponDiscount > 0 && (
          <span className="text-body-s text-text-secondary line-through">
            {formatWon(item.originalPrice)}
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="text-body-s text-text-default">
            {couponDiscount > 0 ? "쿠폰 적용가" : "상품 금액"}
          </span>
          <span className="text-title-s text-text-default">
            {formatWon(item.originalPrice - couponDiscount)}
          </span>
        </span>
      </div>

      <button
        type="button"
        onClick={onApplyCoupon}
        className="border-w-xs border-border-default text-body-m text-text-default focus-visible:outline-border-primary flex h-10 items-center justify-center rounded-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        쿠폰 적용
      </button>
    </div>
  );
}

function PointUsageSection({
  value,
  onChange,
  balance,
}: {
  value: string;
  onChange: (next: string) => void;
  balance: number;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <h2 className="text-title-s text-text-default">적립금 사용</h2>
      {/* Figma placeholder는 "리워드 가격을 입력해주세요"이나 적립금 필드라 오기로 보고 문구를 맞춘다.
         보유 잔액·상쇄 가능액을 넘기면 입력 시점에 잘린다(clampPointUsage). */}
      <Input
        inputMode="numeric"
        placeholder="적립금을 입력해주세요"
        aria-label="사용할 적립금"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-body-s text-text-secondary">보유 {formatWon(balance)}</p>
    </div>
  );
}

function PaymentMethodSection({
  method,
  onSelect,
}: {
  method: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
}) {
  const options: { value: PaymentMethod; label: string }[] = [
    { value: "credit_card", label: "신용 / 체크카드" },
    { value: "toss_pay", label: "toss pay" },
  ];

  return (
    <section
      aria-labelledby="checkout-method-title"
      className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
    >
      <h2 id="checkout-method-title" className="text-title-s text-text-default">
        결제 수단
      </h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">결제 수단 선택</legend>
        {options.map((option) => {
          const selected = method === option.value;
          return (
            <label
              key={option.value}
              className="border-w-xs border-border-default flex cursor-pointer items-center gap-3 rounded-xs px-4 py-3"
            >
              <input
                type="radio"
                name="checkout-payment-method"
                value={option.value}
                aria-label={option.label}
                checked={selected}
                onChange={() => onSelect(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className={[
                  "peer-focus-visible:outline-border-primary relative size-5 shrink-0 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                  selected ? "bg-layer-surface-primary" : "border-w-xs border-border-default",
                ].join(" ")}
              >
                {selected && (
                  <span className="border-text-inverse absolute top-1/2 left-1/2 h-2 w-1.5 -translate-x-1/2 -translate-y-[60%] rotate-45 border-r-2 border-b-2" />
                )}
              </span>
              <span className="text-body-m text-text-default font-medium">{option.label}</span>
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

function PaymentSummarySection({ summary }: { summary: PaymentSummary }) {
  return (
    <section aria-labelledby="checkout-summary-title" className="flex flex-col">
      <div className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4">
        <h2 id="checkout-summary-title" className="text-title-s text-text-default">
          결제 금액
        </h2>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <SummaryRow label="총 주문 금액" value={formatWon(totalOrderAmount(summary))} strong />
            <SummaryRow label="ㄴ펀딩 금액" value={formatWon(summary.fundingAmount)} muted />
            <SummaryRow label="ㄴ배송비" value={formatWon(summary.shippingFee)} muted />
          </div>
          <div className="flex flex-col gap-1.5">
            <SummaryRow
              label="총 할인 금액"
              value={`-${formatWon(totalDiscount(summary))}`}
              strong
            />
            <SummaryRow label="ㄴ펀딩 쿠폰" value={`-${formatWon(summary.couponDiscount)}`} muted />
            <SummaryRow
              label="ㄴ보유 적립금 사용"
              value={`-${formatWon(summary.pointDiscount)}`}
              muted
            />
          </div>
        </dl>
      </div>
      <div className="bg-layer-surface-default flex items-center justify-between px-5 py-2">
        <span className="text-title-s text-text-default">최종 결제 금액</span>
        <span className="text-title-s text-text-default">
          {formatWon(finalPaymentAmount(summary))}
        </span>
      </div>
    </section>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  muted = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  const tone = muted ? "text-text-secondary" : "text-text-default";
  const size = strong ? "text-body-m font-medium" : "text-body-m";
  return (
    <div className="flex items-center justify-between">
      <dt className={`${size} ${tone}`}>{label}</dt>
      <dd className={`${size} ${tone}`}>{value}</dd>
    </div>
  );
}

function TermsAgreementSection({
  terms,
  agreedIds,
  isAllAgreed,
  onToggleTerm,
  onToggleAll,
}: {
  terms: TermsItem[];
  agreedIds: string[];
  isAllAgreed: boolean;
  onToggleTerm: (id: string) => void;
  onToggleAll: () => void;
}) {
  return (
    <section
      aria-labelledby="checkout-terms-title"
      className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
    >
      <p id="checkout-terms-title" className="text-caption-s text-text-default">
        주문 내용을 확인하였으며, 아래 내용에 모두 동의합니다.
      </p>

      <Checkbox shape="square" checked={isAllAgreed} onChange={onToggleAll}>
        전체 동의합니다
      </Checkbox>

      <div className="flex flex-col gap-3 pl-4">
        {terms.map((term) => (
          <div key={term.id} className="flex items-center justify-between gap-2">
            <Checkbox
              shape="square"
              checked={agreedIds.includes(term.id)}
              onChange={() => onToggleTerm(term.id)}
            >
              <span className="text-caption-s">{term.label}</span>
            </Checkbox>
            {term.required && (
              /* 약관 전문 보기 — 상세는 후속 이슈. PR1은 자리만. */
              <button
                type="button"
                aria-label={`${term.label} 전문 보기`}
                className="focus-visible:outline-border-primary flex size-7 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Icon name="next" className="size-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
