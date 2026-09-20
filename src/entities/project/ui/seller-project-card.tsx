import Image from "next/image";
import Link from "next/link";
import { type SellerProject } from "@/entities/project/model/seller-project";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { ProgressBar } from "@/shared/components/ui/progress-bar";

export type { SellerProject } from "@/entities/project/model/seller-project";

/* IA FL_S_PR_LIST → FL_S_PR_DTL. 상태별 기본 진입 탭이 달라 목적지도 갈린다. */
const destinations = {
  draft: (id: string) => `/seller/projects/${id}?tab=story`,
  active: (id: string) => `/seller/projects/${id}?tab=funding`,
  closed: (id: string) => `/seller/projects/${id}?tab=fulfillment`,
} as const;

const won = (value: number) => `${value.toLocaleString("ko-KR")}원`;

export function SellerProjectCard(project: SellerProject & { hrefOverride?: string }) {
  const href = project.hrefOverride ?? destinations[project.status](project.id);

  return (
    <article
      className={`border-border-default flex min-w-0 flex-col gap-4 border-b p-5 md:flex-row md:items-start md:justify-between md:gap-6 ${project.status === "draft" ? "md:h-[136px]" : "md:h-[148px]"}`}
    >
      <div className="flex min-w-0 flex-1 gap-4 md:gap-6">
        <div className="bg-layer-bg size-[82px] shrink-0 overflow-hidden rounded-xs">
          {project.thumbnail && (
            <Image
              src={project.thumbnail}
              alt=""
              width={82}
              height={82}
              className="size-full object-cover"
              unoptimized={/^https?:\/\//.test(project.thumbnail)}
            />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col md:max-w-[268px]">
          {project.status === "draft" ? (
            <>
              <Badge size="sm" variant="info">
                {project.draftPhaseLabel}
              </Badge>
              <h3 className="text-body-strong mt-1 truncate">
                <Link href={href} className="hover:underline">
                  {project.title}
                </Link>
              </h3>
              <dl className="text-caption-m text-text-secondary mt-1">
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
              <h3 className="text-body-strong truncate">
                <Link href={href} className="hover:underline">
                  {project.title}
                </Link>
              </h3>
              <p className="text-caption-m text-text-secondary flex min-w-0 items-center gap-1 truncate">
                <span>{project.category}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{project.period}</span>
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

      <div className="flex w-full shrink-0 items-center justify-between gap-2 md:h-[106px] md:w-34 md:flex-col md:items-end md:justify-between">
        <div className="flex min-w-0 flex-wrap gap-1">
          {project.badges.map((badge) => (
            <Badge key={badge.label} variant={badge.variant} size="md" shape="rounded">
              {badge.label}
            </Badge>
          ))}
        </div>
        <Button
          href={href}
          variant="secondary"
          size="md"
          className="text-caption-m! h-9! w-28 shrink-0 font-medium! md:w-full"
        >
          관리
        </Button>
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
          {rate}%
        </span>
      </div>
    </>
  );
}
