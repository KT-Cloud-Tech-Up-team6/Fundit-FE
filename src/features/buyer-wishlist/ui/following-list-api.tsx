"use client";

import { useEffect, useRef, useState } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getPublicLives } from "@/entities/live/api/public-live-api";
import {
  followSeller,
  followsQueryKey,
  getFollows,
  unfollowSeller,
  type FollowedSeller,
} from "@/entities/seller/api/follow-api";
import { SellerRow } from "@/entities/seller/ui/seller-row";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import {
  displayedFollowings,
  displayedFollowingTotal,
  followingRowSeller,
  liveBadgeBatches,
  liveSellerIds,
} from "../model/following";

/* 관심 목록 팔로잉 탭(#398, Figma FL_B_LK_LIST_2 1249:24108). 행은 이름·팔로워 수·♥(#427, BE PR #173)·
   LIVE 배지(#444, BE PR #185)와 [팔로잉]을 채운다. 프로필 이미지는 BE에 업로드 경로가 없어 기본 이미지다.
   판매자 상세 목적지가 없어 행은 이동하지 않고(배지도 표시만 한다), 광고는 찜 탭 실제 화면처럼 두지
   않는다(노션 FE 자체 판단 89·92). */
export function FollowingListApi({
  memberId,
  unfollowed,
  onUnfollowedChange,
}: {
  memberId: string;
  unfollowed: ReadonlyMap<string, FollowedSeller>;
  onUnfollowedChange: (
    change: (previous: ReadonlyMap<string, FollowedSeller>) => Map<string, FollowedSeller>,
  ) => void;
}) {
  const client = useQueryClient();
  const key = ["member-follows", memberId];
  const list = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) => getFollows(pageParam, signal),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const saving = useRef(false),
    sentinel = useRef<HTMLDivElement>(null);
  const { fetchNextPage, hasNextPage, isFetching } = list;
  const fetched = list.data?.pages.flatMap((page) => page.content) ?? [];
  const follows = displayedFollowings(fetched, unfollowed);
  const total = displayedFollowingTotal(
    list.data?.pages[0]?.totalElements ?? 0,
    fetched,
    unfollowed,
  );
  /* 방송 중 여부는 보이는 판매자로 공개 LIVE 목록(`status=LIVE`)을 거른다. 목록을 더 불러오거나 해제로
     행이 바뀌면 다시 묻고, 그동안은 앞선 결과로 배지를 둔다. 조회가 실패하면 배지만 빼고 목록은 그대로다. */
  const sellerIds = follows.map(({ sellerId }) => sellerId);
  const liveSellers = useQuery({
    queryKey: ["following-live-sellers", sellerIds],
    queryFn: async ({ signal }) =>
      liveSellerIds(
        await Promise.all(
          liveBadgeBatches(sellerIds).map((batch) =>
            getPublicLives({ status: "LIVE", sellerIds: batch }, signal),
          ),
        ),
      ),
    enabled: sellerIds.length > 0,
    placeholderData: keepPreviousData,
  });
  const liveIds = new Set(liveSellers.data);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetching || list.isFetchNextPageError || list.isRefetchError)
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          void fetchNextPage();
        }
      },
      { rootMargin: "0px 0px 240px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetching, list.isFetchNextPageError, list.isRefetchError]);

  /* 해제한 행은 화면 상태로 남기고, LIVE 화면이 쓰는 공용 목록만 갱신한다. */
  async function change(seller: FollowedSeller, following: boolean) {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      if (following) await followSeller(seller.sellerId);
      else await unfollowSeller(seller.sellerId);
      onUnfollowedChange((previous) => {
        const next = new Map(previous);
        if (following) next.delete(seller.sellerId);
        else next.set(seller.sellerId, seller);
        return next;
      });
      /* 해제 뒤 서버 페이지 경계가 앞당겨지므로, 이 목록도 다시 읽어 다음 페이지의 항목이
         건너뛰지 않게 한다. 해제한 행은 unfollowed 상태로 따로 남는다. */
      await Promise.all([
        client.invalidateQueries({ queryKey: key }),
        client.invalidateQueries({ queryKey: followsQueryKey(memberId) }),
      ]);
    } catch {
      setError(
        following
          ? "다시 팔로우하지 못했습니다. 다시 시도해주세요."
          : "팔로우 해제에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {list.isPending && !list.data ? (
        <p role="status">팔로우한 판매자를 불러오고 있습니다.</p>
      ) : list.isError && !list.data ? (
        <QueryErrorState
          variant="section"
          error={list.error}
          description="팔로우한 판매자를 불러오지 못했습니다."
          onRetry={() => void list.refetch()}
        />
      ) : (
        <>
          <p className="text-text-disabled text-body-s">총 {total}개</p>
          {list.isRefetchError && (
            <QueryErrorState
              variant="section"
              error={list.error}
              description="팔로우한 판매자 목록을 다시 불러오지 못했습니다."
              onRetry={() => void list.refetch()}
            />
          )}
          {follows.length ? (
            <div>
              {follows.map((seller) => {
                const isUnfollowed = unfollowed.has(seller.sellerId);
                return (
                  <SellerRow
                    key={seller.sellerId}
                    seller={followingRowSeller(seller, liveIds.has(seller.sellerId))}
                    following={!isUnfollowed}
                    followLabel={isUnfollowed ? "다시 팔로우" : undefined}
                    followUnavailable={busy}
                    onFollow={() => void change(seller, isUnfollowed)}
                  />
                );
              })}
            </div>
          ) : (
            <p className="py-24 text-center">팔로우한 판매자가 없습니다.</p>
          )}
          {list.hasNextPage && !list.isRefetchError && (
            <div ref={sentinel} aria-hidden className="h-6" />
          )}
          {list.isFetchingNextPage && <p role="status">팔로우한 판매자를 더 불러오고 있습니다.</p>}
          {list.isFetchNextPageError && (
            <QueryErrorState
              variant="section"
              error={list.error}
              description="팔로우한 판매자를 더 불러오지 못했습니다."
              onRetry={() => void list.fetchNextPage()}
            />
          )}
        </>
      )}
    </>
  );
}
