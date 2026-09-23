"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getMyRefunds } from "@/entities/refund/api/refund-api";
import { MemberAccess } from "@/features/buyer-mypage/ui/member-access";
import { Button } from "@/shared/components/ui/button";
import { toRefundEntry } from "../model/refund-history";
import { BuyerRefunds, RefundsScreen } from "./buyer-refunds";

export function BuyerRefundsApi() {
  return (
    <MemberAccess>
      {(member) => <Refunds key={member.memberId} memberId={member.memberId} />}
    </MemberAccess>
  );
}

/** 진행 중 필터는 서버 페이지 기준이 바뀌므로 URL에 두고, 바꾸면 첫 페이지로 돌아간다. */
function refundsHref(page: number, inProgress: boolean) {
  const query = new URLSearchParams();
  if (page > 1) query.set("page", String(page));
  if (inProgress) query.set("inProgress", "true");
  const text = query.toString();
  return text ? `/my/refunds?${text}` : "/my/refunds";
}

function Refunds({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const inProgress = params.get("inProgress") === "true";
  /* 페이지를 넘기는 동안 이전 목록을 유지한다. 목록이 언마운트되면 화면이 들고 있는
     유형 필터가 기본값으로 풀린다. */
  const list = useQuery({
    queryKey: ["refunds", memberId, page, inProgress],
    queryFn: ({ signal }) => getMyRefunds(page, inProgress, signal),
    placeholderData: keepPreviousData,
  });

  if (list.isPending || list.isError) {
    return (
      <RefundsScreen>
        <p className="text-body-s px-5 py-24 text-center">
          {list.isPending ? (
            <span role="status">취소/환불/교환 내역을 불러오고 있습니다.</span>
          ) : (
            <span role="alert">
              취소/환불/교환 내역 조회 실패.{" "}
              <button className="underline" onClick={() => void list.refetch()}>
                다시 시도
              </button>
            </span>
          )}
        </p>
      </RefundsScreen>
    );
  }

  return (
    <BuyerRefunds
      entries={list.data.content.map(toRefundEntry)}
      total={list.data.totalElements}
      inProgress={{
        checked: inProgress,
        onChange: (checked) => router.push(refundsHref(1, checked)),
      }}
    >
      {(page > 0 || list.data.hasNext) && (
        <div className="bg-layer-surface-default flex items-center justify-between gap-3 px-5 py-4">
          <Button
            disabled={page === 0 || list.isPlaceholderData}
            onClick={() => router.push(refundsHref(page, inProgress))}
          >
            이전 페이지
          </Button>
          {/* 아직 이전 페이지가 보이는 동안, 누른 이동이 진행 중임을 알린다. */}
          {list.isPlaceholderData && (
            <span role="status" className="text-caption-m text-text-secondary">
              목록을 불러오고 있습니다.
            </span>
          )}
          <Button
            disabled={!list.data.hasNext || list.isPlaceholderData}
            onClick={() => router.push(refundsHref(page + 2, inProgress))}
          >
            다음 페이지
          </Button>
        </div>
      )}
    </BuyerRefunds>
  );
}
