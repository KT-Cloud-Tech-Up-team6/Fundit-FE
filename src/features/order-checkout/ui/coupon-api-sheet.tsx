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
  const [page, setPage] = useState(0);
  const [choices, setChoices] = useState(selected);
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
      <p className="text-body-s text-text-secondary">
        플랫폼·메이커 쿠폰은 각각 1개까지 선택할 수 있습니다.
      </p>
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">쿠폰 선택</legend>
        <CouponRadio
          label="사용하지 않음"
          inputType="checkbox"
          checked={choices.length === 0}
          onSelect={() => setChoices([])}
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
              badge={
                coupon.issuerType === "PLATFORM"
                  ? "플랫폼"
                  : coupon.issuerType === "MAKER"
                    ? "메이커"
                    : "발급자 확인 필요"
              }
              inputType="checkbox"
              checked={choices.some((item) => item.couponCode === coupon.couponCode)}
              onSelect={() =>
                setChoices((previous) =>
                  previous.some((item) => item.couponCode === coupon.couponCode)
                    ? removeCoupon(previous, coupon.couponCode)
                    : selectCoupon(previous, coupon),
                )
              }
              disabled={coupon.status !== "AVAILABLE" || coupon.issuerType === null}
              {...couponConditions(coupon, body.projectId)}
            />
          ))
        )}
      </fieldset>
      {coupons.isSuccess && !coupons.data.content.length && <p>사용가능한 쿠폰이 없습니다</p>}
      <div className="mt-3 flex justify-between">
        <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>
          이전 쿠폰
        </Button>
        <Button
          variant="secondary"
          disabled={!coupons.isSuccess || !coupons.data.hasNext}
          onClick={() => setPage(page + 1)}
        >
          다음 쿠폰
        </Button>
      </div>
      {candidate.couponCodes.length > 0 && (
        <div className="mt-3" aria-live="polite">
          {preview.isPending || preview.isFetching ? (
            <p>쿠폰 적용 금액을 확인하고 있습니다.</p>
          ) : preview.isError ? (
            <ErrorState
              variant="section"
              description="쿠폰 확인을 실패하였습니다"
              action={{ onClick: () => void preview.refetch() }}
            />
          ) : error ? (
            <p role="alert">{error}</p>
          ) : (
            <p>쿠폰 적용 후 {preview.data.finalAmount.toLocaleString("ko-KR")}원</p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
