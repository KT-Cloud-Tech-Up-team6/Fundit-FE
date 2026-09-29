import { http, HttpResponse } from "msw";

import type { Wish } from "@/entities/member/api/member-api";
import type { ProjectCardResponse } from "@/entities/project/api/buyer-project-api";
import type { FollowedSeller } from "@/entities/seller/api/follow-api";
import type {
  PopularKeyword,
  RecentKeyword,
  SellerSearchItem,
} from "@/features/buyer-search/api/search-api";

import { FIXTURE_PROJECT_ID } from "./fixtures";

/* 검색·찜·팔로우(소비자 탐색 흐름)용 목업. 상태는 이 페이지 컨텍스트 안에서만 유지되어, 스펙은
   하드 네비게이션 없이 같은 탭 안에서 흐름을 끝낸다. */
const page = <T>(content: T[]) => ({
  content,
  page: 0,
  size: 20,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  hasNext: false,
});

const card = (
  projectId: number,
  overrides: Partial<ProjectCardResponse> & Pick<ProjectCardResponse, "title">,
): ProjectCardResponse => ({
  projectId,
  projectPublicId: null,
  projectDisplayCode: `PJ-${projectId}`,
  thumbnailUrl: null,
  categoryMajor: "홈·리빙",
  categoryMinor: "조명",
  status: "ONGOING",
  achievementRate: 50,
  sellerDisplayName: "무드등 공방",
  remainingDays: 10,
  ...overrides,
});

const projects: ProjectCardResponse[] = [
  card(1, {
    title: "감성 캠핑 무드등 세트",
    projectPublicId: FIXTURE_PROJECT_ID,
    achievementRate: 24,
    remainingDays: 10,
  }),
  card(2, {
    title: "무드등 미니 블렌더",
    sellerDisplayName: "주방 연구소",
    achievementRate: 180,
    remainingDays: 3,
  }),
  card(3, {
    title: "종료된 무드등 스탠드",
    status: "SUCCEEDED",
    achievementRate: 320,
    remainingDays: 0,
  }),
];

const sellers: SellerSearchItem[] = [
  {
    sellerId: "seller-demo",
    sellerDisplayName: "무드등 공방",
    ongoingProjectCount: 1,
    totalProjectCount: 2,
  },
];

/* 로그인한 요청만 검색어가 최근 검색어로 남는다(BE와 같다). */
const recentKeywords: RecentKeyword[] = [];
const popularKeywords: PopularKeyword[] = [
  { keyword: "무드등", rank: 1 },
  { keyword: "블렌더", rank: 2 },
];

const sortKeys: Record<string, (a: ProjectCardResponse, b: ProjectCardResponse) => number> = {
  RECENT: (a, b) => b.projectId - a.projectId,
  POPULAR: (a, b) => b.achievementRate - a.achievementRate,
  DEADLINE: (a, b) => a.remainingDays - b.remainingDays,
};

const allWishes = new Map<number, Wish>([
  [
    1,
    {
      projectId: 1,
      projectPublicId: FIXTURE_PROJECT_ID,
      projectTitle: "감성 캠핑 무드등 세트",
      projectThumbnailUrl: null,
      createdAt: new Date().toISOString(),
    },
  ],
  // 상세 연결 전(공개 ID 없음)의 찜 항목.
  [
    2,
    {
      projectId: 2,
      projectPublicId: null,
      projectTitle: "공개 준비 중인 프로젝트",
      projectThumbnailUrl: null,
      createdAt: new Date().toISOString(),
    },
  ],
]);
const wished = new Set([1, 2]);

const follows = new Map<string, FollowedSeller>([
  [
    "seller-demo",
    { sellerId: "seller-demo", sellerNickname: "무드등 공방", createdAt: new Date().toISOString() },
  ],
]);
const following = new Set(["seller-demo"]);

export const discoveryHandlers = [
  http.get("*/api/v1/search/projects", ({ request }) => {
    const query = new URL(request.url).searchParams;
    const keyword = (query.get("keyword") ?? "").trim();
    const ended = query.get("subTab") === "ENDED";
    if (keyword && request.headers.get("Authorization")) {
      const at = recentKeywords.findIndex((item) => item.keyword === keyword);
      if (at >= 0) recentKeywords.splice(at, 1);
      recentKeywords.unshift({ keyword, searchedAt: new Date().toISOString() });
    }
    const content = projects
      .filter(
        (item) =>
          (item.title.includes(keyword) || item.sellerDisplayName.includes(keyword)) &&
          (item.status === "ONGOING") !== ended,
      )
      .sort(sortKeys[query.get("sort") ?? "RECENT"] ?? sortKeys.RECENT);
    return HttpResponse.json(page(content));
  }),

  http.get("*/api/v1/search/sellers", ({ request }) => {
    const keyword = (new URL(request.url).searchParams.get("keyword") ?? "").trim();
    return HttpResponse.json(
      page(sellers.filter((seller) => seller.sellerDisplayName.includes(keyword))),
    );
  }),

  http.get("*/api/v1/search/recent-keywords", () => HttpResponse.json({ content: recentKeywords })),

  http.delete("*/api/v1/search/recent-keywords/:keyword", ({ params }) => {
    const keyword = decodeURIComponent(String(params.keyword));
    const at = recentKeywords.findIndex((item) => item.keyword === keyword);
    if (at >= 0) recentKeywords.splice(at, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("*/api/v1/search/popular-keywords", () =>
    HttpResponse.json({ content: popularKeywords }),
  ),

  http.get("*/api/v1/wishes", () => {
    const content = [...allWishes.values()].filter((wish) => wished.has(wish.projectId));
    return HttpResponse.json({ content, totalElements: content.length, hasNext: false });
  }),
  http.put("*/api/v1/wishes/:projectId", ({ params }) => {
    const projectId = Number(params.projectId);
    wished.add(projectId);
    return HttpResponse.json({ projectId, wished: true });
  }),
  http.delete("*/api/v1/wishes/:projectId", ({ params }) => {
    const projectId = Number(params.projectId);
    wished.delete(projectId);
    return HttpResponse.json({ projectId, wished: false });
  }),

  http.get("*/api/v1/follows", () => {
    const content = [...follows.values()].filter((follow) => following.has(follow.sellerId));
    return HttpResponse.json({ ...page(content), size: 20 });
  }),
  http.put("*/api/v1/follows/:sellerId", ({ params }) => {
    const sellerId = decodeURIComponent(String(params.sellerId));
    following.add(sellerId);
    return HttpResponse.json({ sellerId, following: true });
  }),
  http.delete("*/api/v1/follows/:sellerId", ({ params }) => {
    following.delete(decodeURIComponent(String(params.sellerId)));
    return new HttpResponse(null, { status: 204 });
  }),
];
