"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCheckoutCoupons,
  previewOrder,
  type OrderRequest,
} from "@/entities/order/api/order-api";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { ErrorState } from "@/shared/components/ui/error-state";
import { CouponRadio } from "./coupon-sheet";
import { couponPreviewError } from "../model/coupon-preview";
import { couponConditions } from "../model/coupon-conditions";
import {
  couponCodes,
  hasConflictingCouponIssuer,
  removeCoupon,
  selectCoupon,
  type CouponSelection,
} from "../model/coupon-selection";
import styles from "./checkout-sheet.module.css";

export function CouponApiSheet({
  memberId,
  body,
  selected,
  onApply,
  onClose,
}: {
  memberId: string;
  body: OrderRequest;
  selected: CouponSelection[];
  onApply: (selection: CouponSelection[]) => void;
  onClose: () => void;
}) {
  const page = 0;
  const [choices, setChoices] = useState(selected);
  const [duplicateIssuerWarning, setDuplicateIssuerWarning] = useState(false);
  const coupons = useQuery({
    queryKey: ["checkout-coupons", memberId, page],
    queryFn: ({ signal }) => getCheckoutCoupons(page, signal),
  });
  const candidate = {
    ...body,
    couponCodes: couponCodes(choices),
  };
  const preview = useQuery({
    queryKey: ["coupon-preview", memberId, candidate],
    queryFn: () => previewOrder(candidate),
    enabled: candidate.couponCodes.length > 0,
  });
  const error = preview.data ? couponPreviewError(preview.data, candidate.couponCodes) : "";
  const canApply =
    !candidate.couponCodes.length || (preview.isSuccess && !preview.isFetching && !error);
  const warning = duplicateIssuerWarning ? "지금 사용하신 쿠폰은 중복 사용이 불가능합니다" : error;
  return (
    <BottomSheet
      open
      onClose={onClose}
      title="쿠폰 선택"
      desktopModal
      className={styles.sheet}
      footer={
        <Button
          className="w-full"
          appearance="cta"
          disabled={!canApply}
          onClick={() => {
            if (canApply) onApply(choices);
          }}
        >
          적용
        </Button>
      }
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">쿠폰 선택</legend>
        <CouponRadio
          label="사용하지 않음"
          inputType="checkbox"
          checked={choices.length === 0}
          onSelect={() => {
            setChoices([]);
            setDuplicateIssuerWarning(false);
          }}
        />
        {coupons.isPending ? (
          <p role="status">쿠폰을 불러오고 있습니다.</p>
        ) : coupons.isError ? (
          <ErrorState
            variant="section"
            description="쿠폰 조회를 실패하였습니다"
            action={{ onClick: () => void coupons.refetch() }}
          />
        ) : (
          coupons.data.content.map((coupon) => (
            <CouponRadio
              key={coupon.couponCode}
              label={coupon.couponName ?? coupon.couponCode}
              inputType="checkbox"
              checked={choices.some((item) => item.couponCode === coupon.couponCode)}
              onSelect={() => {
                if (hasConflictingCouponIssuer(choices, coupon)) {
                  setDuplicateIssuerWarning(true);
                  return;
                }
                setChoices((previous) =>
                  previous.some((item) => item.couponCode === coupon.couponCode)
                    ? removeCoupon(previous, coupon.couponCode)
                    : selectCoupon(previous, coupon),
                );
                setDuplicateIssuerWarning(false);
              }}
              disabled={coupon.status !== "AVAILABLE" || coupon.issuerType === null}
              {...couponConditions(coupon, body.projectId)}
            />
          ))
        )}
      </fieldset>
      {warning && (
        <p role="alert" className="text-body-s text-text-warning mt-3 text-center leading-[1.4]">
          {warning}
        </p>
      )}
      {coupons.isSuccess && !coupons.data.content.length && <p>사용가능한 쿠폰이 없습니다</p>}
    </BottomSheet>
  );
}
