"use client";

import Link from "next/link";
import Image from "next/image";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Chip } from "@/shared/components/ui/chip";
import { EmptyState } from "@/shared/components/ui/empty-state";
import { Button } from "@/shared/components/ui/button";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import styles from "./buyer-search.module.css";
import { useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SellerRow, type SellerSummary } from "@/entities/seller/ui/seller-row";
import { ProjectRow } from "@/entities/project/ui/project-row";
import { SearchField } from "@/shared/components/ui/search-field";
import { Icon } from "@/shared/components/ui/icon";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";

import {
  addRecentSearch,
  matchesSearch,
  searchSuggestions,
  parseSearch,
  searchResults,
  searchUrl,
  type SearchQuery,
  type SearchTab,
} from "../model/search-demo";

const tabs: { value: SearchTab; label: string }[] = [
  { value: "projects", label: "프로젝트" },
  { value: "live", label: "LIVE" },
  { value: "sellers", label: "판매자" },
];

export function BuyerSearchRoute() {
  const params = useSearchParams();
  return (
    <BuyerSearch
      query={parseSearch(params)}
      onQueryChange={(query) => window.history.pushState(null, "", searchUrl(query))}
    />
  );
}

export function BuyerSearch({
  query,
  onQueryChange,
  initialInput = "",
  server,
}: {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  initialInput?: string;
  server?: {
    projects: ReturnType<typeof searchResults>["projects"];
    count?: number;
    sellers: Pick<SellerSummary, "id" | "name">[];
    sellerCount?: number;
    recent: {
      words: string[];
      state?: ReactNode;
      removing: boolean;
      onRemove: (word: string) => void;
    };
    keywords: { items: { keyword: string; rank: number }[]; state?: ReactNode };
    state?: ReactNode;
    footer: ReactNode;
  };
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    base: query.q,
    value: initialInput || query.q,
    editing: Boolean(initialInput),
  });
  const [localRecent, setRecent] = useState(
    server ? [] : ["무선 청소기", "수박", "육하원칙", "고무대야"],
  );
  const recent = server ? server.recent.words : localRecent;
  const [following, setFollowing] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const recentDrag = useHorizontalDrag();
  const popularDrag = useHorizontalDrag();
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  if (draft.base !== query.q) {
    setDraft({ base: query.q, value: query.q, editing: false });
  }
  const value = draft.base === query.q ? draft.value : query.q;
  const editing = draft.base === query.q && draft.editing;
  const results = server
    ? { projects: server.projects, lives: [], sellers: server.sellers, liveTotal: 0 }
    : searchResults(query);
  const suggestions = searchResults({ ...query, q: value });
  const tabCounts = {
    projects: server ? server.count : results.projects.length,
    live: server ? undefined : results.liveTotal,
    sellers: server ? server.sellerCount : results.sellers.length,
  };
  const count =
    query.tab === "projects"
      ? (server?.count ?? results.projects.length)
      : query.tab === "live"
        ? results.lives.length
        : (server?.sellerCount ?? results.sellers.length);

  function submit(word = value, tab = query.tab) {
    if (composing.current) return;
    const q = word.trim();
    if (!server) setRecent((current) => addRecentSearch(current, q));
    setDraft({ base: q, value: q, editing: false });
    onQueryChange({ ...query, q, tab });
    input.current?.blur();
  }

  return (
    <div className="bg-layer-surface-default min-h-dvh w-full">
      <BuyerDesktopHeader />
      <main className="bg-layer-surface-default text-text-default [&_a:focus-visible]:outline-border-primary [&_button:focus-visible]:outline-border-primary [&_select:focus-visible]:outline-border-primary mx-auto min-h-dvh w-full pb-[env(safe-area-inset-bottom)] min-[1200px]:min-h-[calc(100dvh-70px)] min-[1200px]:max-w-300 min-[1200px]:px-5 min-[1200px]:pb-16 [&_a:focus-visible]:outline-2 [&_a:focus-visible]:-outline-offset-2 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:-outline-offset-2 [&_select:focus-visible]:outline-2 [&_select:focus-visible]:-outline-offset-2">
        <h1 className="sr-only">통합 검색</h1>
        <form
          role="search"
          className="bg-layer-surface-default sticky top-0 z-10 flex items-center gap-1 py-2 pr-5 pl-2 min-[1200px]:static min-[1200px]:mx-auto min-[1200px]:w-full min-[1200px]:max-w-[614px] min-[1200px]:py-8 min-[1200px]:pr-0 min-[1200px]:pl-0"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <button
            type="button"
            aria-label="뒤로가기"
            className="flex size-10 shrink-0 items-center justify-center min-[1200px]:hidden"
            onClick={() => {
              if (window.history.length > 1) router.back();
              else router.push("/");
            }}
          >
            <Icon name="arrowLeft" className="size-5" />
          </button>
          <SearchField
            size="lg"
            ref={input}
            aria-label="통합 검색어"
            placeholder="검색어를 입력해주세요"

            value={value}
            enterKeyHint="search"
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                (event.nativeEvent.isComposing || composing.current || event.keyCode === 229)
              )
                event.preventDefault();
            }}
            onChange={(event) =>
              setDraft({ base: query.q, value: event.target.value, editing: true })
            }
            onClear={() => {
              setDraft({ base: "", value: "", editing: true });
              onQueryChange({ ...query, q: "" });
              input.current?.focus();
            }}
          />
        </form>
        {!query.q || editing ? (
          <div className="px-5 min-[1200px]:mx-auto min-[1200px]:w-full min-[1200px]:max-w-[793px] min-[1200px]:px-0">
            {!value.trim() ? (
              <>
                <section className="py-3" aria-label="최근 검색어">
                  <h2 className="text-body-emphasis mb-1">최근</h2>
                  <div
                    className={`${styles.track} flex gap-2 py-2`}
                    {...recentDrag}
                    tabIndex={0}
                    aria-label="최근 검색어 가로 목록"
                  >
                    {recent.map((word) => (
                      <div
                        key={word}
                        className="border-border-primary text-label-l flex h-9 shrink-0 items-center gap-2 rounded-full border px-3"
                      >
                        <button type="button" onClick={() => submit(word)}>
                          {word}
                        </button>
                        <button
                          type="button"
                          aria-label={`${word} 최근 검색어 삭제`}
                          disabled={server?.recent.removing}
                          onClick={() =>
                            server
                              ? server.recent.onRemove(word)
                              : setRecent((items) => items.filter((item) => item !== word))
                          }
                        >
                          <Icon name="closeSmall" className="block size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {server?.recent.state}
                  {!recent.length && !server?.recent.state && (
                    <p className="text-caption-m text-text-disabled">최근 검색어가 없습니다.</p>
                  )}
                </section>
                <section className="py-3" aria-label="인기 검색어">
                  <h2 className="text-body-emphasis mb-3">인기 검색어</h2>
                  <ol
                    className={`${styles.track} flex gap-2 py-2`}
                    {...popularDrag}
                    tabIndex={0}
                    aria-label="인기 검색어 가로 목록"
                  >
                    {(server
                      ? server.keywords.items
                      : ["수박", "무선 청소기", "육하원칙", "만병통치약", "케클업"].map(
                          (keyword, index) => ({ keyword, rank: index + 1 }),
                        )
                    ).map(({ keyword, rank }) => (
                      <li key={keyword} className="shrink-0">
                        <button
                          type="button"
                          className="border-border-primary text-label-l h-9 rounded-full border px-3"
                          onClick={() => submit(keyword)}
                        >
                          {rank} {keyword}
                        </button>
                      </li>
                    ))}
                  </ol>
                  {server?.keywords.state}
                  {server && !server.keywords.state && !server.keywords.items.length && (
                    <p className="text-caption-m text-text-disabled">인기 검색어가 없습니다.</p>
                  )}
                </section>
              </>
            ) : (
              <section aria-label="연관 검색어" className="py-2">
                <button
                  type="button"
                  className="text-body-m flex h-11 w-full items-center gap-2 text-left"
                  onClick={() => submit()}
                >
                  <span
                    aria-hidden
                    className="size-4 shrink-0 bg-current [mask-image:url('/icons/search.svg')] [mask-size:contain]"
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold">{value}</span>
                  <Icon name="next" className="size-4" />
                </button>
                {(server ? [] : searchSuggestions)
                  .filter((item) => matchesSearch(item.data.title, value))
                  .map((item) => (
                    <Link
                      key={item.liveId}
                      href={`/live/${item.liveId}`}
                      className="text-body-m flex h-11 w-full items-center gap-2 text-left"
                    >
                      <Icon name="live" className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">
                        <MatchedText text={item.data.title} query={value} />
                      </span>
                      <Icon name="next" className="size-4 shrink-0" />
                    </Link>
                  ))}
                {(server ? [] : suggestions.sellers).slice(0, 1).map((seller) => (
                  <button
                    key={seller.id}
                    type="button"
                    className="text-body-m flex h-11 w-full items-center gap-2 text-left"
                    onClick={() => submit(seller.name, "sellers")}
                  >
                    <Image
                      src={seller.avatar!}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 shrink-0 rounded-full object-cover"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <MatchedText text={seller.name} query={value} />
                    </span>
                    <Icon name="next" className="size-4 shrink-0" />
                  </button>
                ))}
              </section>
            )}
          </div>
        ) : (
          <>
            <TabList
              className="w-full! min-[1200px]:mx-auto min-[1200px]:max-w-[614px]"
              aria-label="검색 결과 유형"
              selectedIndex={tabs.findIndex((tab) => tab.value === query.tab)}
              onSelectedIndexChange={(index) =>
                onQueryChange({
                  ...query,
                  tab: tabs[index].value,
                  status: tabs[index].value === "live" ? "live" : query.status,
                })
              }
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  id={`search-${tab.value}`}
                  aria-controls="search-results"
                  className="w-auto! flex-1"
                  size="md"
                  variant={tab.value === "live" ? "primaryLive" : "primary"}
                >
                  {tab.label}{" "}
                  {tabCounts[tab.value] != null && (
                    <span className="text-text-disabled ml-1 text-[12px] font-medium">
                      {tabCounts[tab.value]}
                    </span>
                  )}
                </Tab>
              ))}
            </TabList>
            <section
              id="search-results"
              role="tabpanel"
              aria-labelledby={`search-${query.tab}`}
              className="px-5 pb-6 min-[1200px]:px-0"
            >
              {query.tab !== "sellers" && (count > 0 || server) && (
                <div className="text-body-s flex items-center justify-between gap-1 pt-3 pb-2">
                  <p role="status" className="text-text-disabled shrink-0">
                    총 {count}개
                  </p>
                  <div className="flex items-center gap-2">
                    {(query.tab === "projects" || query.status === "live") && (
                      <Checkbox
                        checked={query.closed}
                        shape="circle"
                        className="text-[0.875rem]"
                        onChange={(event) =>
                          onQueryChange({ ...query, closed: event.target.checked })
                        }
                      >
                        {server ? "종료 프로젝트만 보기" : "종료 프로젝트 보기"}
                      </Checkbox>
                    )}
                    <Dropdown
                      size="xs"
                      className="[&_[role=listbox]]:right-0 [&_[role=listbox]]:w-max [&_[role=listbox]]:min-w-[81px]"
                      aria-label="검색 결과 정렬"
                      value={query.sort}
                      options={[
                        { value: "latest", label: "최신순" },
                        { value: "popular", label: "인기순" },
                        { value: "closing", label: "마감 임박순" },
                      ]}
                      onValueChange={(sort) =>
                        onQueryChange({ ...query, sort: sort as SearchQuery["sort"] })
                      }
                    />
                  </div>
                </div>
              )}
              {query.tab === "live" && results.liveTotal > 0 && (
                <div className="mb-3 flex gap-2" role="group" aria-label="라이브 진행 상태">
                  {(["live", "upcoming"] as const).map((status) => (
                    <Chip
                      key={status}
                      size="md"
                      variant="primaryLive"
                      appearance={query.status === status ? "selected" : "outline"}
                      aria-pressed={query.status === status}
                      className={`h-9 ${query.status !== status ? "border-border-default! text-text-disabled!" : ""}`}
                      onClick={() => onQueryChange({ ...query, status })}
                    >
                      {status === "live" ? "진행 중" : "진행 예정"}
                    </Chip>
                  ))}
                </div>
              )}
              {server?.state ? (
                server.state
              ) : count === 0 ? (
                <EmptyState
                  role="status"
                  className="[&>p]:text-body-s pt-[166px]"
                  graphic={
                    <Image
                      src="/images/shared/island.svg"
                      alt=""
                      width={112}
                      height={112}
                      className="size-28"
                    />
                  }
                  message={
                    <>
                      검색 결과가 없습니다
                      <br />
                      검색어의 상위 항목으로 다시 검색해보세요
                    </>
                  }
                />
              ) : query.tab === "projects" ? (
                <div className="grid gap-4 min-[1200px]:grid-cols-2">
                  {results.projects.map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      thumbnailClassName="w-[36.57%] min-[1200px]:w-[200px]"
                    />
                  ))}
                </div>
              ) : query.tab === "live" ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 min-[1200px]:grid-cols-5 min-[1200px]:gap-x-4">
                  {results.lives.map((live) => (
                    <article key={live.id}>
                      <Link
                        href={
                          live.status === "live"
                            ? `/live/${live.id}`
                            : `/projects/${live.projectId}?tab=story`
                        }
                      >
                        <div
                          className={`relative mb-2 overflow-hidden rounded-xs ${live.status === "live" ? "aspect-[3/4]" : "aspect-square"}`}
                        >
                          <Image
                            src={live.image}
                            alt=""
                            fill
                            sizes="(min-width: 1200px) 226px, 169px"
                            className="object-cover"
                          />
                          {live.status === "live" ? (
                            <span className="text-text-primary-live text-label-m absolute top-2 right-2 flex items-center gap-1 rounded-full bg-[var(--blue-100)] px-2 py-1">
                              <span
                                aria-hidden
                                className="size-4 bg-current [mask-image:url('/icons/buyer-live/viewers.svg')] [mask-size:contain]"
                              />
                              {live.viewers}
                            </span>
                          ) : (
                            <div className="text-text-static-white absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50">
                              <p className="text-heading-s">{live.date}</p>
                              <p className="text-body-s font-semibold">{live.time}</p>
                            </div>
                          )}
                        </div>
                        <h2 className="line-clamp-2 min-h-10 text-[14px] leading-5 font-medium">
                          {live.title}
                        </h2>
                        <p className="text-label-m text-text-disabled mt-1 truncate">
                          {live.seller}
                        </p>
                      </Link>
                      {live.status === "upcoming" && (
                        <Button
                          variant="secondary"
                          size="md"
                          className="mt-2 w-full text-[14px]!"
                          aria-label={`${live.date} ${live.title} 시작 알림`}
                          aria-pressed={notifications.includes(live.id)}
                          onClick={() =>
                            setNotifications((ids) =>
                              ids.includes(live.id)
                                ? ids.filter((id) => id !== live.id)
                                : [...ids, live.id],
                            )
                          }
                        >
                          {notifications.includes(live.id) ? "알림 신청됨" : "알림받기"}
                          <span
                            aria-hidden
                            className="size-4 bg-current [mask-image:url('/icons/buyer-live/bell-add.svg')] [mask-size:contain]"
                          />
                        </Button>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="grid py-1 min-[1200px]:grid-cols-2 min-[1200px]:gap-x-10">
                  {results.sellers.map((seller) => (
                    <SellerRow
                      key={seller.id}
                      seller={seller}
                      followUnavailable={Boolean(server)}
                      following={following.includes(seller.id)}
                      onFollow={() =>
                        setFollowing((ids) =>
                          ids.includes(seller.id)
                            ? ids.filter((id) => id !== seller.id)
                            : [...ids, seller.id],
                        )
                      }
                    />
                  ))}
                </div>
              )}
              {server?.footer}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function MatchedText({ text, query }: { text: string; query: string }) {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;
  const parts = text.split(new RegExp(`(${escaped.join("|")})`, "gi"));
  return parts.map((part, index) =>
    index % 2 ? (
      <strong key={index} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
