import { projectSearchDemo } from "@/entities/project/model/project-search-demo";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
import { sellerDemo } from "@/entities/seller/model/seller-demo";

export type SearchTab = "projects" | "live" | "sellers";
export type SearchQuery = {
  q: string;
  tab: SearchTab;
  status: "live" | "upcoming";
  sort: "latest" | "popular" | "closing";
  closed: boolean;
};
export const defaultSearch: SearchQuery = {
  q: "",
  tab: "projects",
  status: "live",
  sort: "latest",
  closed: false,
};

export function parseSearch(params: Pick<URLSearchParams, "get">): SearchQuery {
  return {
    q: (params.get("q") ?? "").trim(),
    tab:
      params.get("tab") === "live"
        ? "live"
        : params.get("tab") === "sellers"
          ? "sellers"
          : "projects",
    status: params.get("status") === "upcoming" ? "upcoming" : "live",
    sort:
      params.get("sort") === "popular"
        ? "popular"
        : params.get("sort") === "closing"
          ? "closing"
          : "latest",
    closed: params.get("closed") === "true",
  };
}

export function searchUrl(query: SearchQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.tab !== "projects") params.set("tab", query.tab);
  if (query.tab === "live") params.set("status", query.status);
  if (query.sort !== "latest") params.set("sort", query.sort);
  if (query.closed) params.set("closed", "true");
  return `/search${params.size ? `?${params}` : ""}`;
}

export const searchProjects = projectSearchDemo;

export const searchSellers = sellerDemo;

export const searchLives = (["live", "upcoming"] as const).flatMap((status) =>
  Array.from({ length: 8 }, (_, index) => {
    const connection = getLiveDemoConnection(
      `${status === "live" ? "recommended" : "upcomingRecommended"}-${index + 1}`,
    )!;
    return {
      id: connection.liveId,
      projectId: connection.projectId,
      ...connection.data,
      status,
      date: "09.18",
      time: "오후 3:40",
      viewers: 101,
      created: 8 - index,
      likes: [80, 120, 60, 90, 20, 45, 30, 10][index],
      deadline: index + 1,
      projectClosed: index === 7,
    };
  }),
);

export const searchSuggestions = ["search-1", "search-2", "search-3", "rank-4"].map((id) =>
  getLiveDemoConnection(id)!,
);

export function matchesSearch(text: string, query: string) {
  const normalize = (value: string) => value.replace(/\s/g, "").toLocaleLowerCase("ko-KR");
  return normalize(text).includes(normalize(query));
}

export function searchResults(query: SearchQuery) {
  const sort = (a: { created: number; likes: number; deadline: number }, b: typeof a) =>
    query.sort === "popular"
      ? b.likes - a.likes
      : query.sort === "closing"
        ? a.deadline - b.deadline
        : b.created - a.created;
  // Figma의 검색어와 상품 예시는 서로 다르므로 디자인 확인용 연관 키워드를 둔다.
  // 실제 검색 응답·추천 결과가 아니며 API에 이 매핑을 전달하지 않는다.
  const lives = searchLives
    .filter(
      (item) =>
        matchesSearch(`${item.title} ${item.seller} 무선 청소기`, query.q) &&
        (item.status === "upcoming" || query.closed || !item.projectClosed),
    )
    .sort(sort);
  return {
    projects: searchProjects
      .filter(
        (item) =>
          matchesSearch(`${item.title} ${item.seller}`, query.q) && (query.closed || !item.closed),
      )
      .sort(sort),
    lives: lives.filter((item) => item.status === query.status),
    liveTotal: lives.length,
    sellers: searchSellers.filter((item) =>
      matchesSearch(`${item.name} 판매자 무선 청소기`, query.q),
    ),
  };
}

export function addRecentSearch(recent: string[], value: string) {
  const word = value.trim();
  return word ? [word, ...recent.filter((item) => item !== word)].slice(0, 10) : recent;
}
