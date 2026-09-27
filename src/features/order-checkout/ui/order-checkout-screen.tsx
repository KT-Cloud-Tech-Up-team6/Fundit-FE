"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { CheckoutForm } from "@/entities/order/model/order-session";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  DEMO_POINT_BALANCE,
  clampPointUsage,
  couponDiscountAmount,
  demoCoupons,
  demoOrderItem,
  demoPaymentSummary,
  demoShippingAddress,
  finalPaymentAmount,
  formatWon,
  maxPointUsage,
  isCouponUsable,
  parsePointInput,
} from "../model/checkout-demo";
import type {
  Coupon,
  OrderItem,
  PaymentSummary,
  ShippingAddress,
  ShippingSectionState,
} from "../model/checkout-demo";
import { demoSummaryRows } from "../model/payment-summary";
import { CheckoutLayout, PaymentSummarySection, PriceInformation } from "./checkout-parts";
import { CouponSheet } from "./coupon-sheet";
import { ShippingAddressSection } from "./shipping-address-section";
import { ShippingAddressSheet } from "./shipping-address-sheet";
import { PaymentMethodSection } from "./payment-method-section";

const SHIPPING_SECTION_ID = "checkout-shipping-address";
const DEMO_ORDER_ITEM = demoOrderItem();
const DEMO_ADDRESS = demoShippingAddress();
const DEMO_SUMMARY = demoPaymentSummary();
const DEMO_COUPONS = demoCoupons();

type OrderCheckoutScreenProps = {
  hasSavedAddress?: boolean;
  orderItem?: OrderItem;
  items?: OrderItem[];
  address?: ShippingAddress;
  summary?: PaymentSummary;
  coupons?: Coupon[];
  initialForm?: CheckoutForm | null;
  onFormChange?: (form: CheckoutForm) => void;
  onComplete?: (form: CheckoutForm, amount: number) => void;
};

export function OrderCheckoutScreen({
  hasSavedAddress = true,
  orderItem = DEMO_ORDER_ITEM,
  items,
  address = DEMO_ADDRESS,
  summary = DEMO_SUMMARY,
  coupons = DEMO_COUPONS,
  initialForm,
  onFormChange,
  onComplete,
}: OrderCheckoutScreenProps) {
  const [form, setForm] = useState<CheckoutForm>(
    () =>
      initialForm ?? {
        address: hasSavedAddress ? address : null,
        couponId: undefined,
        points: "",
        method: null,
        card: "",
        installment: "일시불",
      },
  );
  const [addressWarning, setAddressWarning] = useState(false);
  const [addressSheetOpen, setAddressSheetOpen] = useState(false);
  const [couponSheetOpen, setCouponSheetOpen] = useState(false);
  const [methodWarning, setMethodWarning] = useState("");
  const paying = useRef(false);
  useEffect(() => {
    onFormChange?.(form);
  }, [form, onFormChange]);
  function update(change: Partial<CheckoutForm>) {
    setForm((prev) => ({ ...prev, ...change }));
  }
  const orderAmount = Math.max(0, summary.fundingAmount - (summary.earlyBirdDiscount ?? 0));
  const selectedCoupon =
    coupons.find((coupon) => coupon.id === form.couponId && isCouponUsable(coupon, orderAmount)) ??
    null;
  const couponDiscount = selectedCoupon ? couponDiscountAmount(selectedCoupon, orderAmount) : 0;
  const couponSummary = { ...summary, couponDiscount };
  const usedPoints = clampPointUsage(
    Number(form.points),
    DEMO_POINT_BALANCE,
    maxPointUsage(couponSummary),
  );
  const effectiveSummary = { ...couponSummary, pointDiscount: usedPoints };
  const shippingState: ShippingSectionState = form.address
    ? "saved"
    : addressWarning
      ? "warning"
      : "empty";
  function handlePointInput(next: string) {
    const parsed = parsePointInput(next);
    if (parsed !== null)
      update({
        points: String(
          clampPointUsage(parsed, DEMO_POINT_BALANCE, maxPointUsage(couponSummary)) || "",
        ),
      });
  }
  function handlePay() {
    if (paying.current) return;
    if (!form.address) {
      setAddressWarning(true);
      document
        .getElementById(SHIPPING_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!form.method || (form.method === "credit_card" && !form.card)) {
      setMethodWarning(form.method ? "카드를 선택해주세요." : "결제 수단을 선택해주세요.");
      document
        .getElementById("checkout-method")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (onComplete) {
      paying.current = true;
      onComplete(form, finalPaymentAmount(effectiveSummary));
    }
  }
  return (
    <>
      <CheckoutLayout
        summary={<PaymentSummarySection rows={demoSummaryRows(effectiveSummary)} />}
        notice={
          <p className="text-caption-s text-text-secondary text-center">
            실제 결제가 발생하지 않는 데모입니다.
          </p>
        }
        ctaLabel={`${formatWon(finalPaymentAmount(effectiveSummary))} 결제하기`}
        onPay={handlePay}
      >
        <ShippingAddressSection
          id={SHIPPING_SECTION_ID}
          state={shippingState}
          address={form.address ?? address}
          onChangeAddress={() => setAddressSheetOpen(true)}
          onAddAddress={() => setAddressSheetOpen(true)}
        />
        <section className="bg-layer-surface-default flex flex-col">
          {(items ?? [orderItem]).map((item, index) => (
            <OrderItemSection key={index} item={item} />
          ))}
          <div className="px-5 pb-4">
            <Button
              type="button"
              variant="secondary"
              appearance="cta"
              size="md"
              className="w-full"
              onClick={() => setCouponSheetOpen(true)}
            >
              {selectedCoupon ? "쿠폰 변경" : "쿠폰 적용"}
            </Button>
            {selectedCoupon && <p className="text-body-s mt-2">{selectedCoupon.name} 사용중</p>}
          </div>
          <PointUsageSection
            value={usedPoints ? String(usedPoints) : ""}
            onChange={handlePointInput}
            balance={DEMO_POINT_BALANCE}
            maxUsable={maxPointUsage(couponSummary)}
          />
        </section>
        <div>
          <PaymentMethodSection
            form={form}
            onChange={(change) => {
              update(change);
              setMethodWarning("");
            }}
          />
          {methodWarning && (
            <p
              role="alert"
              className="text-text-warning bg-layer-surface-default px-5 pb-4 text-[14px]"
            >
              {methodWarning}
            </p>
          )}
        </div>
      </CheckoutLayout>
      <ShippingAddressSheet
        open={addressSheetOpen}
        onClose={() => setAddressSheetOpen(false)}
        initial={form.address}
        onSave={(next) => {
          update({ address: next });
          setAddressWarning(false);
          setAddressSheetOpen(false);
        }}
      />
      <CouponSheet
        open={couponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        coupons={coupons}
        orderAmount={orderAmount}
        selectedId={form.couponId === null ? null : selectedCoupon?.id}
        onApply={(couponId) => {
          update({ couponId });
          setCouponSheetOpen(false);
        }}
      />
    </>
  );
}

function OrderItemSection({ item }: { item: OrderItem }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <div className="flex gap-2">
        <Image
          src={item.image ?? "/images/checkout/product.png"}
          alt=""
          width={76}
          height={76}
          className="size-19 shrink-0 rounded-xs object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-body-m text-text-default truncate">{item.projectTitle}</p>
          <div className="text-body-s text-text-default flex flex-col gap-1">
            <span>
              {item.rewardName}
              {item.option ? ` · ${item.option}` : ""} · {item.quantity}개
            </span>
            {item.meta.length > 0 && (
              <span className="text-caption-s text-text-secondary flex flex-wrap items-center gap-1">
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

      <PriceInformation
        price={(item.price ?? item.originalPrice) * item.quantity}
        originalPrice={item.originalPrice * item.quantity}
      />
    </div>
  );
}

function PointUsageSection({
  value,
  onChange,
  balance,
  maxUsable,
}: {
  value: string;
  onChange: (next: string) => void;
  balance: number;
  maxUsable: number;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <h2 className="text-title-s text-text-default">적립금 사용</h2>
      <div className="flex items-center gap-2">
        <Input
          shape="compact"
          inputMode="numeric"
          placeholder="사용하실 적립금을 입력해주세요"
          aria-label="사용할 적립금"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          size="xl"
          className="shrink-0 px-2 text-[14px]!"
          onClick={() => onChange(String(Math.min(balance, maxUsable)))}
        >
          전체 사용
        </Button>
      </div>
      <p className="text-body-s">
        <span>사용가능 {formatWon(Math.min(balance, maxUsable))}</span>
        <span className="text-text-secondary"> / 보유 {formatWon(balance)}</span>
      </p>
    </div>
  );
}
