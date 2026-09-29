import Link from "next/link";
import type { ReactNode } from "react";
import { ORDER_FETCH_ALL_MAX_REQUESTS, ORDER_FETCH_ALL_SIZE } from "@/entities/order/api/order-api";
import { BuyerAccountScreen } from "@/shared/components/layout/buyer-account-screen";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { formatWon, type FundingCard } from "../model/funding-history";
import type {
  FundingCategory,
  FundingHistoryFilter,
  FundingPeriodRange,
} from "../model/funding-history-filter";
import { FundingActionButtons, FundingThumbnail } from "./funding-card-parts";
import { FundingHistoryFilters } from "./funding-history-filters";

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

/** 참여/배송 내역(FL_B_MY_FUND_1). 검색·기간은 서버가 거르므로(BE #181) 여기서는 값과 변경만
    주고받는다. 분류 중 진행 단계 넷은 화면이 거른 결과를 받는다(#431). 페이지 이동은 children으로 받는다. */
export function FundingHistoryList({
  cards,
  total,
  filter,
  today,
  onSearch,
  onPeriodChange,
  onCategoryChange,
  pending = false,
  loading = false,
  truncated = false,
  children,
}: {
  /** 조건을 적용해 최신 참여순으로 받은 현재 페이지. */
  cards: FundingCard[];
  /** 조건을 적용한 전체 건수(서버 totalElements, 진행 단계 분류면 화면이 거른 건수). */
  total: number;
  /** 적용 중인 검색어·기간·분류. */
  filter: FundingHistoryFilter;
  /** 한국 날짜 `yyyy-MM-dd`. */
  today: string;
  onSearch: (q: string) => void;
  onPeriodChange: (range: FundingPeriodRange) => void;
  onCategoryChange: (category: FundingCategory) => void;
  /** 첫 목록을 기다리고 있다. 조건 줄은 그대로 두고 건수·목록 자리에 안내를 둔다. */
  pending?: boolean;
  /** 조건·페이지를 바꾼 뒤 새 목록을 기다리는 동안 이전 목록을 보여 주고 있다. */
  loading?: boolean;
  /** 진행 단계 분류에서 받을 수 있는 최대 건수에 닿아 그 안에서만 걸렀다. */
  truncated?: boolean;
  /** 페이지 이동처럼 목록 아래에 덧붙일 요소. */
  children?: ReactNode;
}) {
  /* 범위를 벗어난 page로 들어오면 content가 비어 있는데 totalElements는 그대로라 0개로 보인다. */
  const count = cards.length > 0 ? total : 0;

  return (
    <FundingListScreen>
      {/* 09-25 기록: 전체 배경색을 surface_default로 바꿨다(update_history 1143:23610). */}
      <div className="bg-layer-surface-default min-h-[calc(100dvh-52px)] w-full pb-[calc(var(--buyer-bottom-navigation-height)+env(safe-area-inset-bottom))] min-[1200px]:min-h-0 min-[1200px]:pb-16">
        <FundingHistoryFilters
          count={pending ? undefined : count}
          filter={filter}
          today={today}
          onSearch={onSearch}
          onPeriodChange={onPeriodChange}
          onCategoryChange={onCategoryChange}
        />
        {pending ? (
          <p className="text-body-s px-5 py-24 text-center" role="status">
            참여 내역을 불러오고 있습니다.
          </p>
        ) : (
          <>
            {/* 이전 목록이 새 조건의 결과로 읽히지 않도록 조건 줄 바로 아래에 알린다. */}
            {loading && (
              <p role="status" className="text-caption-m text-text-secondary px-5 pb-3">
                목록을 불러오고 있습니다.
              </p>
            )}
            {/* 원본 없음. 건수가 모자랄 수 있음을 숨기지 않는다(노션 FE 자체 판단, #431). */}
            {truncated && (
              <p className="text-caption-m text-text-secondary px-5 pb-3">
                참여 내역이 많아 최근{" "}
                {(ORDER_FETCH_ALL_SIZE * ORDER_FETCH_ALL_MAX_REQUESTS).toLocaleString("ko-KR")}건
                안에서만 찾았습니다.
              </p>
            )}
            <div aria-busy={loading}>
              {cards.length === 0 ? (
                /* 기간 조건이 항상 걸려 있어 조건에 맞는 내역이 없다고 안내한다(#431). */
                <p className="text-body-s px-5 py-24 text-center">
                  조건에 맞는 참여 내역이 없습니다.
                </p>
              ) : (
                cards.map((card) => <FundingCardItem key={card.id} card={card} />)
              )}
            </div>
            {children}
          </>
        )}
      </div>
    </FundingListScreen>
  );
}
