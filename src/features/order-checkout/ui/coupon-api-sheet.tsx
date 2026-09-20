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
import { CouponRadio } from "./coupon-sheet";
import { couponPreviewError } from "../model/coupon-preview";
import styles from "./checkout-sheet.module.css";

export function CouponApiSheet({
  memberId,
  body,
  selectedCode,
  onApply,
  onClose,
}: {
  memberId: string;
  body: OrderRequest;
  selectedCode: string | null;
  onApply: (code: string | null) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(0);
  const [choice, setChoice] = useState(selectedCode);
  const coupons = useQuery({
    queryKey: ["checkout-coupons", memberId, page],
    queryFn: ({ signal }) => getCheckoutCoupons(page, signal),
  });
  const candidate = { ...body, couponCodes: choice ? [choice] : [] };
  const preview = useQuery({
    queryKey: ["coupon-preview", memberId, candidate],
    queryFn: () => previewOrder(candidate),
    enabled: Boolean(choice),
  });
  const error = preview.data ? couponPreviewError(preview.data, choice) : "";
  const canApply = !choice || (preview.isSuccess && !preview.isFetching && !error);
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
            if (canApply) onApply(choice);
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
          checked={choice === null}
          onSelect={() => setChoice(null)}
        />
        {coupons.isPending ? (
          <p role="status">쿠폰을 불러오고 있습니다.</p>
        ) : coupons.isError ? (
          <p role="alert">
            쿠폰 조회 실패. <button onClick={() => void coupons.refetch()}>다시 시도</button>
          </p>
        ) : (
          coupons.data.content.map((coupon) => (
            <CouponRadio
              key={coupon.couponCode}
              label={coupon.couponName ?? coupon.couponCode}
              checked={choice === coupon.couponCode}
              onSelect={() => setChoice(coupon.couponCode)}
              disabled={coupon.status !== "AVAILABLE"}
              expiry={
                coupon.expiresAt
                  ? `${new Date(coupon.expiresAt).toLocaleDateString("ko-KR")}까지 사용 가능`
                  : undefined
              }
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
      {choice && (
        <div className="mt-3" aria-live="polite">
          {preview.isPending || preview.isFetching ? (
            <p>쿠폰 적용 금액을 확인하고 있습니다.</p>
          ) : preview.isError ? (
            <p role="alert">
              쿠폰 확인 실패. <button onClick={() => void preview.refetch()}>다시 시도</button>
            </p>
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
