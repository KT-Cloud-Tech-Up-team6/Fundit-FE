import Link from "next/link";
import { SellerProjectCard, type SellerProject } from "@/entities/project/ui/seller-project-card";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";

const statuses = [
  { value: "active", label: "진행중" },
  { value: "draft", label: "준비중" },
  { value: "closed", label: "완료" },
] as const;

type Status = (typeof statuses)[number]["value"];

const PAGE_SIZE = 8;

/* ponytail: 와이어프레임 더미. GET /api/projects 연동 시 통째로 걷어낸다.
   목록 응답에 카테고리·참여자수·모금액·달성률이 없어 필드 확정이 선행돼야 한다
   — docs/SELLER_PROJECT_LIST.md 10항 참고. */
const funding = {
  category: "가방",
  period: "2026.07.01 - 2026.08.12",
  participantCount: 132,
  goalAmount: 5_000_000,
} as const;

const mockProjects: Record<Status, SellerProject[]> = {
  active: [
    {
      ...funding,
      status: "active",
      id: "p-1",
      title: "친환경 소재로 만든 데일리 백",
      badges: ["D-12", "목표 달성"],
      currentAmount: 6_400_000,
    },
    {
      ...funding,
      status: "active",
      id: "p-2",
      title: "매일 드는 캔버스 토트백",
      badges: ["D-12"],
      currentAmount: 1_600_000,
    },
  ],
  draft: [
    {
      status: "draft",
      id: "p-3",
      title: "친환경 소재로 만든 100% 오가닉! 데일리 백친환경 소재로 만든 100% 오가닉! 데일리 백",
      badges: ["D-12"],
      progressLabel: "스토리 작성 중 · 60% 완료",
      openScheduledAt: "2026.09.21",
      updatedAt: "2026.08.26 12:54",
    },
  ],
  closed: Array.from({ length: 14 }, (_, index) => ({
    ...funding,
    status: "closed" as const,
    id: `p-c${index + 1}`,
    title: "친환경 소재로 만든 데일리 백",
    badges: ["배송 준비 중"],
    currentAmount: index % 2 === 0 ? 6_400_000 : 1_600_000,
  })),
};

export default async function SellerProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = statuses.find((tab) => tab.value === params.status)?.value ?? "active";
  const all = mockProjects[status];
  const totalPages = Math.ceil(all.length / PAGE_SIZE);
  const currentPage = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const items = all.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <h1 className="text-heading-l mt-[41px] h-[52px] pt-2">내 프로젝트</h1>

      <div className="mt-[5px] flex flex-wrap items-end justify-between gap-4">
        <TabList aria-label="프로젝트 상태" layout="track" mode="nav">
          {statuses.map((tab) => (
            <Tab
              key={tab.value}
              href={`/seller/projects?status=${tab.value}`}
              selected={tab.value === status}
              size="sm"
            >
              {tab.label}
              <span>{mockProjects[tab.value].length}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>

        <div className="flex items-center gap-6">
          <div className="w-[282px]">
            <SearchField size="sm" placeholder="검색하기" aria-label="프로젝트 검색" />
          </div>
          <Link
            href="/seller/projects/new"
            className="text-body-emphasis bg-layer-surface-primary text-text-inverse focus-visible:outline-border-primary hover:bg-layer-surface-primary-hover flex h-9 w-45 items-center justify-center rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            신규 생성하기
          </Link>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="mt-6 grid gap-x-6 gap-y-1 lg:grid-cols-2">
          {items.map((project) => (
            <SellerProjectCard key={project.id} {...project} />
          ))}
        </div>
      ) : (
        <p className="text-body-m text-text-secondary mt-6 py-16 text-center">
          해당 상태의 프로젝트가 없습니다.
        </p>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => `/seller/projects?status=${status}&page=${page}`}
      />
    </>
  );
}
