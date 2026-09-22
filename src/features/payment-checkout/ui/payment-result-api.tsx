"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { confirmPayment, getOrder } from "@/entities/order/api/order-api";
import { Button } from "@/shared/components/ui/button";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import {
  localStore,
  markConfirmed,
  recallAttempt,
  recallAttemptAmount,
  recallLastAttempt,
  sessionStore,
} from "../model/payment-attempt";
import {
  confirmOutcome,
  failureOutcome,
  type PaymentOutcome,
  type PaymentResultParams,
} from "../model/payment-result";
import { PaymentShell } from "./payment-shell";

type Params = Exclude<PaymentResultParams, { kind: "none" }>;

const INVALID: PaymentOutcome = {
  message: "결제 정보를 확인할 수 없습니다. 참여 내역에서 주문 상태를 확인해주세요.",
  next: "check",
};
const AMOUNT_MISMATCH: PaymentOutcome = {
  message: "결제 금액 정보를 확인할 수 없습니다. 다시 결제해주세요.",
  next: "retry",
};

export function PaymentResultApi({ params }: { params: Params }) {
  return (
    <OrderMemberAccess>
      {(memberId) => <Result key={memberId} memberId={memberId} params={params} />}
    </OrderMemberAccess>
  );
}

function Result({ memberId, params }: { memberId: string; params: Params }) {
  const router = useRouter();
  // 승인에 성공하면 응답의 fundingId(주문 UUID)를 채운다. Toss 쿼리의 orderId는 pgOrderId라 쓸 수 없다.
  const [fundingId, setFundingId] = useState(""),
    [confirmFailure, setConfirmFailure] = useState<PaymentOutcome | null>(null),
    [confirmRequest, retryConfirm] = useState(0);
  const requested = useRef(false);
  // SDK도 requestPayment에 설정한 금액과 successUrl 금액 대조를 요구한다. 저장소가 막힌 경우에는
  // 기존처럼 BE의 금액 검증에 맡기되, 같은 탭에서 기억한 시도라면 승인 요청 전에 차단한다.
  const amountMismatch = useMemo(() => {
    if (params.kind !== "confirm") return false;
    const expectedAmount = recallAttemptAmount(sessionStore(), params.orderId);
    return expectedAmount !== null && expectedAmount !== params.amount;
  }, [params]);

  useEffect(() => {
    // 새로고침·StrictMode 재실행에도 승인 요청은 한 번만 보낸다. 같은 paymentKey는 BE에서도 멱등이다.
    if (params.kind !== "confirm" || requested.current) return;
    requested.current = true;
    if (amountMismatch) return;
    confirmPayment({
      paymentKey: params.paymentKey,
      orderId: params.orderId,
      amount: params.amount,
    })
      .then((result) => {
        if (result.status !== "COMPLETED") throw new Error("unexpected payment status");
        markConfirmed(localStore(), result.fundingId);
        setFundingId(result.fundingId);
      })
      .catch((reason: unknown) => setConfirmFailure(confirmOutcome(reason)));
  }, [params, confirmRequest, amountMismatch]);

  /* 승인 직후에는 order-service 상태 반영이 비동기라 주문이 잠시 PENDING으로 남는다.
     반영을 확인한 뒤 상세로 이동하고, 그 전에는 재결제 진입점을 노출하지 않는다. */
  const order = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
    enabled: Boolean(fundingId),
    // 실패도 함께 세지 않으면 조회가 계속 실패할 때 2초 폴링이 끝나지 않는다.
    refetchInterval: (query) =>
      (query.state.data && query.state.data.status !== "PENDING") ||
      query.state.dataUpdateCount + query.state.errorUpdateCount >= 10
        ? false
        : 2000,
  });
  const reflected = Boolean(order.data && order.data.status !== "PENDING");
  const [stalled, setStalled] = useState(false);
  useEffect(() => {
    if (!fundingId) return;
    const timer = setTimeout(() => setStalled(true), 20_000);
    return () => clearTimeout(timer);
  }, [fundingId]);
  useEffect(() => {
    if (reflected) router.replace(`/payment/result?orderId=${fundingId}`);
  }, [reflected, fundingId, router]);

  if (params.kind === "confirm" && !confirmFailure && !amountMismatch) {
    return (
      <PaymentShell title="결제 결과">
        {fundingId ? (
          <section role="status" className="bg-layer-surface-default space-y-3 p-5">
            <h2 className="text-title-s">결제가 완료되었습니다</h2>
            <p>주문 상태를 반영하고 있습니다. 잠시 후 자동으로 이동합니다.</p>
            {stalled && !reflected && (
              <p>반영이 지연되고 있습니다. 참여 내역에서 주문 상태를 확인해주세요.</p>
            )}
            <Link className="block underline" href={`/my/fundings/${fundingId}`}>
              펀딩 상세 보기
            </Link>
          </section>
        ) : (
          <p role="status" className="bg-layer-surface-default p-5">
            결제를 확인하고 있습니다. 창을 닫거나 새로고침하지 마세요.
          </p>
        )}
      </PaymentShell>
    );
  }

  const outcome =
    params.kind === "fail"
      ? failureOutcome(params)
      : ((amountMismatch ? AMOUNT_MISMATCH : confirmFailure) ?? INVALID);
  // Toss 복귀 URL의 orderId는 pgOrderId다. 결제 화면에서 기억해 둔 주문으로만 재결제 링크를 만든다.
  // 결제창을 닫아 취소하면 orderId가 오지 않으므로 그때는 가장 최근 시도를 쓴다.
  const orderUuid =
    params.kind === "fail" || params.kind === "confirm"
      ? params.orderId
        ? recallAttempt(sessionStore(), params.orderId)
        : recallLastAttempt(sessionStore())
      : null;
  return (
    <PaymentShell title="결제 결과">
      <section role="alert" className="bg-layer-surface-default space-y-3 p-5">
        <h2 className="text-title-s">결제가 완료되지 않았습니다</h2>
        <p>{outcome.message}</p>
        {outcome.next === "retry" && orderUuid && (
          <Button href={`/payment/${orderUuid}`} className="w-full">
            다시 결제하기
          </Button>
        )}
        {outcome.next === "recheck" && params.kind === "confirm" && (
          <Button
            onClick={() => {
              requested.current = false;
              setConfirmFailure(null);
              retryConfirm((count) => count + 1);
            }}
            className="w-full"
          >
            결제 확인 다시 시도
          </Button>
        )}
        <Link className="block underline" href="/my/fundings">
          참여 내역 확인
        </Link>
      </section>
    </PaymentShell>
  );
}
