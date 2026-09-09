"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { isCouponUsable } from "../model/checkout-demo";
import type { Coupon } from "../model/checkout-demo";

type CouponSheetProps = {
  open: boolean;
  onClose: () => void;
  coupons: Coupon[];
  /** 사용 가능 여부 판정에 쓰는 이번 주문 금액(할인 전). */
  orderAmount: number;
  /** 현재 적용된 쿠폰 id. null = 사용 안 함. */
  selectedId: string | null;
  onApply: (couponId: string | null) => void;
};

/* "사용하지 않음"을 라디오 값으로 다루기 위한 센티널. null 과 매핑한다. */
const NONE = "__none__";

/* 쿠폰 선택 바텀시트 (FL_B_PY_CPN). 라디오 단일 선택 → 저장 시 주문서 요약에 반영.
   최소 주문액 미달 쿠폰은 비활성(회색)으로 표시. */
export function CouponSheet({
  open,
  onClose,
  coupons,
  orderAmount,
  selectedId,
  onApply,
}: CouponSheetProps) {
  const [choice, setChoice] = useState<string>(selectedId ?? NONE);

  /* 닫았다 다시 열면 현재 적용값으로 되돌린다. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setChoice(selectedId ?? NONE);
  }

  function submit() {
    onApply(choice === NONE ? null : choice);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      aria-labelledby="coupon-sheet-title"
      footer={
        <Button className="w-full" appearance="cta" onClick={submit}>
          저장
        </Button>
      }
    >
      <h2 id="coupon-sheet-title" className="text-title-s text-text-default mb-6 text-center">
        쿠폰 선택
      </h2>

      {coupons.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-10">
          <div className="bg-layer-surface-disabled size-28 rounded-md" aria-hidden />
          <p className="text-title-s text-text-default">사용가능한 쿠폰이 없습니다</p>
        </div>
      ) : (
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">쿠폰 선택</legend>

          <CouponRadio
            label="사용하지 않음"
            checked={choice === NONE}
            onSelect={() => setChoice(NONE)}
          />

          {coupons.map((coupon) => {
            const usable = isCouponUsable(coupon, orderAmount);
            return (
              <CouponRadio
                key={coupon.id}
                label={coupon.name}
                badge={coupon.badge}
                condition={coupon.conditionLabel}
                expiry={coupon.expiryLabel}
                disabled={!usable}
                checked={choice === coupon.id}
                onSelect={() => setChoice(coupon.id)}
              />
            );
          })}
        </fieldset>
      )}
    </BottomSheet>
  );
}

function CouponRadio({
  label,
  badge,
  condition,
  expiry,
  disabled = false,
  checked,
  onSelect,
}: {
  label: string;
  badge?: string;
  condition?: string;
  expiry?: string;
  disabled?: boolean;
  checked: boolean;
  onSelect: () => void;
}) {
  const tone = disabled ? "text-text-disabled" : "text-text-default";
  const subTone = disabled ? "text-text-disabled" : "text-text-secondary";

  return (
    <label
      className={[
        "border-w-xs flex gap-3 rounded-xs px-4 py-3",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        checked ? "border-border-primary" : "border-border-default",
      ].join(" ")}
    >
      <input
        type="radio"
        name="coupon-choice"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        aria-label={label}
      />
      <span
        aria-hidden
        className={[
          "peer-focus-visible:outline-border-primary relative mt-0.5 size-5 shrink-0 rounded-full peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
          checked ? "bg-layer-surface-primary" : "border-w-xs border-border-default",
        ].join(" ")}
      >
        {checked && (
          <span className="border-text-inverse absolute top-1/2 left-1/2 h-2 w-1.5 -translate-x-1/2 -translate-y-[60%] rotate-45 border-r-2 border-b-2" />
        )}
      </span>

      <span className={`flex min-w-0 flex-1 flex-col gap-1 ${tone}`}>
        <span className="flex items-center gap-2">
          <span className="text-body-m font-medium">{label}</span>
          {badge && (
            <span className="text-label-m bg-layer-surface-disabled text-text-default shrink-0 rounded-full px-2 py-1">
              {badge}
            </span>
          )}
        </span>
        {condition && <span className={`text-body-s ${subTone}`}>{condition}</span>}
        {expiry && <span className={`text-caption-s ${subTone}`}>{expiry}</span>}
      </span>
    </label>
  );
}
