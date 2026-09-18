"use client";

import Image from "next/image";
import { Button } from "@/shared/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ORDER_COMPLETE_REDIRECT_SECONDS,
  demoOrderReceipt,
  formatWon,
} from "../model/checkout-demo";
import type { OrderReceipt } from "../model/checkout-demo";
import { CheckoutTopBar } from "./checkout-top-bar";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";

const DEMO_RECEIPT = demoOrderReceipt();
const FUNDING_HISTORY_PATH = "/my/fundings";

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
  const [shareNotice, setShareNotice] = useState("");
  async function shareProject() {
    if (!receipt.projectId) return;
    const url = new URL(
      `/projects/${encodeURIComponent(receipt.projectId)}`,
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      setShareNotice("프로젝트 링크를 복사했습니다.");
    } catch {
      setShareNotice(`프로젝트 링크: ${url}`);
    }
  }

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
    if (redirectSeconds > 0 && remaining === 0) router.replace(FUNDING_HISTORY_PATH);
  }, [remaining, redirectSeconds, router]);

  const rows: [string, string][] = [
    ["주문번호", receipt.orderId],
    ["주문상품", receipt.itemSummary],
    ["결제금액", formatWon(receipt.paidAmount)],
    ["배송지", receipt.shippingAddress],
    ["주문자", `${receipt.ordererName} · ${receipt.ordererPhone}`],
  ];

  return (
    /* 모바일은 기존 390px 컬럼, 데스크톱은 라이브·상세와 같은 헤더와 넓은 여백을 쓴다. */
    <div className="bg-layer-bg min-[1200px]:bg-layer-surface-default min-h-dvh w-full">
      <BuyerDesktopHeader />
      <div className="bg-layer-surface-default mx-auto flex min-h-dvh w-full max-w-[390px] flex-col min-[1200px]:min-h-[calc(100dvh-70px)] min-[1200px]:max-w-none">
        <div className="min-[1200px]:hidden">
          <CheckoutTopBar />
        </div>

        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col items-center gap-8 px-5 pt-12 pb-8 min-[1200px]:max-w-[560px] min-[1200px]:pt-28">
          <div className="flex w-full flex-col items-center gap-10 min-[1200px]:gap-12">
            <div className="flex size-28 shrink-0 items-center justify-center" aria-hidden>
              <Image src="/images/checkout/complete.svg" alt="" width={102} height={102} />
            </div>
            <div className="flex w-full flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-title-s text-text-default text-center">
                  펀딩 참여가 완료되었어요
                </h2>
                <p className="text-body-s text-text-secondary">{receipt.completeMessage}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-body-m text-text-default font-medium">
                  예상 발송일 {receipt.expectedShippingDate}
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <dl className="bg-layer-bg flex min-h-[180px] w-full flex-col justify-center gap-3 rounded-xs p-4">
              {rows.map(([label, value]) => (
                <div key={label} className="flex items-center gap-3">
                  <dt className="text-body-s text-text-secondary w-[50px] shrink-0 leading-[1.42]">
                    {label}
                  </dt>
                  <dd
                    title={value}
                    className="text-body-s text-text-default min-w-0 truncate leading-[1.42]"
                  >
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            {redirectSeconds > 0 && (
              <p className="text-body-s text-text-secondary p-2 text-center">
                <strong className="font-semibold">{remaining}초</strong> 후 펀딩내역 화면으로 자동
                이동합니다
              </p>
            )}
          </div>
        </div>

        {shareNotice && (
          <p role="status" className="text-body-s px-5 py-2 break-all">
            {shareNotice}
          </p>
        )}
        <div className="bg-layer-surface-default sticky bottom-0 mx-auto flex w-full max-w-[390px] gap-2 px-5 py-2 pb-[calc(8px+env(safe-area-inset-bottom))] min-[1200px]:max-w-[560px] min-[1200px]:pb-8">
          <Button
            variant="secondary"
            appearance="cta"
            className="flex-1"
            disabled={!receipt.projectId}
            onClick={shareProject}
          >
            프로젝트 공유
          </Button>
          <Button
            appearance="cta"
            className="flex-1"
            onClick={() => router.replace(FUNDING_HISTORY_PATH)}
          >
            펀딩내역 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
