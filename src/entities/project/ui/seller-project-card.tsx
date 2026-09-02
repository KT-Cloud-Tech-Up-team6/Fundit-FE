import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";
import { ProgressBar } from "@/shared/components/ui/progress-bar";

type SellerProjectBase = {
  id: string;
  title: string;
  badges: readonly string[];
};

export type SellerProject = SellerProjectBase &
  (
    | {
        status: "draft";
        progressLabel: string;
        openScheduledAt: string;
        updatedAt: string;
      }
    | {
        status: "active" | "closed";
        category: string;
        period: string;
        participantCount: number;
        currentAmount: number;
        goalAmount: number;
      }
  );

/* IA FL_S_PR_LIST → FL_S_PR_DTL. 상태별 기본 진입 탭이 달라 목적지도 갈린다.
   ponytail: 상세 허브 라우트가 아직 없어 각 탭 URL로 직접 보낸다. */
const destinations = {
  draft: (id: string) => `/seller/projects/${id}/edit`,
  active: (id: string) => `/seller/projects/${id}/funding`,
  closed: (id: string) => `/seller/projects/${id}/fulfillment`,
} as const;

const actionLabels = { draft: "관리", active: "관리", closed: "확인하기" } as const;

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function SellerProjectCard(project: SellerProject) {
  const href = destinations[project.status](project.id);

  return (
    <article className="border-border-default bg-layer-surface-default flex h-[146px] items-start justify-between gap-6 border-b p-5">
      <div className="flex min-w-0 flex-1 gap-6">
        <div className="bg-border-default text-body-s text-text-primary-live flex size-[81px] shrink-0 items-center justify-center">
          IMG
        </div>
        <div className="flex max-w-[268px] min-w-0 flex-1 flex-col">
          <h3 className="text-body-strong truncate">
            <Link href={href} className="hover:underline">
              {project.title}
            </Link>
          </h3>

          {project.status === "draft" ? (
            <>
              <p className="text-title-s mt-0.5 truncate">{project.progressLabel}</p>
              <dl className="text-caption-m text-text-secondary mt-4">
                <div className="flex gap-1">
                  <dt>오픈 예정일</dt>
                  <dd>{project.openScheduledAt}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>마지막 수정일</dt>
                  <dd>{project.updatedAt}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="text-caption-m text-text-secondary flex min-w-0 items-center gap-1 truncate">
                <span>{project.category}</span>
                <span aria-hidden>·</span>
                <span>{project.period}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex shrink-0 items-center gap-1">
                  <Icon name="people" className="size-3.5" />
                  {project.participantCount}명
                </span>
              </p>
              <FundingProgress
                currentAmount={project.currentAmount}
                goalAmount={project.goalAmount}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex h-[106px] w-34 shrink-0 flex-col items-end justify-between">
        <div className="flex gap-1">
          {project.badges.map((badge) => (
            <span
              key={badge}
              className="text-caption-s bg-layer-surface-disabled text-text-default flex h-6 min-w-[66px] items-center justify-center rounded-full px-2 whitespace-nowrap"
            >
              {badge}
            </span>
          ))}
        </div>
        <Link
          href={href}
          className="text-body-s bg-layer-surface-disabled focus-visible:outline-border-primary flex h-9 w-full items-center justify-center rounded-xs hover:bg-[var(--charcoal-200)] focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {actionLabels[project.status]}
        </Link>
      </div>
    </article>
  );
}

function FundingProgress({
  currentAmount,
  goalAmount,
}: {
  currentAmount: number;
  goalAmount: number;
}) {
  const rate = goalAmount > 0 ? Math.round((currentAmount / goalAmount) * 100) : 0;

  return (
    <>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-title-s">{won(currentAmount)}</span>
        <span className="text-body-s text-text-secondary">/ {won(goalAmount)}</span>
      </p>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <ProgressBar knob={false} value={rate} aria-label="목표 대비 달성률" />
        </div>
        <span aria-hidden className="text-title-s w-14 shrink-0 text-right">
          {rate} %
        </span>
      </div>
    </>
  );
}
