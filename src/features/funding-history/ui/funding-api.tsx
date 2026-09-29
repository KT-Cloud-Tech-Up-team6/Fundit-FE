"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllOrders, getOrders, getOrder, ORDER_PAGE_SIZE } from "@/entities/order/api/order-api";
import { isConfirmed, localStore } from "@/features/payment-checkout/model/payment-attempt";
import { OrderMemberAccess } from "@/features/order-checkout/ui/order-member-access";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { previousPage } from "@/shared/lib/previous-page";
import { koreanDateKey, toFundingCard, toFundingDetailView } from "../model/funding-history";
import {
  categoryStages,
  categoryStatuses,
  fundingHistoryHref,
  pageByStages,
  parseFundingHistoryQuery,
  type FundingHistoryQuery,
} from "../model/funding-history-filter";
import { FundingDetail, FundingDetailScreen } from "./funding-detail";
import { FundingHistoryList, FundingListScreen } from "./funding-history-list";

export function FundingListApi() {
  return <OrderMemberAccess>{(id) => <FundingList key={id} memberId={id} />}</OrderMemberAccess>;
}

function FundingList({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  /* 최근 N개월의 끝인 오늘(한국 날짜)은 화면을 연 날로 고정한다. */
  const [today] = useState(() => koreanDateKey(new Date()));
  const client = useQueryClient();
  const query = parseFundingHistoryQuery(params, today);
  const { q, from, to, category, page } = query;
  /* 조건·페이지를 바꾸는 동안 이전 목록을 유지해 화면이 로딩 문구로 깜빡이지 않게 한다. */
  const list = useQuery({
    queryKey: ["orders", memberId, page, q, from, to, category],
    queryFn: async ({ signal }) => {
      const filter = { q, from, to, status: categoryStatuses(category) };
      const stages = categoryStages(category);
      if (!stages) return { ...(await getOrders(page - 1, filter, signal)), truncated: false };
      /* 서버는 진행 단계로 거르지 못해 목표 달성 주문을 모두 받아 화면에서 거르고 20건씩 나눈다.
         받은 목록은 조건별로 잠시 캐시해 페이지·단계를 바꿀 때마다 다시 받지 않는다. */
      const all = await client.fetchQuery({
        queryKey: ["orders", memberId, "all", q, from, to, filter.status],
        queryFn: ({ signal: allSignal }) => getAllOrders(filter, allSignal),
        staleTime: 60_000,
      });
      return {
        ...pageByStages(all.content, stages, page, ORDER_PAGE_SIZE),
        truncated: all.truncated,
      };
    },
    placeholderData: keepPreviousData,
  });

  /* 조건은 URL에 두어 새로고침·뒤로가기로 되돌아온다. 같은 조건을 다시 고르면 기록을 쌓지 않는다. */
  function go(next: FundingHistoryQuery) {
    const href = fundingHistoryHref(next);
    if (href !== fundingHistoryHref(query)) router.push(href);
  }

  if (list.isError) {
    return (
      <FundingListScreen fullPage>
        <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
      </FundingListScreen>
    );
  }

  const data = list.data;
  const previous = data
    ? previousPage(page, { totalElements: data.totalElements, pageSize: ORDER_PAGE_SIZE })
    : 1;
  return (
    <FundingHistoryList
      cards={data?.content.map(toFundingCard) ?? []}
      total={data?.totalElements ?? 0}
      filter={query}
      today={today}
      /* 검색어·기간·분류를 바꾸면 첫 페이지부터 본다. */
      onSearch={(next) => go({ ...query, q: next, page: 1 })}
      onPeriodChange={(range) => go({ ...query, ...range, page: 1 })}
      onCategoryChange={(next) => go({ ...query, category: next, page: 1 })}
      pending={list.isPending}
      loading={list.isPlaceholderData}
      truncated={data?.truncated}
    >
      {data && (page > 1 || data.hasNext) && (
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <Button
            disabled={page === 1 || list.isPlaceholderData}
            onClick={() => go({ ...query, page: previous })}
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
            disabled={!data.hasNext || list.isPlaceholderData}
            onClick={() => go({ ...query, page: page + 1 })}
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
