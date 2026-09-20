import Image from "next/image";
import { Badge } from "@/shared/components/ui/badge";
import { Breadcrumb } from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { ProgressBar } from "@/shared/components/ui/progress-bar";
import {
  achievementRate,
  demoFundingSummary,
  demoRewardRows,
  formatPeople,
  formatPeriod,
  formatQuantity,
  formatWon,
} from "../model/funding-demo";
import type { FundingSummary, RewardStatusRow } from "../model/funding-demo";

const breadcrumb = ["내 프로젝트", "펀딩 관리"];
const rewardColumns = ["리워드", "선택 옵션", "후원 수량", "펀딩 금액"] as const;

type FundingStatusBoardProps = {
  summary?: FundingSummary;
  rewards?: RewardStatusRow[];
};

export function FundingStatusBoard({
  summary = demoFundingSummary(),
  rewards = demoRewardRows(),
}: FundingStatusBoardProps) {
  const rate = achievementRate(summary.raisedAmount, summary.goalAmount ?? 0);
  const stats = [
    {
      label: "목표 금액",
      value: summary.goalAmount === null ? "—" : formatWon(summary.goalAmount),
    },
    { label: "달성금액", value: formatWon(summary.raisedAmount) },
    { label: "후원자 수", value: formatPeople(summary.backerCount) },
    {
      label: "찜 · 알림 신청",
      value: summary.wishlistCount === null ? "—" : formatPeople(summary.wishlistCount),
    },
    {
      label: "오픈 알림 신청",
      value: summary.openAlertCount === null ? "—" : formatPeople(summary.openAlertCount),
    },
  ];

  return (
    <div className="w-full min-w-0 flex-1 lg:max-w-[793px]">
      <header className="flex min-h-20 flex-col gap-4">
        <Breadcrumb items={breadcrumb} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-heading-l">펀딩 관리</h1>
          <Button disabled size="md" appearance="cta" className="w-45" title="PDF 다운로드 준비 중">
            PDF 다운로드
          </Button>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3">
        <section
          aria-label="프로젝트 요약"
          className="relative flex flex-col gap-3 sm:min-h-[108px]"
        >
          <div className="flex min-w-0 gap-4 sm:gap-6">
            {summary.thumbnail && (
              <Image
                src={summary.thumbnail}
                unoptimized
                alt=""
                width={82}
                height={82}
                className="bg-layer-bg size-[82px] shrink-0 rounded-xs object-cover"
              />
            )}
            <div className="min-w-0 flex-1 sm:pr-[118px]">
              <p className="text-body-strong truncate" title={summary.title}>
                {summary.title}
              </p>
              <p className="text-caption-m text-text-secondary flex flex-wrap items-center gap-1">
                <span>{summary.category}</span>
                <span aria-hidden>·</span>
                <span>{formatPeriod(summary.period)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="people" className="size-3.5" />
                  {formatPeople(summary.backerCount)}
                </span>
              </p>
              <p className="mt-3 flex flex-wrap items-baseline gap-1">
                <span className="text-title-s">{formatWon(summary.raisedAmount)}</span>
                <span className="text-body-s text-text-secondary">
                  / {summary.goalAmount === null ? "—" : formatWon(summary.goalAmount)}
                </span>
              </p>
              <div className="flex h-[26px] items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ProgressBar
                    knob={false}
                    value={rate}
                    aria-label="목표 대비 달성률"
                    aria-valuetext={`목표 대비 ${rate}% 달성`}
                  />
                </div>
                <p aria-hidden className="text-title-s flex w-14 shrink-0 justify-end gap-1">
                  <span>{rate}</span>
                  <span>%</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:absolute sm:top-0 sm:right-0">
            <Badge variant="neutral" size="md" shape="rounded">
              {summary.dday}
            </Badge>
            {summary.closedBadge ? (
              <Badge variant={summary.closedBadge.variant} size="md" shape="rounded">
                {summary.closedBadge.label}
              </Badge>
            ) : summary.goalAmount !== null &&
              summary.goalAmount > 0 &&
              summary.raisedAmount >= summary.goalAmount ? (
              <Badge variant="success" size="md" shape="rounded">
                목표 달성
              </Badge>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="funding-engagement-title">
          <h2 id="funding-engagement-title" className="text-title-s mb-2 font-medium!">
            참여 현황
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-layer-bg flex min-w-0 flex-col items-center gap-2 rounded-xs px-2 py-4"
              >
                <dt className="text-body-s text-text-secondary w-[82px] whitespace-nowrap">
                  {stat.label}
                </dt>
                <dd className="text-body-m min-w-[82px] whitespace-nowrap">
                  {stat.value === "—" ? <span aria-label="정보 없음">—</span> : stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="funding-reward-title">
          <h2 id="funding-reward-title" className="text-title-s mb-2 font-medium!">
            리워드 현황
          </h2>
          <div
            className="border-border-default overflow-x-auto rounded-xs border pb-1"
            role="region"
            aria-label="리워드 현황 표"
            tabIndex={0}
          >
            <table className="w-full min-w-[650px] table-fixed text-left">
              <caption className="sr-only">리워드별 후원 현황</caption>
              <colgroup>
                <col className="w-[32%]" />
                <col />
                <col />
                <col className="w-[19%]" />
              </colgroup>
              <thead>
                <tr className="bg-layer-bg">
                  {rewardColumns.map((column) => (
                    <th
                      key={column}
                      scope="col"
                      className="text-body-emphasis h-[30px] px-4 font-medium!"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td className="text-body-s h-10 px-4 pt-2.5">
                      <span className="block max-w-44 truncate" title={reward.name}>
                        {reward.name}
                      </span>
                    </td>
                    <td className="text-body-s px-4 pt-2.5 whitespace-nowrap">{reward.option}</td>
                    <td className="text-body-s px-4 pt-2.5 whitespace-nowrap">
                      {formatQuantity(reward.quantity)}
                    </td>
                    <td className="text-body-s px-4 pt-2.5 whitespace-nowrap">
                      {reward.amount === null ? "—" : formatWon(reward.amount)}
                    </td>
                  </tr>
                ))}
                {rewards.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-body-s text-text-secondary py-8 text-center">
                      리워드 현황을 확인할 수 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
