"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMyRefunds } from "@/entities/refund/api/refund-api";
import { MemberAccess } from "@/features/buyer-mypage/ui/member-access";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { Button } from "@/shared/components/ui/button";
import { toRefundEntry } from "../model/refund-history";
import { BuyerRefunds } from "./buyer-refunds";

const breadcrumb = ["마이페이지", "펀딩내역", "취소/환불/교환 내역"];

export function BuyerRefundsApi() {
  return (
    <MemberAccess>
      {(member) => <Refunds key={member.memberId} memberId={member.memberId} />}
    </MemberAccess>
  );
}

function Refunds({ memberId }: { memberId: string }) {
  const params = useSearchParams(),
    router = useRouter();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const list = useQuery({
    queryKey: ["refunds", memberId, page],
    queryFn: ({ signal }) => getMyRefunds(page, signal),
  });

  if (list.isPending || list.isError) {
    return (
      <BuyerAccountScreen title="취소/환불/교환 내역" breadcrumb={breadcrumb}>
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
      </BuyerAccountScreen>
    );
  }

  return (
    <BuyerRefunds entries={list.data.content.map(toRefundEntry)} total={list.data.totalElements}>
      {(page > 0 || list.data.hasNext) && (
        <div className="bg-layer-surface-default flex justify-between px-5 py-4">
          <Button disabled={page === 0} onClick={() => router.push(`/my/refunds?page=${page}`)}>
            이전 페이지
          </Button>
          <Button
            disabled={!list.data.hasNext}
            onClick={() => router.push(`/my/refunds?page=${page + 2}`)}
          >
            다음 페이지
          </Button>
        </div>
      )}
    </BuyerRefunds>
  );
}
