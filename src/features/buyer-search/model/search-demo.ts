import type { SellerSummary } from "@/entities/seller/ui/seller-row";

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

export const searchProjects = Array.from({ length: 7 }, (_, index) => ({
  id: `search-project-${index + 1}`,
  title:
    index === 6
      ? "여름을 시원하게, 달콤한 수박 정기 배송"
      : "로보락F25 정말 좋고 깔끔하고 착한 무선 청소기! 이것은 역작이라고 말할 수 있다",
  seller: "판매자 이름",
  progress: 10000 - index * 250,
  closed: index === 3,
  created: 7 - index,
  popularity: [80, 120, 60, 90, 20, 45, 30][index],
  deadline: [3, 5, 1, 0, 2, 4, 6][index],
}));

export const searchSellers: SellerSummary[] = Array.from({ length: 7 }, (_, index) => ({
  id: `search-seller-${index + 1}`,
  name: index % 2 ? "청소기 판매자" : "판매자 이름",
  followers: 151 + index,
  likes: 2000 + index * 10,
  live: index % 3 === 0,
}));

export const searchLives = Array.from({ length: 12 }, (_, index) => ({
  id: `search-live-${index + 1}`,
  title: "무선 청소기 프로젝트, 라이브에서 직접 만나보세요",
  seller: "판매자 이름",
  status: index < 6 ? "live" : "upcoming",
  date: `09.${18 + (index % 6)}`,
  time: "오후 3:40",
  subscribers: 1000000 - index * 10,
  created: 12 - index,
  popularity: (index * 7) % 13,
  deadline: index % 6,
}));

export function matchesSearch(text: string, query: string) {
  return text.toLocaleLowerCase("ko-KR").includes(query.trim().toLocaleLowerCase("ko-KR"));
}

export function searchResults(query: SearchQuery) {
  const sort = (a: { created: number; popularity: number; deadline: number }, b: typeof a) =>
    query.sort === "popular"
      ? b.popularity - a.popularity
      : query.sort === "closing"
        ? a.deadline - b.deadline
        : b.created - a.created;
  return {
    projects: searchProjects
      .filter(
        (item) =>
          matchesSearch(`${item.title} ${item.seller}`, query.q) && (query.closed || !item.closed),
      )
      .sort(sort),
    lives: searchLives
      .filter(
        (item) =>
          item.status === query.status && matchesSearch(`${item.title} ${item.seller}`, query.q),
      )
      .sort(sort),
    sellers: searchSellers.filter((item) => matchesSearch(item.name, query.q)),
  };
}

export function addRecentSearch(recent: string[], value: string) {
  const word = value.trim();
  return word ? [word, ...recent.filter((item) => item !== word)].slice(0, 10) : recent;
}
