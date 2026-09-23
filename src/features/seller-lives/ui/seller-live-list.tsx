"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";
import { getLiveStatusCounts, getMyLives } from "@/entities/live/api/seller-live-api";
import {
  tabCount,
  tabStatuses,
  toSellerLiveList,
  type SellerLiveTab,
} from "@/entities/live/model/seller-live";
import { SellerLiveCard } from "@/entities/live/ui/seller-live-card";
import { CreateLiveButton } from "@/features/live-create/ui/create-live-button";
import { Pagination } from "@/shared/components/ui/pagination";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";

const tabs = [
  { value: "active", label: "진행중", emptyMessage: "진행중인 라이브가 없습니다" },
  { value: "draft", label: "준비중", emptyMessage: "준비중인 라이브가 없습니다" },
  { value: "closed", label: "완료", emptyMessage: "완료된 라이브가 없습니다" },
] as const satisfies readonly { value: SellerLiveTab; label: string; emptyMessage: string }[];

/** 판매자의 LIVE 목록을 상태·검색어·페이지 기준으로 표시한다. */
export function SellerLiveList({
  status,
  search,
  page,
}: {
  status: SellerLiveTab;
  search: string;
  page: number;
}) {
  const { state } = useAuth();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const lives = useQuery({
    queryKey: ["seller-lives", owner, status, search, page],
    queryFn: ({ signal }) => getMyLives({ statuses: tabStatuses[status], search, page }, signal),
    enabled,
  });
  const counts = useQuery({
    queryKey: ["seller-live-counts", owner],
    queryFn: ({ signal }) => getLiveStatusCounts(signal),
    enabled,
  });
  const current = tabs.find((tab) => tab.value === status) ?? tabs[0];
  const items = toSellerLiveList(lives.data);
  const buildHref = (nextStatus: SellerLiveTab = status, nextPage = 1) => {
    const query = new URLSearchParams({ status: nextStatus });
    if (search) query.set("search", search);
    if (nextPage > 1) query.set("page", String(nextPage));
    return `/seller/live?${query}`;
  };

  if (state.status === "checking") return <p role="status">로그인 상태를 확인하고 있습니다.</p>;
  if (state.status === "guest") return <LoginRedirect />;
  if (!owner)
    return <p role="alert">회원 정보를 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.</p>;

  return (
    <>
      <h1 className="text-heading-l mt-[41px] h-13 pt-2">LIVE 스튜디오</h1>

      <div className="mt-[5px] flex flex-wrap items-end justify-between gap-4">
        {/* FL_S_LV_HOME의 `tap_primary`는 130×52 · Body/Medium_16 · #2947E5다
            (선택 탭 인스턴스 1404:1298 = color=primary_live, size=M). Tab의 md가 그
            치수이고, md는 각 탭이 자기 밑줄을 그려 이어 붙는 구조라 TabList도 fill이다
            (track은 목록이 트랙을 그리는 sm 전제다). 자매 화면 /seller/projects와 같다. */}
        <TabList aria-label="LIVE 상태" layout="fill" mode="nav">
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              href={buildHref(tab.value)}
              selected={tab.value === status}
              size="md"
              variant="primaryLive"
            >
              {tab.label}
              {/* 건수는 status-counts를 탭 매핑대로 더한 값이다(준비중 = draft + scheduled).
                  아직 받지 못했으면 세지 않았음을 —로 표시한다. */}
              <span>{tabCount(tab.value, counts.data) ?? "—"}</span>
              <span className="sr-only">건</span>
            </Tab>
          ))}
        </TabList>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-6">
          <form className="min-w-45 flex-1 sm:w-[282px] sm:flex-none" action="/seller/live">
            <input type="hidden" name="status" value={status} />
            <SearchField
              key={search}
              size="md"
              name="search"
              defaultValue={search}
              aria-label="LIVE 검색"
              placeholder="검색어를 입력하세요"
            />
          </form>
          <CreateLiveButton />
        </div>
      </div>

      {/* 건수를 못 받으면 탭에 —만 남긴다. 목록은 따로 받아 그대로 보여 준다. */}
      {lives.isError && (
        <QueryErrorState
          variant="section"
          error={lives.error}
          description="LIVE 목록을 불러오지 못했습니다."
          className="mt-6"
          onRetry={() => void lives.refetch()}
          notFoundHref="/seller/live"
        />
      )}

      {lives.isPending ? (
        <p role="status" className="mt-6">
          LIVE 목록을 불러오고 있습니다.
        </p>
      ) : items.length ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {items.map((item) => (
            <SellerLiveCard key={item.id} {...item} />
          ))}
        </div>
      ) : (
        !lives.isError && (
          <div className="mt-6 flex flex-1 flex-col items-center justify-center pb-16">
            <Image
              alt=""
              src="/images/shared/island.svg"
              width={112}
              height={112}
              className="size-28"
            />
            <p className="text-body-s text-text-secondary mt-10">{current.emptyMessage}</p>
          </div>
        )
      )}

      <Pagination
        currentPage={page}
        totalPages={Math.max(1, lives.data?.totalPages ?? 1)}
        buildHref={(nextPage) => buildHref(status, nextPage)}
      />
    </>
  );
}
