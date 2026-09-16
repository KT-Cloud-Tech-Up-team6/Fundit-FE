"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SellerRow } from "@/entities/seller/ui/seller-row";
import { ProjectRow } from "@/entities/project/ui/project-row";
import { SearchField } from "@/shared/components/ui/search-field";
import { Icon } from "@/shared/components/ui/icon";
import { Tab, TabList } from "@/shared/components/ui/tab";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { secondaryButtonClasses } from "@/shared/components/ui/button";
import {
  addRecentSearch,
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
}: {
  query: SearchQuery;
  onQueryChange: (query: SearchQuery) => void;
  initialInput?: string;
}) {
  const [draft, setDraft] = useState({
    base: query.q,
    value: initialInput || query.q,
    editing: Boolean(initialInput),
  });
  const [recent, setRecent] = useState(["무선 청소기", "수박", "육하원칙"]);
  const [following, setFollowing] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<string[]>([]);
  const composing = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  if (draft.base !== query.q) {
    setDraft({ base: query.q, value: query.q, editing: false });
  }
  const value = draft.base === query.q ? draft.value : query.q;
  const editing = draft.base === query.q && draft.editing;
  const results = searchResults(query);
  const suggestions = searchResults({ ...query, q: value });
  const count =
    query.tab === "projects"
      ? results.projects.length
      : query.tab === "live"
        ? results.lives.length
        : results.sellers.length;

  function submit(word = value, tab = query.tab) {
    if (composing.current) return;
    const q = word.trim();
    setRecent((current) => addRecentSearch(current, q));
    setDraft({ base: q, value: q, editing: false });
    onQueryChange({ ...query, q, tab });
    input.current?.blur();
  }

  return (
    <main className="bg-layer-surface-default text-text-default [&_a:focus-visible]:outline-border-primary [&_button:focus-visible]:outline-border-primary [&_select:focus-visible]:outline-border-primary mx-auto min-h-dvh max-w-[390px] pb-[env(safe-area-inset-bottom)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:-outline-offset-2 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:-outline-offset-2 [&_select:focus-visible]:outline-2 [&_select:focus-visible]:-outline-offset-2">
      <h1 className="sr-only">통합 검색</h1>
      <form
        role="search"
        className="bg-layer-surface-default sticky top-0 z-10 px-5 py-2"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <SearchField
          size="lg"
          ref={input}
          aria-label="통합 검색어"
          placeholder="검색어를 입력해주세요"
          className="border-border-primary! rounded-sm"
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
        <div className="px-5">
          {!value.trim() ? (
            <>
              <section className="py-3" aria-label="최근 검색어">
                <h2 className="text-body-emphasis mb-3">최근</h2>
                <div className="flex flex-wrap gap-2">
                  {recent.map((word) => (
                    <div key={word} className={`${secondaryButtonClasses} h-9 gap-2 px-3`}>
                      <button type="button" onClick={() => submit(word)}>
                        {word}
                      </button>
                      <button
                        type="button"
                        aria-label={`${word} 최근 검색어 삭제`}
                        onClick={() => setRecent((items) => items.filter((item) => item !== word))}
                      >
                        <Icon name="closeSmall" className="block size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {!recent.length && (
                  <p className="text-caption-m text-text-disabled">최근 검색어가 없습니다.</p>
                )}
              </section>
              <section className="py-3" aria-label="인기 검색어">
                <h2 className="text-body-emphasis mb-3">인기 검색어</h2>
                <ol className="flex gap-2 overflow-x-auto pb-2">
                  {["수박", "무선 청소기", "육하원칙", "만병통치약", "케클업"].map(
                    (word, index) => (
                      <li key={word} className="shrink-0">
                        <button
                          type="button"
                          className={`${secondaryButtonClasses} h-9 px-3`}
                          onClick={() => submit(word)}
                        >
                          {index + 1} {word}
                        </button>
                      </li>
                    ),
                  )}
                </ol>
              </section>
            </>
          ) : (
            <section aria-label="연관 검색어" className="py-2">
              {tabs
                .filter((tab) =>
                  tab.value === "projects"
                    ? suggestions.projects.length
                    : tab.value === "live"
                      ? suggestions.lives.length
                      : suggestions.sellers.length,
                )
                .map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className="text-body-m flex min-h-11 w-full items-center gap-2 text-left"
                    onClick={() => submit(value, tab.value)}
                  >
                    {tab.value === "projects" ? (
                      <span
                        aria-hidden
                        className="size-4 bg-current [mask-image:url('/icons/search.svg')] [mask-size:contain]"
                      />
                    ) : tab.value === "live" ? (
                      <Icon name="live" className="size-4 shrink-0" />
                    ) : (
                      <span
                        aria-hidden
                        className="bg-border-default size-5 shrink-0 rounded-full"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {value} <span className="text-text-disabled">{tab.label}</span>
                    </span>
                    <Icon name="next" className="size-4" />
                  </button>
                ))}
              {!suggestions.projects.length &&
                !suggestions.lives.length &&
                !suggestions.sellers.length && (
                  <button
                    type="button"
                    className="text-body-m w-full py-3 text-left"
                    onClick={() => submit()}
                  >
                    {value} 검색
                  </button>
                )}
            </section>
          )}
        </div>
      ) : (
        <>
          <TabList
            className="w-full!"
            aria-label="검색 결과 유형"
            selectedIndex={tabs.findIndex((tab) => tab.value === query.tab)}
            onSelectedIndexChange={(index) => onQueryChange({ ...query, tab: tabs[index].value })}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                id={`search-${tab.value}`}
                aria-controls="search-results"
                className="w-auto! flex-1"
                size="md"
              >
                {tab.label}
              </Tab>
            ))}
          </TabList>
          <section
            id="search-results"
            role="tabpanel"
            aria-labelledby={`search-${query.tab}`}
            className="px-5 pb-6"
          >
            {query.tab !== "sellers" && (
              <div className="text-caption-m flex flex-wrap items-center justify-between gap-2 py-4">
                <p role="status">총 {count}개</p>
                <div className="flex items-center gap-2">
                  {query.tab === "projects" && (
                    <Checkbox
                      checked={query.closed}
                      shape="circle"
                      className="text-[0.75rem]"
                      onChange={(event) =>
                        onQueryChange({ ...query, closed: event.target.checked })
                      }
                    >
                      종료 프로젝트 보기
                    </Checkbox>
                  )}
                  <select
                    aria-label="검색 결과 정렬"
                    className="max-w-24 bg-transparent"
                    value={query.sort}
                    onChange={(event) =>
                      onQueryChange({ ...query, sort: event.target.value as SearchQuery["sort"] })
                    }
                  >
                    <option value="latest">최신순</option>
                    <option value="popular">인기순</option>
                    <option value="closing">마감 임박순</option>
                  </select>
                </div>
              </div>
            )}
            {query.tab === "live" && (
              <div className="mb-2 flex gap-2" role="group" aria-label="라이브 진행 상태">
                {(["live", "upcoming"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={query.status === status}
                    className={`border-border-default text-caption-m rounded-xs border px-3 py-2 ${query.status === status ? "bg-border-default" : "bg-layer-surface-default"}`}
                    onClick={() => onQueryChange({ ...query, status })}
                  >
                    {status === "live" ? "진행 중" : "진행 예정"}
                  </button>
                ))}
              </div>
            )}
            {count === 0 ? (
              <div role="status" className="pt-32 text-center">
                <p className="text-body-emphasis">검색 결과가 없습니다</p>
                <p className="text-caption-m mt-2">검색어의 상위 항목으로 다시 시도해보세요!</p>
              </div>
            ) : query.tab === "projects" ? (
              <div className="space-y-3">
                {results.projects.map((project) => (
                  <ProjectRow key={project.id} project={project} thumbnailClassName="w-[36.57%]" />
                ))}
              </div>
            ) : query.tab === "live" ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {results.lives.map((live) => (
                  <article key={live.id}>
                    {query.status === "live" ? (
                      <Link href={`/live/${live.id}`}>
                        <div className="bg-layer-surface-disabled relative mb-2 aspect-square rounded-xs">
                          <span className="bg-border-default text-label-m absolute top-2 right-2 flex items-center gap-1 rounded-xs px-2 py-1">
                            <Icon name="live" className="size-3.5" />
                            LIVE
                          </span>
                        </div>
                        <h2 className="line-clamp-2 min-h-10 text-[0.875rem] leading-5 font-medium">
                          {live.title}
                        </h2>
                        <p className="text-label-m mt-1">{live.seller}</p>
                      </Link>
                    ) : (
                      <>
                        <div className="bg-layer-surface-disabled mb-2 flex aspect-square flex-col items-center justify-center rounded-xs">
                          <p className="text-title-m">{live.date}</p>
                          <p className="text-body-emphasis">{live.time}</p>
                        </div>
                        <h2 className="line-clamp-2 min-h-10 text-[0.875rem] leading-5 font-medium">
                          {live.title}
                        </h2>
                        <p className="text-caption-m my-1">
                          {(
                            live.subscribers + Number(notifications.includes(live.id))
                          ).toLocaleString("ko-KR")}
                          명 알림 신청
                        </p>
                        <button
                          type="button"
                          aria-label={`${live.date} ${live.title} 시작 알림`}
                          aria-pressed={notifications.includes(live.id)}
                          className="border-border-default text-caption-m flex min-h-9 w-full items-center justify-center gap-2 rounded-xs border"
                          onClick={() =>
                            setNotifications((ids) =>
                              ids.includes(live.id)
                                ? ids.filter((id) => id !== live.id)
                                : [...ids, live.id],
                            )
                          }
                        >
                          {notifications.includes(live.id) ? "알림 신청됨" : "알림 받기"}
                          <span
                            aria-hidden
                            className="size-4 bg-current [mask-image:url('/icons/buyer-live/bell-add.svg')] [mask-size:contain] [mask-repeat:no-repeat]"
                          />
                        </button>
                      </>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-1">
                {results.sellers.map((seller) => (
                  <SellerRow
                    key={seller.id}
                    seller={seller}
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
          </section>
        </>
      )}
    </main>
  );
}
