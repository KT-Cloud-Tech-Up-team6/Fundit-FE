import Link from "next/link";
import type { ReactNode } from "react";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { formatWon, type FundingCard } from "../model/funding-history";
import { FundingActionButtons, FundingThumbnail } from "./funding-card-parts";

/** 목록·로딩·오류가 같은 껍데기를 쓰도록 제목·breadcrumb·하단 메뉴를 한곳에 둔다. */
export function FundingListScreen({
  children,
  fullPage = false,
}: {
  children: ReactNode;
  fullPage?: boolean;
}) {
  return (
    <BuyerAccountScreen
      title="참여/배송 내역"
      breadcrumb={["마이페이지", "펀딩내역"]}
      fullPage={fullPage}
    >
      {children}
      <BuyerBottomNavigation
        activeHref="/my"
        compact
        className="fixed inset-x-0 bottom-0 z-20 w-full min-[1200px]:hidden"
      />
    </BuyerAccountScreen>
  );
}

/* card_funding_item(2323:52379): 위 12px·좌우 16px, 아래 테두리 #DDDEE2. */
function FundingCardItem({ card }: { card: FundingCard }) {
  return (
    <article className="border-border-default flex flex-col gap-2 border-b px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-l shrink-0">{card.stage}</p>
        <div className="flex min-w-0 items-center justify-end gap-2">
          {card.paidAt && (
            <p className="text-label-m text-text-secondary flex gap-1 font-medium whitespace-nowrap">
              <span>결제일</span>
              <span>{card.paidAt}</span>
            </p>
          )}
          <Link
            href={`/my/fundings/${card.id}`}
            className="text-caption-s flex shrink-0 items-center gap-1 font-medium"
          >
            펀딩 상세
            <span className="flex px-1 py-2">
              <Icon name="next" className="size-3.5" />
            </span>
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <FundingThumbnail src={card.imageSrc} className="size-[76px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-col gap-1">
              {card.creatorName && (
                <p className="text-caption-m text-text-secondary truncate">{card.creatorName}</p>
              )}
              <h2 className="text-label-l truncate">{card.projectTitle || " "}</h2>
              <p className="text-caption-s flex gap-1">
                <span className="truncate">{card.reward}</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{card.quantity}개</span>
              </p>
            </div>
            <p className="text-caption-m">{formatWon(card.amount)}</p>
          </div>
        </div>
        <FundingActionButtons actions={card.actions} />
      </div>
    </article>
  );
}

/** 참여/배송 내역(FL_B_MY_FUND_1). 서버 목록이 검색·기간·분류를 받지 않아 필터는 두지 않는다
    (노션 FE 자체 판단 31). 페이지 이동은 children으로 받는다. */
export function FundingHistoryList({
  cards,
  total,
  loading = false,
  children,
}: {
  /** 서버가 최신순으로 준 현재 페이지. */
  cards: FundingCard[];
  /** 서버 전체 건수(totalElements). */
  total: number;
  /** 페이지를 바꾼 뒤 새 목록을 기다리는 동안 이전 목록을 보여 주고 있다. */
  loading?: boolean;
  /** 페이지 이동처럼 목록 아래에 덧붙일 요소. */
  children?: ReactNode;
}) {
  /* 범위를 벗어난 page로 들어오면 content가 비어 있는데 totalElements는 그대로라 0개로 보인다. */
  const count = cards.length > 0 ? total : 0;

  return (
    <FundingListScreen>
      {/* 09-25 기록: 전체 배경색을 surface_default로 바꿨다(update_history 1143:23610). */}
      <div className="bg-layer-surface-default min-h-[calc(100dvh-52px)] w-full pb-[calc(54px+env(safe-area-inset-bottom))] min-[1200px]:min-h-0 min-[1200px]:pb-16">
        <p className="text-body-s px-5 py-2">총 {count}개</p>
        {loading && (
          <p role="status" className="text-caption-m text-text-secondary px-5 pb-3">
            목록을 불러오고 있습니다.
          </p>
        )}
        <div aria-busy={loading}>
          {cards.length === 0 ? (
            <p className="text-body-s px-5 py-24 text-center">참여 내역이 없습니다.</p>
          ) : (
            cards.map((card) => <FundingCardItem key={card.id} card={card} />)
          )}
        </div>
        {children}
      </div>
    </FundingListScreen>
  );
}
