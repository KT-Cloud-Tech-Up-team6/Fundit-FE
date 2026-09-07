import { CreateLiveButton } from "@/features/live-create/ui/create-live-button";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";

/* ponytail: Figma FL_S_LV_HOME의 탭 라벨만 옮겼다. LIVE 상태값·전이는 BE 계약 전이라
   (docs/OPEN_DECISIONS.md P1 도메인 상태값) value는 판매자 프로젝트 목록과 같은 임시 키를 쓴다.
   계약이 확정되면 여기와 seller/projects/page.tsx의 키를 함께 맞춘다. */
const statuses = [
  { value: "active", label: "진행중", emptyMessage: "진행중인 라이브가 없습니다" },
  { value: "draft", label: "준비중", emptyMessage: "준비중인 라이브가 없습니다" },
  { value: "closed", label: "완료", emptyMessage: "완료된 라이브가 없습니다" },
] as const;

type Status = (typeof statuses)[number]["value"];

const PAGE_SIZE = 8;

/* ponytail: LIVE 카드 시안이 아직 없다. Figma 판매자_라이브 생성 섹션에는 진행중 탭
   빈 화면만 있어 목록 렌더는 넣지 않는다. 카드가 확정되면 여기에 배열을 채우고
   entities/live/ui 에 카드를 만든다. */
const mockLives: Record<Status, { id: string }[]> = {
  active: [],
  draft: [],
  closed: [],
};

export default async function SellerLiveStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const current = statuses.find((tab) => tab.value === params.status) ?? statuses[0];
  const all = mockLives[current.value];
  /* 목록이 비어도 Figma 빈 화면에는 1페이지 표시가 남아 있다. */
  const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Math.trunc(Number(params.page)) || 1), totalPages);

  return (
    <>
      <h1 className="text-heading-l mt-[41px] h-13 pt-2">LIVE 스튜디오</h1>

      <div className="mt-[5px] flex flex-wrap items-end justify-between gap-4">
        <TabList aria-label="LIVE 상태" layout="track" mode="nav">
          {statuses.map((tab) => (
            <Tab
              key={tab.value}
              href={`/seller/live?status=${tab.value}`}
              selected={tab.value === current.value}
              size="sm"
            >
              {tab.label}
              <span>{mockLives[tab.value].length}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-6">
          <div className="min-w-45 flex-1 sm:w-[282px] sm:flex-none">
            <SearchField size="sm" placeholder="검색하기" aria-label="LIVE 검색" />
          </div>
          <CreateLiveButton />
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center pt-[162px]">
        <div aria-hidden className="bg-border-default size-[101px]" />
        <p className="text-body-m text-text-secondary mt-8">{current.emptyMessage}</p>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildHref={(page) => `/seller/live?status=${current.value}&page=${page}`}
      />
    </>
  );
}
