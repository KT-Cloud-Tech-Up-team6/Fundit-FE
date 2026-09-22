"use client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { useRouter, useSearchParams } from "next/navigation";
import { getCategories, getCategoryProjects } from "@/entities/project/api/buyer-project-api";
import { ProjectRow } from "@/entities/project/ui/project-row";
import { projectCard } from "@/entities/project/model/project-card";
import { Button } from "@/shared/components/ui/button";
import { BuyerCategoryList } from "./buyer-category-list";

export function BuyerCategoryApi({ slug, minor }: { slug: string; minor?: string }) {
  const { state } = useAuth();
  const router = useRouter(),
    params = useSearchParams();
  const raw = Number(params.get("page") ?? 1),
    page = Number.isSafeInteger(raw) && raw > 0 ? raw - 1 : 0;
  const sort = ["POPULAR", "RECENT", "DEADLINE"].includes(params.get("sort") ?? "")
    ? params.get("sort")!
    : "POPULAR";
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => getCategories(signal),
    enabled: state.status !== "checking",
  });
  const list = useQuery({
    queryKey: ["category-projects", slug, minor, sort, page],
    queryFn: ({ signal }) => getCategoryProjects(slug, minor ?? "", sort, page, signal),
    enabled: state.status !== "checking" && minor !== undefined,
  });
  if (categories.isPending) return <p role="status">카테고리를 불러오고 있습니다.</p>;
  if (categories.isError)
    return (
      <p role="alert">
        카테고리 조회 실패. <button onClick={() => void categories.refetch()}>다시 시도</button>
      </p>
    );
  if (!categories.data.categories.length) return <p>등록된 카테고리가 없습니다.</p>;
  if (minor === undefined)
    return (
      <BuyerCategoryList
        slug={encodeURIComponent(slug)}
        categories={categories.data.categories.map((group) => ({
          slug: encodeURIComponent(group.categoryMajor),
          name: group.categoryMajor,
          subcategories: group.categoryMinors.map((item) => ({
            slug: encodeURIComponent(item.categoryMinor),
            name: item.categoryMinor,
          })),
        }))}
      />
    );
  function navigate(nextPage: number, nextSort = sort) {
    router.push(
      `/categories/${encodeURIComponent(slug)}/${encodeURIComponent(minor!)}?${new URLSearchParams({ sort: nextSort, page: String(nextPage + 1) })}`,
    );
  }
  return (
    <main className="mx-auto min-h-screen max-w-[390px] space-y-4 p-5">
      <h1 className="text-heading-l">
        {slug} · {minor}
      </h1>
      <label>
        정렬{" "}
        <select value={sort} onChange={(event) => navigate(0, event.target.value)}>
          <option value="POPULAR">인기순</option>
          <option value="RECENT">최신순</option>
          <option value="DEADLINE">마감순</option>
        </select>
      </label>
      {list.isPending ? (
        <p role="status">프로젝트를 불러오고 있습니다.</p>
      ) : list.isError ? (
        <p role="alert">
          조회 실패. <button onClick={() => void list.refetch()}>다시 시도</button>
        </p>
      ) : (
        <>
          {list.data.content.map((row) => (
            <ProjectRow
              key={row.projectId}
              project={projectCard(row)}
              thumbnailClassName="w-[36.57%]"
            />
          ))}
          {!list.data.content.length && <p>프로젝트가 없습니다.</p>}
          <div className="flex justify-between">
            <Button disabled={page === 0} onClick={() => navigate(page - 1)}>
              이전 페이지
            </Button>
            <Button disabled={!list.data.hasNext} onClick={() => navigate(page + 1)}>
              다음 페이지
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
