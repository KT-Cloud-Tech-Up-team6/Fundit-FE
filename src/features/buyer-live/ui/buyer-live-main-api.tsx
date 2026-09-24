"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicLives, type PublicLivesQuery } from "@/entities/live/api/public-live-api";
import { followsQueryKey, getAllFollows } from "@/entities/seller/api/follow-api";
import { useAuth } from "@/providers/auth-provider";
import {
  followSellerIds,
  pickNewOpen,
  pickUpcoming,
  withViewerCounts,
} from "../model/live-main-real";
import { BuyerLiveMain } from "./buyer-live-main";

function usePublicLives(query: PublicLivesQuery, enabled: boolean) {
  return (
    useQuery({
      queryKey: ["public-lives", query],
      queryFn: ({ signal }) => getPublicLives(query, signal),
      enabled,
    }).data?.content ?? []
  );
}

/* 실제 페이지 전용(#345). 섹션마다 실제 LIVE를 조회해 정해진 칸에 섞는다. 조회가 실패하거나 맞는
   LIVE가 없으면 그 섹션은 목업만 보인다(오류 안내 없음). Storybook은 BuyerLiveMain을 바로 그려
   이 조회가 돌지 않는다. */
export function BuyerLiveMainApi({ view = "live" }: { view?: "live" | "upcoming" }) {
  const upcoming = view === "upcoming";
  const { state } = useAuth();
  const memberId = state.status === "authenticated" ? state.user?.memberId : undefined;
  /* 팔로우 여부를 묻는 API가 없어 내 팔로우 목록 전체로 판단한다(LIVE 시청 화면과 같은 키).
     비로그인·0명·조회 실패면 팔로우 섹션을 숨긴다(Figma 1408:42072). */
  const follows = useQuery({
    queryKey: followsQueryKey(memberId),
    queryFn: ({ signal }) => getAllFollows(signal),
    enabled: memberId !== undefined,
  });
  const sellerIds = followSellerIds(follows.data ?? []);
  /* 예정 목록은 생성 최신순이라 화면을 연 시각 이후의 예정만 이른 순서로 고른다. */
  const [openedAt] = useState(Date.now);

  const newOpen = usePublicLives({}, !upcoming);
  const ranking = usePublicLives({ status: "LIVE", sort: "viewerCount" }, !upcoming);
  const following = usePublicLives(
    { status: upcoming ? "SCHEDULED" : "LIVE", sellerIds },
    sellerIds.length > 0,
  );
  const scheduled = usePublicLives({ status: "SCHEDULED" }, upcoming);

  return (
    <BuyerLiveMain
      view={view}
      hasFollowing={sellerIds.length > 0}
      real={{
        newOpen: withViewerCounts(pickNewOpen(newOpen), ranking),
        ranking,
        /* 예정 탭의 팔로우 칸도 날짜별 예정과 같이 아직 시작 시각이 오지 않은 예정만 이른 순서로 고른다.
           BE는 시각이 지나도 판매자가 시작하기 전까지 SCHEDULED로 둔다. */
        following: upcoming ? pickUpcoming(following, openedAt) : following,
        scheduled: pickUpcoming(scheduled, openedAt),
      }}
    />
  );
}
