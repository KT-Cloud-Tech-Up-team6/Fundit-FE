"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { searchProjects } from "@/entities/project/api/buyer-project-api";
import { Button } from "@/shared/components/ui/button";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { projectCard } from "@/entities/project/model/project-card";
import {
  deleteRecentKeyword,
  getPopularKeywords,
  getRecentKeywords,
  searchSellers,
} from "../api/search-api";
import { BuyerSearch } from "./buyer-search";
import { parseSearch, searchUrl } from "../model/search-demo";

export function BuyerProjectSearchApi() {
  const { state } = useAuth();
  const memberId = state.user?.memberId ?? null;
  return (
    <SearchSession
      key={`${state.status}:${memberId}`}
      memberId={memberId}
      ready={state.status !== "checking"}
    />
  );
}

function SearchSession({ memberId, ready }: { memberId: string | null; ready: boolean }) {
  const params = useSearchParams(),
    router = useRouter(),
    client = useQueryClient();
  const query = parseSearch(params);
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const recentKey = ["search-recent-keywords", memberId];
  const recent = useQuery({
    queryKey: recentKey,
    queryFn: ({ signal }) => getRecentKeywords(signal),
    enabled: ready && Boolean(memberId),
  });
  const remove = useMutation({
    mutationFn: async (word: string) => {
      await client.cancelQueries({ queryKey: recentKey });
      await deleteRecentKeyword(word);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: recentKey }),
  });
  const result = useQuery({
    queryKey: ["public-project-search", memberId, query.q, query.sort, query.closed, page],
    queryFn: async ({ signal }) => {
      const response = await searchProjects(
        query.q,
        { latest: "RECENT", popular: "POPULAR", closing: "DEADLINE" }[query.sort],
        query.closed,
        page,
        signal,
        Boolean(memberId),
      );
      if (memberId && !signal.aborted) {
        await client.invalidateQueries({ queryKey: recentKey });
      }
      return response;
    },
    enabled: ready && Boolean(query.q) && query.tab === "projects",
  });
  const sellers = useQuery({
    queryKey: ["public-seller-search", query.q, page],
    queryFn: ({ signal }) => searchSellers(query.q, page, signal),
    enabled: ready && Boolean(query.q) && query.tab === "sellers",
  });
  const popular = useQuery({
    queryKey: ["popular-search-keywords"],
    queryFn: ({ signal }) => getPopularKeywords(signal),
    enabled: ready,
  });
  const active = query.tab === "sellers" ? sellers : result;
  const move = (next: number) => {
    const target = new URL(searchUrl(query), window.location.origin);
    target.searchParams.set("page", String(next + 1));
    router.push(target.pathname + target.search);
  };
  return (
    <BuyerSearch
      query={query}
      onQueryChange={(next) => router.push(searchUrl(next))}
      server={{
        projects: (result.data?.content ?? []).map(projectCard),
        count: result.data?.totalElements,
        sellers: (sellers.data?.content ?? []).map((seller) => ({
          id: seller.sellerId,
          name: seller.sellerDisplayName,
        })),
        sellerCount: sellers.data?.totalElements,
        recent: {
          words: recent.data?.content?.map((item) => item.keyword) ?? [],
          removing: remove.isPending,
          onRemove: (word) => remove.mutate(word),
          state: !ready ? (
            <p role="status">회원 정보를 확인하고 있습니다.</p>
          ) : !memberId ? (
            <p>로그인하면 최근 검색어를 확인할 수 있습니다.</p>
          ) : recent.isPending ? (
            <p role="status">최근 검색어를 불러오고 있습니다.</p>
          ) : recent.isError ? (
            <QueryErrorState
              variant="section"
              error={recent.error}
              description="최근 검색어를 불러오지 못했습니다."
              onRetry={() => void recent.refetch()}
            />
          ) : remove.isError ? (
            <p role="alert">최근 검색어를 삭제하지 못했습니다. 삭제 버튼을 다시 눌러주세요.</p>
          ) : undefined,
        },
        keywords: {
          items: popular.data?.content ?? [],
          state: popular.isPending ? (
            <p role="status">인기 검색어를 불러오고 있습니다.</p>
          ) : popular.isError ? (
            <QueryErrorState
              variant="section"
              error={popular.error}
              description="인기 검색어를 불러오지 못했습니다."
              onRetry={() => void popular.refetch()}
            />
          ) : undefined,
        },
        state:
          query.tab === "live" ? (
            <p role="status">이 검색 유형의 API 연결은 준비 중입니다.</p>
          ) : active.isPending ? (
            <p role="status">검색 중입니다.</p>
          ) : active.isError ? (
            <QueryErrorState
              variant="section"
              error={active.error}
              description="검색 결과를 불러오지 못했습니다."
              onRetry={() => void active.refetch()}
            />
          ) : undefined,
        footer:
          active.data && query.tab !== "live" ? (
            <div className="mt-4 flex justify-between">
              <Button disabled={page === 0} onClick={() => move(page - 1)}>
                이전 페이지
              </Button>
              <span>{page + 1}</span>
              <Button disabled={!active.data.hasNext} onClick={() => move(page + 1)}>
                다음 페이지
              </Button>
            </div>
          ) : null,
      }}
    />
  );
}
