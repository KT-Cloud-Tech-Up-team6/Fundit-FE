"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMyRefunds } from "@/entities/refund/api/refund-api";
import { MemberAccess } from "@/features/buyer-mypage/ui/member-access";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { previousPage } from "@/shared/lib/previous-page";
import {
  parseRefundFilterType,
  refundTypeOfFilter,
  toRefundEntry,
  type RefundFilterType,
} from "../model/refund-history";
import { BuyerRefunds, RefundsScreen } from "./buyer-refunds";

export function BuyerRefundsApi() {
  return (
    <MemberAccess>
      {(member) => <Refunds key={member.memberId} memberId={member.memberId} />}
    </MemberAccess>
  );
}

type RefundsQuery = { page: number; inProgress: boolean; type: RefundFilterType };

/** 필터는 서버 페이지 기준을 바꾸므로 URL에 두고, 바꾸면 첫 페이지로 돌아간다. */
function refundsHref({ page, inProgress, type }: RefundsQuery) {
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (inProgress) query.set("inProgress", "true");
  if (type !== "all") query.set("type", type);
  const text = query.toString();
  return text ? `/my/refunds?${text}` : "/my/refunds";
}

function Refunds({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const inProgress = params.get("inProgress") === "true";
  const type = parseRefundFilterType(params.get("type"));
  /* 페이지·필터를 바꾸는 동안 이전 목록을 유지해 화면이 로딩 문구로 깜빡이지 않게 한다. */
  const list = useQuery({
    queryKey: ["refunds", memberId, page, inProgress, type],
    queryFn: ({ signal }) =>
      getMyRefunds(page, { inProgress, type: refundTypeOfFilter(type) }, signal),
    placeholderData: keepPreviousData,
  });

  if (list.isPending || list.isError) {
    return (
      <RefundsScreen fullPage={list.isError}>
        {list.isPending ? (
          <p className="text-body-s px-5 py-24 text-center" role="status">
            취소/반품/교환 내역을 불러오고 있습니다.
          </p>
        ) : (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        )}
      </RefundsScreen>
    );
  }

  return (
    <BuyerRefunds
      entries={list.data.content.map(toRefundEntry)}
      total={list.data.totalElements}
      type={type}
      onTypeChange={(next) => router.push(refundsHref({ page: 1, inProgress, type: next }))}
      inProgress={inProgress}
      onInProgressChange={(checked) =>
        router.push(refundsHref({ page: 1, inProgress: checked, type }))
      }
      loading={list.isPlaceholderData}
    >
      {(page > 0 || list.data.hasNext) && (
        <div className="bg-layer-surface-default flex items-center justify-between gap-3 px-5 py-4">
          <Button
            disabled={page === 0 || list.isPlaceholderData}
            onClick={() =>
              router.push(
                refundsHref({ page: previousPage(page + 1, list.data), inProgress, type }),
              )
            }
          >
            이전 페이지
          </Button>
          {/* 목록 아래에서 이동을 누르면 필터 아래 안내가 화면 밖이라 여기에도 보인다.
              스크린리더 알림은 필터 아래 안내(role="status")가 맡으므로 중복해 읽히지 않게 숨긴다. */}
          {list.isPlaceholderData && (
            <span aria-hidden="true" className="text-caption-m text-text-secondary">
              목록을 불러오고 있습니다.
            </span>
          )}
          <Button
            disabled={!list.data.hasNext || list.isPlaceholderData}
            onClick={() => router.push(refundsHref({ page: page + 2, inProgress, type }))}
          >
            다음 페이지
          </Button>
        </div>
      )}
    </BuyerRefunds>
  );
}
