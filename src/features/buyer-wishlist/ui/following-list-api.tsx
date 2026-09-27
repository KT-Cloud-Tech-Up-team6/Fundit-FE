"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FOLLOW_LIST_PAGE_SIZE,
  followSeller,
  followsQueryKey,
  getFollows,
  unfollowSeller,
  type FollowedSeller,
} from "@/entities/seller/api/follow-api";
import { SellerRow } from "@/entities/seller/ui/seller-row";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { previousPage } from "@/shared/lib/previous-page";
import { followingName } from "../model/following";

/* 관심 목록 팔로잉 탭(#384, Figma FL_B_LK_LIST_2 1249:24108). 목록 응답에 아바타·팔로워 수·♥·방송 중
   여부가 없어 행은 이름과 [팔로잉]만 채운다(노션 FE 자체 판단 89). 판매자 상세 목적지가 없어 행은
   이동하지 않고, 광고는 찜 탭 실제 화면처럼 두지 않는다(92). */
export function FollowingListApi({ memberId, page }: { memberId: string; page: number }) {
  const router = useRouter(),
    client = useQueryClient();
  const key = ["member-follows", memberId];
  const list = useQuery({
    queryKey: [...key, page],
    queryFn: ({ signal }) => getFollows(page, signal),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [removed, setRemoved] = useState<FollowedSeller | null>(null);
  const saving = useRef(false);
  /* 해제는 확인 없이 보내고 찜 탭처럼 되돌릴 수 있게 둔다(90). 팔로우·해제는 idempotent라 실패해도
     서버에 반영됐을 수 있어 늘 다시 읽고, LIVE 화면이 쓰는 팔로우 목록도 함께 맞춘다. */
  async function change(seller: FollowedSeller, following: boolean) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (following) await followSeller(seller.sellerId);
      else await unfollowSeller(seller.sellerId);
      setRemoved(following ? null : seller);
    } catch {
      setError(
        following
          ? "다시 팔로우하지 못했습니다. 다시 시도해주세요."
          : "팔로우 해제에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: followsQueryKey(memberId) }),
      ]);
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {removed && (
        <div role="status">
          {followingName(removed)} 팔로우를 해제했습니다.{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => void change(removed, true)}
            className="underline"
          >
            다시 팔로우
          </button>
        </div>
      )}
      {list.isPending ? (
        <p role="status">팔로우한 판매자를 불러오고 있습니다.</p>
      ) : list.isError ? (
        <QueryErrorState
          variant="section"
          error={list.error}
          description="팔로우한 판매자를 불러오지 못했습니다."
          onRetry={() => void list.refetch()}
        />
      ) : (
        <>
          <p className="text-text-disabled text-body-s">총 {list.data.totalElements}개</p>
          {list.data.content.length ? (
            <div>
              {list.data.content.map((seller) => (
                <SellerRow
                  key={seller.sellerId}
                  seller={{ id: seller.sellerId, name: followingName(seller) }}
                  following
                  followUnavailable={busy}
                  onFollow={() => void change(seller, false)}
                />
              ))}
            </div>
          ) : (
            <p className="py-24 text-center">팔로우한 판매자가 없습니다.</p>
          )}
          <div className="flex justify-between">
            <Button
              disabled={page === 0}
              onClick={() => {
                const previous = previousPage(page + 1, {
                  totalElements: list.data.totalElements,
                  pageSize: FOLLOW_LIST_PAGE_SIZE,
                });
                router.push(`/my/wishlist?tab=sellers&page=${previous}`);
              }}
            >
              이전 페이지
            </Button>
            <Button
              disabled={!list.data.hasNext}
              onClick={() => router.push(`/my/wishlist?tab=sellers&page=${page + 2}`)}
            >
              다음 페이지
            </Button>
          </div>
        </>
      )}
    </>
  );
}
