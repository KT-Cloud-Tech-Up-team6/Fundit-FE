"use client";

import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getHomeFeed, getPublicProject } from "@/entities/project/api/buyer-project-api";
import { isPublicUuid } from "@/shared/lib/public-uuid";
import { getPublicLives, type PublicLivesQuery } from "@/entities/live/api/public-live-api";
import { featuredCard, liveCard, type SectionData } from "../model/home-cards";
import { BuyerHome } from "./buyer-home";

/** PC 5열 격자의 Figma 카드 수(`2315:71635`). 모바일은 같은 목록을 가로로 넘긴다. */
const HOME_FEED_SIZE = 8;

/* LIVE 메인의 실시간 순위와 같은 조건·키라 두 화면이 캐시를 함께 쓴다. `/home/lives`는 시청자 수가
   항상 비어 있어 쓰지 않는다. */
const liveQuery: PublicLivesQuery = { status: "LIVE", sort: "viewerCount" };

/* 받은 데이터가 있으면 그대로 보이고, 실패 뒤 다시 조회하는 동안은 불러오는 중으로 되돌린다. */
function toSectionData<TData, TItem>(
  query: UseQueryResult<TData>,
  toItems: (data: TData) => readonly TItem[],
): SectionData<TItem> {
  if (query.data) return { status: "ready", items: toItems(query.data) };
  if (query.isError && !query.isFetching)
    return { status: "error", onRetry: () => void query.refetch() };
  return { status: "loading" };
}

/** 실제 페이지 전용. Storybook은 BuyerHome에 고정 값을 바로 넘겨 이 조회가 돌지 않는다. */
export function BuyerHomeApi() {
  const feed = useQuery({
    queryKey: ["home-feed", HOME_FEED_SIZE],
    queryFn: ({ signal }) => getHomeFeed(HOME_FEED_SIZE, signal),
  });
  const lives = useQuery({
    queryKey: ["public-lives", liveQuery],
    queryFn: ({ signal }) => getPublicLives(liveQuery, signal),
  });
  /* 피드의 달성률은 늘 0이라(SEARCH-013 전) BE 시더가 넣은 목업 달성률을 프로젝트 상세에서 한 번씩 읽는다(#445).
     상세 화면과 같은 키라 카드와 상세의 값이 같다. 공개 UUID가 없거나 실패한 카드는 달성률을 비운다. */
  const featuredIds = [
    ...new Set(
      (feed.data?.content ?? []).flatMap(({ projectPublicId }) =>
        isPublicUuid(projectPublicId) ? [projectPublicId] : [],
      ),
    ),
  ];
  const featuredDetails = useQueries({
    queries: featuredIds.map((projectId) => ({
      queryKey: ["public-project", projectId],
      queryFn: ({ signal }) => getPublicProject(projectId, signal),
    })),
  });
  const achievementRates = new Map<string, number>();
  featuredDetails.forEach(({ data }, index) => {
    if (data) achievementRates.set(featuredIds[index], data.fundingStatus.achievementRate);
  });

  return (
    <BuyerHome
      featured={toSectionData(feed, (data) =>
        data.content.map((row) =>
          featuredCard(
            row,
            row.projectPublicId ? achievementRates.get(row.projectPublicId) : undefined,
          ),
        ),
      )}
      lives={toSectionData(lives, (data) => data.content.map(liveCard))}
    />
  );
}
