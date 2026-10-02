"use client";

import { useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getPublicLives, type PublicLivesQuery } from "@/entities/live/api/public-live-api";
import { getPublicProject } from "@/entities/project/api/buyer-project-api";
import { followsQueryKey, getAllFollows } from "@/entities/seller/api/follow-api";
import { useAuth } from "@/providers/auth-provider";
import {
  followSellerIds,
  pickDemoLive,
  pickNewOpen,
  pickUpcoming,
  rankingProjectIds,
  withViewerCounts,
  type RankingProject,
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
  /* 시연 칸(PM 2026-09-29): 실시간 순위 4위 카드는 가장 최근에 만든 방송 중 LIVE로 간다. 신규 오픈의 전체 상태
     최신순 첫 페이지에서 고르면 그 뒤에 예정·종료 LIVE가 20건 넘게 생겼을 때 방송 중 LIVE를 놓치므로, 방송 중만
     최신순으로 따로 받는다(#447 CodeRabbit 리뷰). */
  const demo = pickDemoLive(usePublicLives({ status: "LIVE" }, !upcoming));
  /* 실시간 순위 실제 카드의 제목(프로젝트명)·대분류·달성률은 LIVE 목록에 없어 보이는 칸과 시연 칸의 프로젝트
     상세를 한 번씩 읽는다(#445·#558). BE 시더가 넣은 목업 달성률이고, 상세 화면과 같은 키라 카드와 상세의 값이
     같다. */
  const projectIds = rankingProjectIds(ranking, demo);
  const rankingProjectResults = useQueries({
    queries: projectIds.map((projectId) => ({
      queryKey: ["public-project", projectId],
      queryFn: ({ signal }) => getPublicProject(projectId, signal),
    })),
  });
  const rankingProjects = new Map<string, RankingProject>();
  rankingProjectResults.forEach(({ data }, index) => {
    if (!data) return;
    rankingProjects.set(projectIds[index], {
      title: data.title?.trim() || undefined,
      category: data.categoryMajor ?? undefined,
      achievementRate: data.fundingStatus.achievementRate,
    });
  });
  const following = usePublicLives(
    { status: upcoming ? "SCHEDULED" : "LIVE", sellerIds },
    sellerIds.length > 0,
  );
  const scheduled = usePublicLives({ status: "SCHEDULED" }, upcoming);

  return (
    <BuyerLiveMain
      view={view}
      openedAt={openedAt}
      hasFollowing={sellerIds.length > 0}
      real={{
        newOpen: withViewerCounts(pickNewOpen(newOpen), ranking),
        ranking,
        /* 최신순 목록에는 시청자 수가 없어 실시간 순위에서 같은 LIVE의 수를 붙인다. */
        demo: demo && withViewerCounts([demo], ranking)[0],
        rankingProjects,
        /* 예정 탭의 팔로우 칸도 날짜별 예정과 같이 아직 시작 시각이 오지 않은 예정만 이른 순서로 고른다.
           BE는 시각이 지나도 판매자가 시작하기 전까지 SCHEDULED로 둔다. */
        following: upcoming ? pickUpcoming(following, openedAt) : following,
        scheduled: pickUpcoming(scheduled, openedAt),
      }}
    />
  );
}
