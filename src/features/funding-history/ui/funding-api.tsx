"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrders,
  getOrder,
  cancelOrder,
  orderStatusLabels,
} from "@/entities/order/api/order-api";
import { isConfirmed, localStore } from "@/features/payment-checkout/model/payment-attempt";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";

export function FundingListApi() {
  return <OrderMemberAccess>{(id) => <FundingList key={id} memberId={id} />}</OrderMemberAccess>;
}
function FundingList({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const status = Object.hasOwn(orderStatusLabels, params.get("status") ?? "")
    ? params.get("status")!
    : "";
  const list = useQuery({
    queryKey: ["orders", memberId, page, status],
    queryFn: ({ signal }) => getOrders(page, status, signal),
  });
  function move(next: number, nextStatus = status) {
    router.push(
      `/my/fundings?${new URLSearchParams({ page: String(next + 1), status: nextStatus })}`,
    );
  }
  return (
    <BuyerAccountScreen title="참여/배송 내역">
      <div className="space-y-4 p-5">
        <select
          aria-label="상태 필터"
          value={status}
          onChange={(event) => move(0, event.target.value)}
        >
          <option value="">전체</option>
          {Object.entries(orderStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {list.isPending ? (
          <p role="status">참여 내역을 불러오고 있습니다.</p>
        ) : list.isError ? (
          <QueryErrorState
            variant="section"
            error={list.error}
            description="참여 내역을 불러오지 못했습니다."
            onRetry={() => void list.refetch()}
          />
        ) : (
          <>
            <p>총 {list.data.totalElements}개</p>
            {!list.data.content.length && <p>참여 내역이 없습니다.</p>}
            {list.data.content.map((order) => (
              <article
                className="border-border-default space-y-2 border-b py-3"
                key={order.orderId}
              >
                <h2 className="text-title-s">{order.projectTitle || "프로젝트"}</h2>
                <p>{orderStatusLabels[order.status] ?? order.status}</p>
                <p>최종 금액 {order.finalAmount.toLocaleString("ko-KR")}원</p>
                <p>{order.createdAt.slice(0, 10)}</p>
                <Link className="block underline" href={`/my/fundings/${order.orderId}`}>
                  참여 상세
                </Link>
                <Link className="block underline" href={`/projects/${order.projectId}`}>
                  프로젝트 보기
                </Link>
              </article>
            ))}
            <div className="flex justify-between">
              <Button disabled={page === 0} onClick={() => move(page - 1)}>
                이전 페이지
              </Button>
              <Button disabled={!list.data.hasNext} onClick={() => move(page + 1)}>
                다음 페이지
              </Button>
            </div>
          </>
        )}
      </div>
    </BuyerAccountScreen>
  );
}
export function FundingDetailApi({
  fundingId,
  cancel = false,
}: {
  fundingId: string;
  cancel?: boolean;
}) {
  return (
    <OrderMemberAccess>
      {(id) => (
        <Detail key={`${id}:${fundingId}`} memberId={id} fundingId={fundingId} cancel={cancel} />
      )}
    </OrderMemberAccess>
  );
}
function Detail({
  memberId,
  fundingId,
  cancel,
}: {
  memberId: string;
  fundingId: string;
  cancel: boolean;
}) {
  const client = useQueryClient(),
    router = useRouter();
  const detail = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false);
  async function cancelFunding() {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await cancelOrder(fundingId);
      await client.invalidateQueries({ queryKey: ["order", memberId, fundingId] });
      await client.invalidateQueries({ queryKey: ["orders", memberId] });
      router.replace(`/my/fundings/${fundingId}`);
    } catch {
      setError("처리 결과를 확인하지 못했습니다. 주문 상태를 다시 확인해주세요.");
      await detail.refetch();
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <BuyerAccountScreen
      title={cancel ? "펀딩 취소" : "펀딩 상세 내역"}
      backHref="/my/fundings"
      fullPage={detail.isError}
    >
      {detail.isError ? (
        <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />
      ) : (
        <div className="space-y-4 p-5">
          {detail.isPending ? (
            <p role="status">주문을 불러오고 있습니다.</p>
          ) : (
            <>
              <p className="break-all">주문번호 {detail.data.orderId}</p>
              <p className="text-title-s">
                {orderStatusLabels[detail.data.status] ?? detail.data.status}
              </p>
              {detail.data.lineItems.map((item, index) => (
                <article className="border-border-default space-y-2 border-b py-3" key={index}>
                  <h2>{item.rewardName}</h2>
                  <p>
                    {item.options
                      .map((option) => `${option.optionGroupName} ${option.optionValue}`)
                      .join(" · ")}
                  </p>
                  <p>
                    {item.quantity}개 · {item.unitPrice.toLocaleString("ko-KR")}원
                  </p>
                </article>
              ))}
              <section className="space-y-2">
                <h2 className="text-title-s">금액</h2>
                <p>배송비 {detail.data.shippingFee.toLocaleString("ko-KR")}원</p>
                <p>할인 {detail.data.discountAmount.toLocaleString("ko-KR")}원</p>
                <p>최종 금액 {detail.data.finalAmount.toLocaleString("ko-KR")}원</p>
              </section>
              <section className="space-y-2">
                <h2 className="text-title-s">배송지</h2>
                <p>
                  {detail.data.shippingAddress.recipientName} ·{" "}
                  {detail.data.shippingAddress.phoneNumber}
                </p>
                <p>
                  {detail.data.shippingAddress.addressLine1}{" "}
                  {detail.data.shippingAddress.addressLine2}
                </p>
              </section>
              {error && <p role="alert">{error}</p>}
              {cancel ? (
                detail.data.availableActions.includes("CANCEL") ? (
                  <>
                    <p>펀딩 참여를 취소하시겠습니까?</p>
                    <Button disabled={busy} onClick={() => void cancelFunding()}>
                      참여 취소 확인
                    </Button>
                  </>
                ) : (
                  <p>이 주문은 취소할 수 없습니다.</p>
                )
              ) : (
                <>
                  {detail.data.status === "GOAL_ACHIEVED" && (
                    <Link
                      className="block underline"
                      href={`/my/fundings/${fundingId}/fulfillment`}
                    >
                      제작·배송 현황
                    </Link>
                  )}
                  {detail.data.availableActions.includes("CANCEL") && (
                    <Link className="block underline" href={`/my/fundings/${fundingId}/cancel`}>
                      참여 취소
                    </Link>
                  )}
                  {/* BE가 상태·배송 여부로 정한 신청 가능 액션이다(Funding.availableActions). */}
                  {detail.data.availableActions.includes("DEFECT_REFUND_REQUEST") && (
                    <Link
                      className="block underline"
                      href={`/my/fundings/${fundingId}/refund/new?type=defect`}
                    >
                      반품·교환 신청
                    </Link>
                  )}
                  {detail.data.availableActions.includes("SHIPPING_DELAY_REFUND_REQUEST") && (
                    <Link
                      className="block underline"
                      href={`/my/fundings/${fundingId}/refund/new?type=delay`}
                    >
                      배송 지연 취소 신청
                    </Link>
                  )}
                  {detail.data.status === "PENDING" &&
                    (isConfirmed(localStore(), fundingId) ? (
                      <p role="status">결제가 완료되어 주문 상태를 반영하고 있습니다.</p>
                    ) : (
                      <Button href={`/payment/${fundingId}`}>결제하기</Button>
                    ))}
                  <Button
                    disabled={busy || detail.isFetching}
                    onClick={() => void detail.refetch()}
                  >
                    주문 상태 새로고침
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </BuyerAccountScreen>
  );
}
