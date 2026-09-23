"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { getProjectCounts, getSellerProjects } from "@/entities/project/api/seller-project-api";
import { toSellerProject } from "@/entities/project/model/seller-project-response";
import type { SellerProjectStatus } from "@/entities/project/model/seller-project";
import { SellerProjectCard } from "@/entities/project/ui/seller-project-card";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";

const statuses = [
  { value: "active", label: "진행중", count: "ongoing" },
  { value: "draft", label: "준비중", count: "draft" },
  { value: "closed", label: "완료", count: "completed" },
] as const;

/** 판매자의 프로젝트 목록을 상태·검색어·페이지 기준으로 표시한다. */
export function SellerProjectList({
  status,
  search,
  page,
}: {
  status: SellerProjectStatus;
  search: string;
  page: number;
}) {
  const { state } = useAuth();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const projects = useQuery({
    queryKey: ["seller-projects", owner, status, search, page],
    queryFn: ({ signal }) => getSellerProjects(status, search, page, signal),
    enabled,
  });
  const counts = useQuery({
    queryKey: ["seller-project-counts", owner],
    queryFn: ({ signal }) => getProjectCounts(signal),
    enabled,
  });
  const buildHref = (nextStatus = status, nextPage = 1) => {
    const query = new URLSearchParams({ status: nextStatus });
    if (search) query.set("search", search);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/seller/projects?${query}`;
  };
  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;
  return (
    <>
      <h1 className="text-heading-l mt-[41px] h-[52px] pt-2">내 프로젝트</h1>
      <div className="mt-[5px] flex flex-wrap items-end justify-between gap-4">
        <TabList aria-label="프로젝트 상태" layout="fill" mode="nav">
          {statuses.map((tab) => (
            <Tab
              key={tab.value}
              href={buildHref(tab.value)}
              selected={tab.value === status}
              size="md"
            >
              {tab.label}
              <span>{counts.data?.[tab.count] ?? "—"}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-6">
          <form
            className="min-w-[180px] flex-1 sm:w-[282px] sm:flex-none"
            action="/seller/projects"
          >
            <input type="hidden" name="status" value={status} />
            <SearchField
              key={search}
              size="md"
              name="search"
              defaultValue={search}
              placeholder="검색하기"
              aria-label="프로젝트 검색"
            />
          </form>
          <Link
            href="/seller/projects/new"
            className="text-body-strong bg-layer-surface-primary text-text-inverse focus-visible:outline-border-primary hover:bg-layer-surface-primary-hover flex h-[46px] w-45 items-center justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            신규 생성하기
          </Link>
        </div>
      </div>
      {(projects.isError || counts.isError) && (
        <QueryErrorState
          variant="section"
          error={projects.isError ? projects.error : counts.error}
          description="프로젝트 정보를 불러오지 못했습니다."
          className="mt-6"
          onRetry={() => {
            void projects.refetch();
            void counts.refetch();
          }}
          notFoundHref="/seller/projects"
        />
      )}
      {projects.isPending ? (
        <p role="status" className="mt-6">
          프로젝트를 불러오고 있습니다.
        </p>
      ) : (
        projects.data &&
        (projects.data.content.length ? (
          <div className="mt-6 grid gap-x-6 gap-y-6 lg:grid-cols-2">
            {projects.data.content.map((item) => (
              <SellerProjectCard key={item.projectId} {...toSellerProject(item)} />
            ))}
          </div>
        ) : (
          <p className="text-body-m text-text-secondary mt-6 py-16 text-center">
            해당 상태의 프로젝트가 없습니다.
          </p>
        ))
      )}
      {projects.data && (
        <Pagination
          currentPage={page}
          totalPages={projects.data.totalPages}
          buildHref={(nextPage) => buildHref(status, nextPage)}
        />
      )}
    </>
  );
}
