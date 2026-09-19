"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { getPopularProjects, searchProjects } from "@/entities/project/api/buyer-project-api";
import { Button } from "@/shared/components/ui/button";
import { ProjectRow } from "@/entities/project/ui/project-row";
import { projectCard } from "@/entities/project/model/project-card";
import { BuyerSearch } from "./buyer-search";
import { parseSearch, searchUrl } from "../model/search-demo";

export function BuyerProjectSearchApi() {
  const { state } = useAuth();
  const params = useSearchParams(),
    router = useRouter();
  const query = parseSearch(params);
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const result = useQuery({
    queryKey: ["public-project-search", query.q, query.sort, query.closed, page],
    queryFn: ({ signal }) =>
      searchProjects(
        query.q,
        { latest: "RECENT", popular: "POPULAR", closing: "DEADLINE" }[query.sort],
        query.closed,
        page,
        signal,
      ),
    enabled: state.status !== "checking" && Boolean(query.q) && query.tab === "projects",
  });
  const popular = useQuery({
    queryKey: ["popular-project-feed"],
    queryFn: ({ signal }) => getPopularProjects(signal),
    enabled: state.status !== "checking" && !query.q,
  });
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
        count: result.data?.totalElements ?? 0,
        state:
          query.tab !== "projects" ? (
            <p role="status">이 검색 유형의 API 연결은 준비 중입니다.</p>
          ) : result.isPending ? (
            <p role="status">검색 중입니다.</p>
          ) : result.isError ? (
            <p role="alert">
              검색하지 못했습니다. <button onClick={() => void result.refetch()}>다시 시도</button>
            </p>
          ) : undefined,
        footer:
          result.data && query.tab === "projects" ? (
            <div className="mt-4 flex justify-between">
              <Button disabled={page === 0} onClick={() => move(page - 1)}>
                이전 페이지
              </Button>
              <span>{page + 1}</span>
              <Button disabled={!result.data.hasNext} onClick={() => move(page + 1)}>
                다음 페이지
              </Button>
            </div>
          ) : null,
        popular: (
          <section className="space-y-3 py-3">
            <h2 className="text-body-emphasis">인기 프로젝트</h2>
            {popular.isPending ? (
              <p role="status">불러오는 중입니다.</p>
            ) : popular.isError ? (
              <p role="alert">
                인기 프로젝트 조회 실패.{" "}
                <button onClick={() => void popular.refetch()}>다시 시도</button>
              </p>
            ) : popular.data.content.length ? (
              popular.data.content.map((row) => (
                <ProjectRow
                  key={row.projectId}
                  project={projectCard(row)}
                  thumbnailClassName="w-[36.57%]"
                  unavailable
                />
              ))
            ) : (
              <p>프로젝트가 없습니다.</p>
            )}
          </section>
        ),
      }}
    />
  );
}
