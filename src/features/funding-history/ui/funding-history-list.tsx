"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import {
  actionsForStatus,
  demoFundingHistoryItems,
  filterFundingHistory,
  formatDate,
  formatWon,
  fundingHistoryStatusLabel,
  fundingHistoryStatuses,
  fundingPeriodOptions,
  type FundingHistoryStatus,
  type FundingPeriod,
} from "../model/funding-history";

/* ponytail: 펀딩 집계·필터 API가 없어(docs/OPEN_DECISIONS.md P1) 목록은 useState 목업이다.
   API가 생기면 demoFundingHistoryItems 자리를 서버 응답으로 바꾼다. 기간 필터는 UI만
   반영하며, 필터링 API·데이터 모델이 확정되면 실제 날짜 비교 로직을 연결한다. */

const statusFilterOptions = [
  { value: "all", label: "전체" },
  ...fundingHistoryStatuses.map((value) => ({ value, label: fundingHistoryStatusLabel[value] })),
];

export function FundingHistoryList() {
  const [items] = useState(demoFundingHistoryItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FundingHistoryStatus | "all">("all");
  const [period, setPeriod] = useState<FundingPeriod>(fundingPeriodOptions[0].value);

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
          size="lg"
          placeholder="검색어를 입력하세요"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />
        <div className="flex items-center justify-between gap-1 pt-3 pb-2">
          <p className="text-body-m text-text-default">총 {filtered.length}개</p>
          <div className="flex w-[225px] items-center justify-end gap-1">
            <Dropdown
              size="xs"
              className="min-w-[88px]"
              aria-label="기간 필터"
              value={period}
              options={fundingPeriodOptions}
              onValueChange={(value) => setPeriod(value as FundingPeriod)}
            />
            <Dropdown
              size="xs"
              className="min-w-[54px]"
              aria-label="상태 필터"
              value={status}
              options={statusFilterOptions}
              onValueChange={(value) => setStatus(value as FundingHistoryStatus | "all")}
            />
          </div>
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
                <div className="flex items-center gap-2">
                  <p className="text-caption-m text-text-secondary">
                    결제 일 {formatDate(item.paidAt)}
                  </p>
                  <Link
                    href={`/my/fundings/${item.id}`}
                    className="text-caption-m text-text-secondary flex items-center gap-1 p-1"
                  >
                    펀딩 상세
                    <Icon name="next" className="size-3.5" />
                  </Link>
                </div>
              </div>
              <div className="flex gap-3">
                {/* Figma 원본 상품 썸네일을 프로젝트 자산으로 보관한다. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageSrc}
                  alt=""
                  className="size-[76px] shrink-0 rounded-xs object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="text-body-m text-text-default">{item.creatorName}</p>
                  <p className="text-body-emphasis text-text-default truncate">
                    {item.projectTitle}
                  </p>
                  <p className="text-body-m text-text-default flex gap-1">
                    <span className="truncate">{item.rewardOption}</span>
                    <span aria-hidden>·</span>
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

      <BuyerBottomNavigation compact activeHref="/my" className="sticky bottom-0 mt-auto" />
    </div>
  );
}
