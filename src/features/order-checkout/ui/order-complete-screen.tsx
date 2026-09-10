"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ORDER_COMPLETE_REDIRECT_SECONDS,
  demoOrderReceipt,
  formatWon,
} from "../model/checkout-demo";
import type { OrderReceipt } from "../model/checkout-demo";
import { CheckoutTopBar } from "./checkout-top-bar";

const DEMO_RECEIPT = demoOrderReceipt();
const FUNDING_HISTORY_PATH = "/my/fundings";

/* Figma btn_share_project / btn_view_funding_history: bg #ededed, Medium 16, rounded 4, h≈44. */
const bottomButtonClasses = [
  "bg-layer-surface-disabled text-text-default text-body-m font-medium",
  "flex h-11 flex-1 items-center justify-center rounded-xs whitespace-nowrap",
  "enabled:hover:bg-layer-surface-disabled-hover",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
  "disabled:text-text-disabled disabled:cursor-not-allowed",
].join(" ");

type OrderCompleteScreenProps = {
  receipt?: OrderReceipt;
  /** 펀딩내역으로 자동 이동하기까지의 초. 0 이하면 자동 이동 안 함(스토리용). */
  redirectSeconds?: number;
};

/* 주문 완료 화면 (FL_B_PY_CMPL). PG 이후 랜딩(/payment/result).
   N초 카운트다운 후 펀딩내역으로 자동 이동. 결제 데이터는 목업. */
export function OrderCompleteScreen({
  receipt = DEMO_RECEIPT,
  redirectSeconds = ORDER_COMPLETE_REDIRECT_SECONDS,
}: OrderCompleteScreenProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(redirectSeconds);

  /* 카운트다운만 담당한다. 상태 업데이터는 순수하게 두고 이동은 아래 effect가 한다. */
  useEffect(() => {
    if (redirectSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [redirectSeconds]);

  /* 0초가 되면 펀딩내역으로 이동. */
  useEffect(() => {
    if (redirectSeconds > 0 && remaining === 0) router.push(FUNDING_HISTORY_PATH);
  }, [remaining, redirectSeconds, router]);

  const rows: [string, string][] = [
    ["주문번호", receipt.orderId],
    ["주문상품", receipt.itemSummary],
    ["결제금액", formatWon(receipt.paidAmount)],
    ["배송지", receipt.shippingAddress],
    ["주문자", `${receipt.ordererName} · ${receipt.ordererPhone}`],
  ];

  return (
    /* 다른 소비자 화면처럼 바깥 배경은 회색, 가운데 390 컬럼만 흰색. 그래픽·영수증 카드는 회색(#ededed). */
    <div className="bg-layer-bg min-h-dvh w-full">
      <div className="bg-layer-surface-default mx-auto flex min-h-dvh w-full max-w-[390px] flex-col">
        <CheckoutTopBar />

        <div className="flex flex-1 flex-col items-center gap-6 px-5 pt-16">
          <div className="flex w-full flex-col items-center gap-9">
            {/* Figma: 112×112 그래픽 자리 */}
            <div className="bg-layer-surface-disabled size-28 shrink-0" aria-hidden />
            <div className="flex w-full flex-col items-center gap-3">
              <h2 className="text-heading-s text-text-default text-center">
                펀딩 참여가 완료됐어요!
              </h2>
              <div className="flex flex-col items-center gap-1">
                <p className="text-caption-s text-text-default">{receipt.completeMessage}</p>
                <p className="text-body-m text-text-default font-medium">
                  예상 발송일 {receipt.expectedShippingDate}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-1">
            <dl className="bg-layer-surface-disabled flex w-full flex-col gap-3 rounded-xs p-4">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-caption-s text-text-secondary shrink-0">{label}</dt>
                  <dd className="text-caption-s text-text-default truncate text-right">{value}</dd>
                </div>
              ))}
            </dl>
            {redirectSeconds > 0 && (
              <p className="text-caption-strong text-text-secondary p-2 text-center">
                {remaining}초 후 펀딩내역 화면으로 자동 이동합니다
              </p>
            )}
          </div>
        </div>

        <div className="bg-layer-surface-default sticky bottom-0 flex gap-2 px-5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
          {/* 공유 연동(프로젝트 URL·제목 필요)은 후속 — 그 전까지 비활성. */}
          <button type="button" className={bottomButtonClasses} disabled>
            프로젝트 공유하기
          </button>
          <button
            type="button"
            className={bottomButtonClasses}
            onClick={() => router.push(FUNDING_HISTORY_PATH)}
          >
            펀딩내역 보기
          </button>
        </div>
      </div>
    </div>
  );
}
