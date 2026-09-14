"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import {
  actionsForStatus,
  demoFundingHistoryItems,
  filterFundingHistory,
  formatWon,
  fundingHistoryStatusLabel,
  fundingHistoryStatuses,
  type FundingHistoryStatus,
} from "../model/funding-history";

/* ponytail: 펀딩 집계·필터 API가 없어(docs/OPEN_DECISIONS.md P1) 목록은 useState 목업이다.
   API가 생기면 demoFundingHistoryItems 자리를 서버 응답으로 바꾼다. */

export function FundingHistoryList() {
  const [items] = useState(demoFundingHistoryItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FundingHistoryStatus | "all">("all");

  const filtered = useMemo(
    () => filterFundingHistory(items, query, status),
    [items, query, status],
  );

  return (
    <div className="bg-layer-bg mx-auto flex min-h-dvh w-full max-w-[390px] min-w-0 flex-col">
      <header className="bg-layer-surface-default flex h-[52px] items-center gap-1 px-3">
        <Link
          href="/my"
          aria-label="뒤로"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="arrowLeft" className="text-text-default size-5" />
        </Link>
        <h1 className="text-title-s text-text-default flex-1 text-center">참여/배송 내역</h1>
        <Link
          href="/my/notifications"
          aria-label="알림"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="bell" className="text-text-default size-6" />
        </Link>
      </header>

      <div className="bg-layer-surface-default flex flex-col gap-2 px-5 py-2">
        <SearchField
          placeholder="프로젝트를 검색해보세요"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />
        <div className="flex items-center justify-between">
          <p className="text-body-m text-text-default">총 {filtered.length}개</p>
          <label className="text-body-m text-text-default relative flex items-center gap-1">
            <span className="sr-only">상태 필터</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as FundingHistoryStatus | "all")}
              className="text-body-m text-text-default appearance-none bg-transparent pr-4 text-right"
            >
              <option value="all">전체</option>
              {fundingHistoryStatuses.map((value) => (
                <option key={value} value={value}>
                  {fundingHistoryStatusLabel[value]}
                </option>
              ))}
            </select>
            <Icon
              name="arrowDown"
              aria-hidden
              className="text-text-default pointer-events-none absolute right-0 size-3.5"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {filtered.length === 0 ? (
          <p className="text-body-m text-text-secondary bg-layer-surface-default px-5 py-10 text-center">
            조건에 맞는 참여 내역이 없어요.
          </p>
        ) : (
          filtered.map((item) => (
            <article
              key={item.id}
              className="bg-layer-surface-default flex flex-col gap-4 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-body-emphasis text-text-default">
                  {fundingHistoryStatusLabel[item.status]}
                </h2>
                <Link
                  href={`/my/fundings/${item.id}`}
                  className="text-caption-m text-text-secondary flex items-center gap-1 p-1"
                >
                  펀딩 상세
                  <Icon name="next" className="size-3.5" />
                </Link>
              </div>
              <div className="flex gap-3">
                <div className="bg-layer-surface-disabled text-caption-m text-text-secondary flex size-[76px] shrink-0 items-center justify-center rounded-xs">
                  IMG
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-body-m text-text-default">{item.creatorName}</p>
                  <p className="text-body-emphasis text-text-default truncate">
                    {item.projectTitle}
                  </p>
                  <p className="text-body-m text-text-default flex gap-1">
                    <span className="truncate">{item.rewardOption}</span>
                    <span aria-hidden>X</span>
                    <span className="shrink-0">{item.rewardQuantity}개</span>
                  </p>
                  <p className="text-body-m text-text-default">{formatWon(item.amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actionsForStatus(item.id, item.status).map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="border-border-default text-body-m text-text-default flex h-10 flex-1 items-center justify-center rounded-xs border px-3 text-center"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      <BuyerBottomNavigation activeHref="/my" />
    </div>
  );
}
