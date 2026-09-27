"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getOrders, getOrder, ORDER_PAGE_SIZE } from "@/entities/order/api/order-api";
import { isConfirmed, localStore } from "@/features/payment-checkout/model/payment-attempt";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { previousPage } from "@/shared/lib/previous-page";
import { toFundingCard, toFundingDetailView } from "../model/funding-history";
import { FundingDetail, FundingDetailScreen } from "./funding-detail";
import { FundingHistoryList, FundingListScreen } from "./funding-history-list";

export function FundingListApi() {
  return <OrderMemberAccess>{(id) => <FundingList key={id} memberId={id} />}</OrderMemberAccess>;
}

function listHref(page: number) {
  return page > 1 ? `/my/fundings?page=${page}` : "/my/fundings";
}

function FundingList({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  /* 페이지를 바꾸는 동안 이전 목록을 유지해 화면이 로딩 문구로 깜빡이지 않게 한다. */
  const list = useQuery({
    queryKey: ["orders", memberId, page],
    queryFn: ({ signal }) => getOrders(page, signal),
    placeholderData: keepPreviousData,
  });

  if (list.isPending || list.isError) {
    return (
      <FundingListScreen fullPage={list.isError}>
        {list.isPending ? (
          <p className="text-body-s px-5 py-24 text-center" role="status">
            참여 내역을 불러오고 있습니다.
          </p>
        ) : (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        )}
      </FundingListScreen>
    );
  }

  const previous = previousPage(page + 1, {
    totalElements: list.data.totalElements,
    pageSize: ORDER_PAGE_SIZE,
  });
  return (
    <FundingHistoryList
      cards={list.data.content.map(toFundingCard)}
      total={list.data.totalElements}
      loading={list.isPlaceholderData}
    >
      {(page > 0 || list.data.hasNext) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <Button
            disabled={page === 0 || list.isPlaceholderData}
            onClick={() => router.push(listHref(previous))}
          >
            이전 페이지
          </Button>
          {/* 목록 아래에서 이동을 누르면 위 안내가 화면 밖이라 여기에도 보인다.
              스크린리더 알림은 위 안내(role="status")가 맡으므로 중복해 읽히지 않게 숨긴다. */}
          {list.isPlaceholderData && (
            <span aria-hidden="true" className="text-caption-m text-text-secondary">
              목록을 불러오고 있습니다.
            </span>
          )}
          <Button
            disabled={!list.data.hasNext || list.isPlaceholderData}
            onClick={() => router.push(listHref(page + 2))}
          >
            다음 페이지
          </Button>
        </div>
      )}
    </FundingHistoryList>
  );
}

export function FundingDetailApi({ fundingId }: { fundingId: string }) {
  return (
    <OrderMemberAccess>
      {(id) => <Detail key={`${id}:${fundingId}`} memberId={id} fundingId={fundingId} />}
    </OrderMemberAccess>
  );
}

function Detail({ memberId, fundingId }: { memberId: string; fundingId: string }) {
  const detail = useQuery({
    queryKey: ["order", memberId, fundingId],
    queryFn: ({ signal }) => getOrder(fundingId, signal),
  });

  if (detail.isPending || detail.isError) {
    return (
      <FundingDetailScreen fullPage={detail.isError}>
        {detail.isPending ? (
          <p className="text-body-s px-5 py-24 text-center" role="status">
            주문을 불러오고 있습니다.
          </p>
        ) : (
          <QueryErrorState
            error={detail.error}
            onRetry={() => void detail.refetch()}
            notFoundHref="/my/fundings"
          />
        )}
      </FundingDetailScreen>
    );
  }

  return (
    <FundingDetail detail={toFundingDetailView(detail.data)}>
      {/* 결제 대기 주문은 원본에 없지만 결제를 마칠 길이 필요하다. 승인 직후에는 주문 상태가
          Kafka로 늦게 반영되므로 재결제 대신 반영 중임을 알리고 새로고침을 둔다. */}
      {detail.data.status === "PENDING" && (
        <div className="flex flex-col gap-2 px-5 py-4">
          {isConfirmed(localStore(), fundingId) ? (
            <p role="status" className="text-body-s">
              결제가 완료되어 주문 상태를 반영하고 있습니다.
            </p>
          ) : (
            <Button href={`/payment/${fundingId}`}>결제하기</Button>
          )}
          <Button
            variant="secondary"
            disabled={detail.isFetching}
            onClick={() => void detail.refetch()}
          >
            주문 상태 새로고침
          </Button>
        </div>
      )}
    </FundingDetail>
  );
}
