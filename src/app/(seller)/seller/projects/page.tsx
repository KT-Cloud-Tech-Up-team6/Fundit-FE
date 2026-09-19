import Link from "next/link";
import { getSellerProjectList } from "@/entities/project/model/seller-project-demo";
import {
  sellerProjectStatuses,
  type SellerProjectStatus,
} from "@/entities/project/model/seller-project";
import { SellerProjectCard } from "@/entities/project/ui/seller-project-card";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";

const statuses = [
  { value: "active", label: "진행중" },
  { value: "draft", label: "준비중" },
  { value: "closed", label: "완료" },
] as const;

type Status = SellerProjectStatus;
type SearchParam = string | string[] | undefined;

function getSingleSearchParam(value: SearchParam) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SellerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: SearchParam;
    page?: SearchParam;
    search?: SearchParam;
  }>;
}) {
  const params = await searchParams;
  const statusParam = getSingleSearchParam(params.status);
  const searchParam = getSingleSearchParam(params.search);
  const pageParam = getSingleSearchParam(params.page);
  const status = sellerProjectStatuses.includes(statusParam as Status)
    ? (statusParam as Status)
    : "active";
  const search = searchParam?.trim() ?? "";
  const parsedPage = Number(pageParam);
  const result = getSellerProjectList({
    status,
    search,
    page: Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : undefined,
  });
  const buildHref = (nextStatus = status, page = 1) => {
    const query = new URLSearchParams({ status: nextStatus });
    if (search) query.set("search", search);
    if (page > 1) query.set("page", String(page));
    return `/seller/projects?${query}`;
  };

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
              <span>{result.statusCounts[tab.value]}</span>
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

      {result.items.length > 0 ? (
        <div className="mt-6 grid gap-x-6 gap-y-6 lg:grid-cols-2">
          {result.items.map((project) => (
            <SellerProjectCard key={project.id} {...project} />
          ))}
        </div>
      ) : (
        <p className="text-body-m text-text-secondary mt-6 py-16 text-center">
          해당 상태의 프로젝트가 없습니다.
        </p>
      )}

      <Pagination
        currentPage={result.page}
        totalPages={result.totalPages}
        buildHref={(page) => buildHref(status, page)}
      />
    </>
  );
}
