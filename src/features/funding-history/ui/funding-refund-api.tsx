"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder } from "@/entities/order/api/order-api";
import {
  RefundEvidenceValidationError,
  getRefundEstimate,
  requestDefectRefund,
  requestExchange,
  requestShippingDelayRefund,
  requestSimpleChangeOfMindRefund,
  uploadRefundEvidence,
} from "@/entities/refund/api/refund-request-api";
import { ApiError } from "@/shared/api/api-error";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import {
  exchangeReasonDetail,
  toRefundInfo,
  type RefundInfo,
  type ReturnType,
} from "../model/funding-cancel";
import { FundingCancel, type FundingCancelSubmit } from "./funding-cancel";

const emptyRefund: RefundInfo = {
  pointRefundAmount: null,
  shippingFee: null,
  cancelFee: null,
  actualRefundAmount: null,
};

export function FundingRefundApi({
  fundingId,
  initialReturnType,
  initialReason,
}: {
  fundingId: string;
  initialReturnType: ReturnType | "";
  initialReason: string;
}) {
  return (
    <OrderMemberAccess>
      {(memberId) => (
        <RefundRequest
          key={`${memberId}:${fundingId}`}
          memberId={memberId}
          fundingId={fundingId}
          initialReturnType={initialReturnType}
          initialReason={initialReason}
        />
      )}
    </OrderMemberAccess>
  );
}

function RefundRequest({
  memberId,
  fundingId,
  initialReturnType,
  initialReason,
}: {
  memberId: string;
  fundingId: string;
  initialReturnType: ReturnType | "";
  initialReason: string;
}) {
  const client = useQueryClient(),
    router = useRouter();
  const order = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
  });
  /* 예상 환불액은 부가 정보다. 결제가 완료되지 않은 주문 등에서 실패해도 폼은 열어 두고
     환불 정보 행만 비운다. */
  const estimate = useQuery({
    queryKey: ["refund-estimate", memberId, fundingId],
    queryFn: ({ signal }) => getRefundEstimate(fundingId, signal),
    retry: false,
  });

  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);
  /* 업로드가 끝난 증빙의 fileUrl. 제출 재시도에서 중복 업로드를 막는다. */
  const uploadedRef = useRef(new Map<File, string>());

  async function submit({ submission, reason, reasonDetail, files }: FundingCancelSubmit) {
    if (!submission.supported || saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      if (submission.kind === "shipping-delay") {
        await requestShippingDelayRefund(fundingId);
      } else if (submission.kind === "simple-change-of-mind") {
        await requestSimpleChangeOfMindRefund(fundingId);
      } else {
        const evidenceUrls: string[] = [];
        for (const file of files) {
          /* 제출이 실패해 다시 보낼 때 같은 파일을 또 올리지 않는다. 발급 주소는 5분 뒤
             만료되지만 올라간 fileUrl은 그대로 쓸 수 있다. */
          const uploaded =
            uploadedRef.current.get(file) ?? (await uploadRefundEvidence(fundingId, file));
          uploadedRef.current.set(file, uploaded);
          evidenceUrls.push(uploaded);
        }
        if (submission.kind === "exchange") {
          await requestExchange({
            fundingId,
            reasonDetail: exchangeReasonDetail(reason, reasonDetail),
            evidenceUrls,
          });
        } else {
          await requestDefectRefund({
            fundingId,
            defectType: submission.defectType,
            reasonDetail,
            evidenceUrls,
          });
        }
      }
      await client.invalidateQueries({ queryKey: ["refunds", memberId] });
      await client.invalidateQueries({ queryKey: ["order", memberId, fundingId] });
      router.push("/my/refunds");
    } catch (failure) {
      setError(
        failure instanceof RefundEvidenceValidationError
          ? failure.message
          : failure instanceof ApiError && failure.code === "ALREADY_SHIPPED"
            ? "이미 발송이 시작되어 단순변심으로 접수할 수 없습니다. 다른 사유를 선택해주세요."
            : "신청을 접수하지 못했습니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  if (order.isPending || order.isError) {
    return (
      <BuyerAccountScreen
        title="펀딩 반품/교환"
        backHref={`/my/fundings/${fundingId}`}
        breadcrumb={["마이페이지", "펀딩내역", "펀딩 반품/교환"]}
      >
        <p className="text-body-s px-5 py-24 text-center">
          {order.isPending ? (
            <span role="status">주문을 불러오고 있습니다.</span>
          ) : (
            <span role="alert">
              주문 조회 실패.{" "}
              <button className="underline" onClick={() => void order.refetch()}>
                다시 시도
              </button>
            </span>
          )}
        </p>
      </BuyerAccountScreen>
    );
  }

  const [first, ...rest] = order.data.lineItems;
  const options = first?.options.map((o) => `${o.optionGroupName} ${o.optionValue}`) ?? [];
  /* 원본 헤더는 상품 한 줄이라 BE 목록의 표시 규칙(리워드명 외 N건)을 따른다. */
  const rewardOption = first
    ? [first.rewardName, ...options].join(" · ") + (rest.length ? ` 외 ${rest.length}건` : "")
    : "";

  return (
    <FundingCancel
      fundingId={fundingId}
      variant="return"
      initialReturnType={initialReturnType}
      initialReason={initialReason}
      detail={{
        /* project-service 조회가 실패하면 둘 다 null로 온다. 그때는 자리만 남긴다. */
        imageSrc: order.data.thumbnailUrl ?? "",
        projectTitle: order.data.projectTitle ?? "",
        rewardOption,
        rewardQuantity: first?.quantity ?? null,
        amount: order.data.finalAmount,
      }}
      refund={estimate.data ? toRefundInfo(estimate.data) : emptyRefund}
      onSubmit={(input) => void submit(input)}
      pending={pending}
      submitError={error}
    />
  );
}
