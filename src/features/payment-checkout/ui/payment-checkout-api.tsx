"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadTossPayments, type TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { createPayment, getOrder, orderStatusLabels } from "@/entities/order/api/order-api";
import { Button } from "@/shared/components/ui/button";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { isConfirmed, localStore, rememberAttempt, sessionStore } from "../model/payment-attempt";
import {
  createAttemptOutcome,
  isUserCancel,
  paymentWindowErrorMessage,
} from "../model/payment-result";
import { PaymentShell } from "./payment-shell";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

class NotPayableError extends Error {}

export function PaymentCheckoutApi({ orderId }: { orderId: string }) {
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <Payment key={`${memberId}:${orderId}`} memberId={memberId} orderId={orderId} />
      )}
    </OrderMemberAccess>
  );
}

function Payment({ memberId, orderId }: { memberId: string; orderId: string }) {
  /* 결제 시도는 서버가 PENDING 건을 재사용하므로 진입할 때마다 새로 요청해도 pgOrderId가 유지된다. */
  const attempt = useQuery({
    queryKey: ["payment-attempt", memberId, orderId],
    enabled: Boolean(CLIENT_KEY),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      // 승인 직후 주문 상태 반영(비동기) 전에는 서버도 PENDING이라 재결제를 여기서 막는다.
      if (isConfirmed(localStore(), orderId))
        throw new NotPayableError(
          "이미 결제가 완료되었습니다. 주문 상태를 반영하는 중이니 참여 내역에서 확인해주세요.",
        );
      const order = await getOrder(orderId, signal);
      if (order.status !== "PENDING")
        throw new NotPayableError(
          `결제할 수 없는 주문입니다. (${orderStatusLabels[order.status] ?? order.status})`,
        );
      const created = await createPayment(orderId);
      rememberAttempt(sessionStore(), created.pgOrderId, orderId, created.amount);
      return created;
    },
  });
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null),
    [widgetError, setWidgetError] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  const created = attempt.data;

  useEffect(() => {
    if (!created) return;
    let cancelled = false;
    const destroyers: (() => Promise<void>)[] = [];
    void (async () => {
      const toss = await loadTossPayments(CLIENT_KEY);
      if (cancelled) return;
      const instance = toss.widgets({ customerKey: memberId });
      await instance.setAmount({ currency: "KRW", value: created.amount });
      if (cancelled) return;
      // 하나만 실패해도 먼저 렌더된 위젯은 destroyers에 이미 쌓여 있어야 정리 시점에 함께 걷힌다.
      await Promise.all([
        instance
          .renderPaymentMethods({ selector: "#payment-method" })
          .then((widget) => destroyers.push(() => widget.destroy())),
        instance
          .renderAgreement({ selector: "#agreement" })
          .then((widget) => destroyers.push(() => widget.destroy())),
      ]);
      /* 렌더링이 끝나기 전에 정리 함수가 지나갔으면(StrictMode 이중 마운트) 여기서 직접 걷어낸다.
         남겨두면 다음 마운트의 renderPaymentMethods가 "이미 렌더링됨"으로 실패한다. */
      if (cancelled) return destroyAll();
      setWidgets(instance);
    })().catch(() => {
      if (!cancelled)
        setWidgetError("결제 수단을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.");
    });
    function destroyAll() {
      // 문서는 destroy 응답을 void/Promise로 섞어 적는다. 어느 쪽이든 던지지 않게 감싼다.
      for (const destroy of destroyers.splice(0))
        void Promise.resolve()
          .then(destroy)
          .catch(() => undefined);
    }
    return () => {
      cancelled = true;
      destroyAll();
    };
  }, [created, memberId]);

  useEffect(() => {
    /* 결제창에서 뒤로 가기로 돌아오면(bfcache 복원) 이동 중 잠가 둔 버튼을 풀어 재시도를 허용한다. */
    const restore = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      saving.current = false;
      setBusy(false);
    };
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  async function pay() {
    if (saving.current || !widgets || !created) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      const result = `${window.location.origin}/payment/result`;
      // 리다이렉트 방식: 성공·실패 모두 /payment/result로 복귀한다. 이동하는 동안 버튼은 잠근다.
      await widgets.requestPayment({
        orderId: created.pgOrderId,
        orderName: created.orderName,
        successUrl: result,
        failUrl: result,
      });
    } catch (reason) {
      setError(
        isUserCancel(reason)
          ? "결제를 취소했습니다."
          : (paymentWindowErrorMessage(reason) ??
              "결제창을 열지 못했습니다. 결제 수단과 약관 동의를 확인한 뒤 다시 시도해주세요."),
      );
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <PaymentShell title="결제">
      {!CLIENT_KEY ? (
        <p role="alert" className="bg-layer-surface-default p-5">
          결제 환경이 설정되지 않아 결제를 진행할 수 없습니다.
        </p>
      ) : attempt.isPending ? (
        <p role="status" className="bg-layer-surface-default p-5">
          결제를 준비하고 있습니다.
        </p>
      ) : attempt.isError ? (
        <section role="alert" className="bg-layer-surface-default space-y-3 p-5">
          <p>
            {attempt.error instanceof NotPayableError
              ? attempt.error.message
              : createAttemptOutcome(attempt.error)}
          </p>
          {!(attempt.error instanceof NotPayableError) && (
            <Button onClick={() => void attempt.refetch()}>다시 시도</Button>
          )}
          <Link className="block underline" href="/my/fundings">
            참여 내역 확인
          </Link>
        </section>
      ) : (
        <>
          <section className="bg-layer-surface-default space-y-2 p-5">
            <h2 className="text-title-s">주문 정보</h2>
            <p>{attempt.data.orderName}</p>
            <p className="text-title-s">
              결제 금액 {attempt.data.amount.toLocaleString("ko-KR")}원
            </p>
          </section>
          <section className="bg-layer-surface-default">
            <div id="payment-method" />
            <div id="agreement" />
            {widgetError ? (
              <p role="alert" className="p-5">
                {widgetError}
              </p>
            ) : (
              !widgets && (
                <p role="status" className="p-5">
                  결제 수단을 불러오고 있습니다.
                </p>
              )
            )}
          </section>
          <section className="bg-layer-surface-default space-y-3 p-5">
            {error && <p role="alert">{error}</p>}
            <Button disabled={!widgets || busy} onClick={() => void pay()} className="w-full">
              {busy
                ? "결제창으로 이동 중"
                : `${attempt.data.amount.toLocaleString("ko-KR")}원 결제하기`}
            </Button>
            <Link className="block underline" href="/my/fundings">
              참여 내역 확인
            </Link>
          </section>
        </>
      )}
    </PaymentShell>
  );
}
