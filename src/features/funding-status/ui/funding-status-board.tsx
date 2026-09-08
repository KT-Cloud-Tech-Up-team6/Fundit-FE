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

/* ponytail: 와이어프레임 breadcrumb의 "제작 · 배송 > 발송정보"는 제작·배송 화면에서
   복사된 잔재라, 이 화면 경로로 바로잡아 둔다. */
const breadcrumb = ["내 프로젝트", "펀딩 관리"];

const rewardColumns = ["리워드", "선택 옵션", "후원 수량", "펀딩 금액"] as const;

type FundingStatusBoardProps = {
  /** Storybook에서 상태를 바꿔 끼우기 위한 자리. 화면에서는 목업 기본값을 쓴다. */
  summary?: FundingSummary;
  rewards?: RewardStatusRow[];
};

export function FundingStatusBoard({
  summary = demoFundingSummary(),
  rewards = demoRewardRows(),
}: FundingStatusBoardProps) {
  const rate = achievementRate(summary.raisedAmount, summary.goalAmount);
  const stats = [
    { label: "목표 금액", value: formatWon(summary.goalAmount) },
    { label: "달성금액", value: formatWon(summary.raisedAmount) },
    { label: "후원자 수", value: formatPeople(summary.backerCount) },
    { label: "찜 · 알림 신청", value: formatPeople(summary.wishlistCount) },
    { label: "오픈 알림 신청", value: formatPeople(summary.openAlertCount) },
  ];

  return (
    <div className="min-w-0 flex-1">
      <nav aria-label="이동 경로" className="text-label-m text-text-secondary">
        <ol className="flex items-center gap-2">
          {breadcrumb.map((crumb, index) => (
            <li key={crumb} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden>{">"}</span>}
              <span
                aria-current={index === breadcrumb.length - 1 ? "page" : undefined}
                className={index === breadcrumb.length - 1 ? "text-text-default" : undefined}
              >
                {crumb}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-heading-l">펀딩 관리</h1>
        {/* ponytail: PDF 생성은 이번 범위 밖(Issue #52). 라벨만 있는 버튼으로 둔다.
            생성 방식이 정해지면 onClick 또는 Link 목적지를 붙인다. */}
        <button
          type="button"
          className="text-title-s bg-layer-surface-primary text-text-inverse hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary flex h-[46px] shrink-0 items-center justify-center rounded-xs px-6 font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          PDF 다운로드
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        <section
          aria-label="프로젝트 요약"
          className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="flex min-w-0 flex-1 gap-5">
            <div className="bg-border-default text-body-s text-text-primary-live flex size-[81px] shrink-0 items-center justify-center rounded-xs">
              IMG
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-title-s truncate">{summary.title}</p>
              <p className="text-body-s text-text-secondary flex min-w-0 items-center gap-1">
                <span className="shrink-0">{summary.category}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{formatPeriod(summary.period)}</span>
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  {/* 막대는 100으로 클램프되므로 초과 달성률은 aria-valuetext로 따로 전달한다. */}
                  <ProgressBar
                    value={rate}
                    aria-label="목표 대비 달성률"
                    aria-valuetext={`목표 대비 ${rate}% 달성`}
                  />
                </div>
                <p aria-hidden className="flex shrink-0 items-baseline gap-1">
                  <span className="text-title-m">{rate}</span>
                  <span className="text-title-s">%</span>
                </p>
              </div>
            </div>
          </div>
          {/* ponytail: 남은 기간 배지. 펀딩 상태 enum이 미확정(P1)이라 문자열을 그대로 보여준다. */}
          <span className="text-body-s bg-layer-surface-disabled text-text-default flex h-7 shrink-0 items-center justify-center rounded-full px-2 whitespace-nowrap">
            {summary.dday}
          </span>
        </section>

        <section aria-labelledby="funding-engagement-title">
          <h2 id="funding-engagement-title" className="text-title-s py-2">
            참여 현황
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-layer-surface-disabled flex flex-col gap-2 rounded-xs px-6 py-4"
              >
                <dt className="text-body-s text-text-secondary">{stat.label}</dt>
                <dd className="text-body-emphasis text-text-default">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="funding-reward-title">
          <h2 id="funding-reward-title" className="text-title-s py-2">
            리워드 현황
          </h2>
          <div className="border-w-xs border-border-default overflow-x-auto rounded-xs">
            <table className="w-full min-w-[560px] text-left">
              <caption className="sr-only">리워드별 후원 현황</caption>
              <thead>
                <tr className="bg-layer-surface-disabled">
                  {rewardColumns.map((column) => (
                    <th key={column} scope="col" className="text-body-emphasis px-4 py-2">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rewards.map((reward) => (
                  <tr key={reward.id}>
                    <td className="text-body-s px-4 py-2">
                      <span className="block max-w-[200px] truncate">{reward.name}</span>
                    </td>
                    <td className="text-body-s px-4 py-2 whitespace-nowrap">{reward.option}</td>
                    <td className="text-body-s px-4 py-2 whitespace-nowrap">
                      {formatQuantity(reward.quantity)}
                    </td>
                    <td className="text-body-s px-4 py-2 whitespace-nowrap">
                      {formatWon(reward.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
