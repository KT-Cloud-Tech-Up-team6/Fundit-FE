import Link from "next/link";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Button } from "@/shared/components/ui/button";
import {
  actionsForStatus,
  demoFundingDetail,
  formatDate,
  formatWon,
} from "../model/funding-history";

/* ponytail: 펀딩 상세 조회 API가 없어(docs/OPEN_DECISIONS.md P1) demoFundingDetail 목업을 쓴다.
   API가 생기면 fundingId로 서버 조회하도록 이 자리만 바꾼다. */

export function FundingDetail({ fundingId }: { fundingId: string }) {
  const detail = demoFundingDetail(fundingId);

  return (
    <BuyerAccountScreen
      title="펀딩 상세 내역"
      backHref="/my/fundings"
      backLabel="펀딩 내역으로 돌아가기"
      breadcrumb={["마이페이지", "펀딩내역", "펀딩 상세 내역"]}
      className="flex min-w-0 flex-col"
    >
      <div className="bg-layer-bg min-[1200px]:bg-layer-surface-default flex flex-1 flex-col gap-2 min-[1200px]:pb-16">
        <section className="bg-layer-surface-default flex flex-col gap-2 px-4 py-3">
          <p className="text-body-emphasis text-text-default">{detail.orderNumber}</p>
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={detail.imageSrc}
                alt=""
                className="size-16 shrink-0 rounded-xs object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-body-m text-text-default">{detail.creatorName}</p>
                <p className="text-body-emphasis text-text-default truncate">
                  {detail.projectTitle}
                </p>
                <p className="text-body-m text-text-default flex gap-1">
                  <span className="truncate">{detail.rewardOption}</span>
                  <span aria-hidden>·</span>
                  <span className="shrink-0">{detail.rewardQuantity}개</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {actionsForStatus(detail.id, detail.status).map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="border-border-default text-body-m text-text-default flex h-10 flex-1 items-center justify-center rounded-xs border px-3 text-center"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4">
          <h2 className="text-body-strong text-text-default">펀딩 정보</h2>
          <dl className="flex flex-col gap-2">
            <div className="text-body-m flex items-center gap-2">
              <dt className="text-text-default w-20 shrink-0">참여 일</dt>
              <dd className="text-text-default flex-1">{formatDate(detail.participatedAt)}</dd>
            </div>
            <div className="text-body-m flex items-center gap-2">
              <dt className="text-text-default w-20 shrink-0">결제 일</dt>
              <dd className="text-text-default flex-1">{formatDate(detail.paidAt)}</dd>
            </div>
            <div className="text-body-m flex items-center gap-2">
              <dt className="text-text-default w-20 shrink-0">리워드</dt>
              <dd className="text-text-default flex-1 truncate">{detail.rewardOption}</dd>
            </div>
            <div className="text-body-m flex items-center gap-2">
              <dt className="text-text-default w-20 shrink-0">옵션 · 수량</dt>
              <dd className="text-text-default flex-1">
                {detail.optionName} · {detail.rewardQuantity}개
              </dd>
            </div>
          </dl>
          <div className="flex items-end justify-between">
            <p className="text-body-emphasis text-text-default">펀딩 금액</p>
            <p className="text-body-emphasis text-text-default">{formatWon(detail.amount)}</p>
          </div>
        </section>
        <div className="hidden justify-center px-5 py-3 min-[1200px]:flex">
          <Button
            href="/my/fundings"
            variant="secondary"
            appearance="cta"
            size="lg"
            className="w-[189px]"
          >
            돌아가기
          </Button>
        </div>
        <BuyerBottomNavigation
          compact
          activeHref="/my"
          className="sticky bottom-0 mt-auto min-[1200px]:hidden"
        />
      </div>
    </BuyerAccountScreen>
  );
}
