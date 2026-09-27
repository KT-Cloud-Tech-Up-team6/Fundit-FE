"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder } from "@/entities/order/api/order-api";
import {
  getRefundEstimate,
  requestDefectRefund,
  requestExchange,
  requestReturn,
  uploadRefundEvidence,
} from "@/entities/refund/api/refund-request-api";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import {
  estimateParamsFor,
  refundRequestErrorMessage,
  toFundingCancelDetail,
  type ReturnRequestTarget,
} from "../model/funding-cancel";
import { FundingCancel, type FundingCancelSubmit } from "./funding-cancel";

/** 실제 주문(UUID)의 리워드 반품/교환 신청(FL_B_MY_FUND_CL_4~8). */
export function FundingRefundApi({ fundingId }: { fundingId: string }) {
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <RefundRequest key={`${memberId}:${fundingId}`} memberId={memberId} fundingId={fundingId} />
      )}
    </OrderMemberAccess>
  );
}

function RefundRequest({ memberId, fundingId }: { memberId: string; fundingId: string }) {
  const client = useQueryClient(),
    router = useRouter();
  const order = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
  });
  /* 유형·사유마다 서버 금액이 달라 고른 조합으로 다시 조회한다. 예상 금액은 부가 정보라 실패해도
     폼은 열어 두고 금액 영역만 숨긴다. 이전 조합의 값을 잠시라도 보이지 않도록 이전 데이터를
     유지하지 않는다. */
  const [target, setTarget] = useState<ReturnRequestTarget | null>(null);
  const params = target ? estimateParamsFor(target) : null;
  const estimate = useQuery({
    queryKey: ["refund-estimate", memberId, fundingId, params],
    queryFn: ({ signal }) => getRefundEstimate(fundingId, params ?? {}, signal),
    enabled: params !== null,
    retry: false,
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  /* 업로드가 끝난 증빙의 fileUrl. 제출 재시도에서 중복 업로드를 막는다. */
  const uploadedRef = useRef(new Map<File, string>());

  async function submit(input: FundingCancelSubmit) {
    if (input.kind !== "return-request" || saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      const evidenceUrls: string[] = [];
      for (const file of input.files) {
        /* 제출이 실패해 다시 보낼 때 같은 파일을 또 올리지 않는다. 발급 주소는 5분 뒤
           만료되지만 올라간 fileUrl은 그대로 쓸 수 있다. */
        const uploaded =
          uploadedRef.current.get(file) ?? (await uploadRefundEvidence(fundingId, file));
        uploadedRef.current.set(file, uploaded);
        evidenceUrls.push(uploaded);
      }
      const reasonDetail = input.reasonDetail || undefined;
      const { target } = input;
      if (target.kind === "return") {
        await requestReturn({
          fundingId,
          returnReason: target.returnReason,
          reasonDetail,
          evidenceUrls,
        });
      } else if (target.kind === "defect") {
        await requestDefectRefund({
          fundingId,
          defectType: target.defectType,
          reasonDetail,
          evidenceUrls,
        });
      } else {
        await requestExchange({
          fundingId,
          exchangeReason: target.exchangeReason,
          reasonDetail,
          evidenceUrls,
        });
      }
      await client.invalidateQueries({ queryKey: ["refunds", memberId] });
      await client.invalidateQueries({ queryKey: ["order", memberId, fundingId] });
      router.push("/my/refunds");
    } catch (failure) {
      setError(refundRequestErrorMessage(failure));
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  if (order.isPending || order.isError) {
    return (
      <BuyerAccountScreen
        title="리워드 반품/교환"
        backHref={`/my/fundings/${fundingId}`}
        backLabel="펀딩 상세로 돌아가기"
        breadcrumb={["마이페이지", "펀딩내역", "리워드 반품/교환"]}
        fullPage={order.isError}
      >
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

  return (
    <FundingCancel
      fundingId={fundingId}
      variant="return"
      detail={toFundingCancelDetail(order.data)}
      estimate={estimate.data ?? null}
      onTargetChange={setTarget}
      onSubmit={(input) => void submit(input)}
      pending={pending}
      submitError={error}
    />
  );
}
