"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, getOrder } from "@/entities/order/api/order-api";
import {
  getRefundEstimate,
  requestShippingDelayRefund,
} from "@/entities/refund/api/refund-request-api";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { cancelErrorMessage, toFundingCancelDetail } from "../model/funding-cancel";
import { FundingCancel, type FundingCancelSubmit } from "./funding-cancel";

/** 실제 주문(UUID)의 펀딩 취소(FL_B_MY_FUND_CL_1~3)와 발송 지연 취소(CL_1-1).
    어느 화면을 열지는 주문 상세의 `availableActions`가 정한다. */
export function FundingCancelApi({ fundingId }: { fundingId: string }) {
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <CancelRequest key={`${memberId}:${fundingId}`} memberId={memberId} fundingId={fundingId} />
      )}
    </OrderMemberAccess>
  );
}

function CancelRequest({ memberId, fundingId }: { memberId: string; fundingId: string }) {
  const client = useQueryClient(),
    router = useRouter();
  const order = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
  });
  /* 취소 두 화면은 전액 환불 기준이라 유형 없이 조회한다. 결제 전 주문(404) 등으로 실패하면
     화면은 열어 두고 환불 정보만 숨긴다. */
  const estimate = useQuery({
    queryKey: ["refund-estimate", memberId, fundingId, {}],
    queryFn: ({ signal }) => getRefundEstimate(fundingId, {}, signal),
    retry: false,
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  const detailHref = `/my/fundings/${fundingId}`;

  async function submit(input: FundingCancelSubmit) {
    if (input.kind === "return-request" || saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      if (input.kind === "cancel") await cancelOrder(fundingId, input.body);
      else await requestShippingDelayRefund(fundingId);
      /* 취소·발송 지연 취소 모두 환불 내역에 한 건이 생긴다. */
      await client.invalidateQueries({ queryKey: ["order", memberId, fundingId] });
      await client.invalidateQueries({ queryKey: ["orders", memberId] });
      await client.invalidateQueries({ queryKey: ["refunds", memberId] });
      router.replace(detailHref);
    } catch (failure) {
      setError(cancelErrorMessage(failure));
      /* 결과를 알 수 없는 실패도 있어 주문 상태를 다시 받아 가능한 화면으로 맞춘다. */
      await order.refetch();
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  const screen = {
    title: "펀딩 취소",
    backHref: detailHref,
    backLabel: "펀딩 상세로 돌아가기",
    breadcrumb: ["마이페이지", "펀딩내역", "펀딩 취소"],
  };

  if (order.isPending || order.isError) {
    return (
      <BuyerAccountScreen {...screen} fullPage={order.isError}>
        {order.isPending ? (
          <p className="text-body-s px-5 py-24 text-center" role="status">
            주문을 불러오고 있습니다.
          </p>
        ) : (
          <QueryErrorState error={order.error} onRetry={() => void order.refetch()} />
        )}
      </BuyerAccountScreen>
    );
  }

  const actions = order.data.availableActions;
  const variant = actions.includes("CANCEL")
    ? "cancel"
    : actions.includes("SHIPPING_DELAY_REFUND_REQUEST")
      ? "shipping-delay"
      : null;

  if (!variant) {
    return (
      <BuyerAccountScreen {...screen}>
        <div className="flex flex-col items-center gap-4 px-5 py-24 text-center">
          <p className="text-body-m text-text-default">이 주문은 취소할 수 없습니다.</p>
          {error && (
            <p role="alert" className="text-body-s text-text-default">
              {error}
            </p>
          )}
          <Button
            href={detailHref}
            variant="secondary"
            appearance="cta"
            size="lg"
            className="w-[189px]"
          >
            펀딩 상세로 돌아가기
          </Button>
        </div>
      </BuyerAccountScreen>
    );
  }

  return (
    <FundingCancel
      fundingId={fundingId}
      variant={variant}
      detail={toFundingCancelDetail(order.data)}
      estimate={estimate.data ?? null}
      onSubmit={(input) => void submit(input)}
      pending={pending}
      submitError={error}
    />
  );
}
