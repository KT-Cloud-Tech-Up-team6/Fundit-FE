"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getHomeFeed } from "@/entities/project/api/buyer-project-api";
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

  return (
    <BuyerHome
      featured={toSectionData(feed, (data) => data.content.map(featuredCard))}
      lives={toSectionData(lives, (data) => data.content.map(liveCard))}
    />
  );
}
