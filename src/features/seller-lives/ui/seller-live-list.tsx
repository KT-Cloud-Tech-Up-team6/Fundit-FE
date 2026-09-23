"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { LoginRedirect } from "@/providers/login-redirect";
import { getMyLives } from "@/entities/live/api/seller-live-api";
import {
  tabCount,
  tabStatusParam,
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

export function SellerLiveList({ status, page }: { status: SellerLiveTab; page: number }) {
  const { state } = useAuth();
  const owner = state.user?.memberId;
  const enabled = state.status === "authenticated" && Boolean(owner);
  const lives = useQuery({
    queryKey: ["seller-lives", owner, status, page],
    queryFn: ({ signal }) => getMyLives(tabStatusParam(status), page, signal),
    enabled,
  });
  const current = tabs.find((tab) => tab.value === status) ?? tabs[0];
  const items = toSellerLiveList(lives.data, status);
  const buildHref = (nextStatus: SellerLiveTab = status, nextPage = 1) => {
    const query = new URLSearchParams({ status: nextStatus });
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
          {tabs.map((tab) => {
            const count = tabCount(tab.value, status, lives.data);
            return (
              <Tab
                key={tab.value}
                href={buildHref(tab.value)}
                selected={tab.value === status}
                size="md"
                variant="primaryLive"
              >
                {tab.label}
                {/* LIVE에는 상태별 건수 API가 없다. 서버가 상태로 걸러 준 탭을 보고 있을
                    때만 그 응답의 totalElements를 쓰고, 나머지는 세지 않았음을 —로 표시한다. */}
                <span>{count ?? "—"}</span>
                <span className="sr-only">건</span>
              </Tab>
            );
          })}
        </TabList>

        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:gap-6">
          <div className="min-w-45 flex-1 sm:w-[282px] sm:flex-none">
            {/* 원본(FL_S_LV_HOME)에 있는 요소라 지우지 않는다. 다만 GET /lives/mine에
                검색 파라미터가 없어 지금은 동작시킬 수 없다 — BE 요청 대상이다. */}
            <SearchField
              size="md"
              disabled
              aria-label="LIVE 검색"
              aria-describedby="live-search-disabled"
              placeholder="검색어를 입력하세요"
            />
            <p id="live-search-disabled" className="text-caption-s text-text-secondary mt-1">
              LIVE 검색은 아직 제공되지 않습니다.
            </p>
          </div>
          <CreateLiveButton />
        </div>
      </div>

      {lives.isError && (
        <div role="alert" className="mt-6">
          <p>LIVE 목록을 불러오지 못했습니다.</p>
          <button type="button" className="mt-2 underline" onClick={() => void lives.refetch()}>
            다시 시도
          </button>
        </div>
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

      {/* 준비중 탭의 페이지 수는 전체 LIVE 기준이다. status를 생략해 받기 때문에
          준비중이 한 건도 없는 페이지가 중간에 있을 수 있다(위 tabStatusParam 주석). */}
      <Pagination
        currentPage={page}
        totalPages={Math.max(1, lives.data?.totalPages ?? 1)}
        buildHref={(nextPage) => buildHref(status, nextPage)}
      />
    </>
  );
}
