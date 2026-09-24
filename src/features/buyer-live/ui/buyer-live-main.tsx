"use client";

import Image from "next/image";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import Link from "next/link";
import { Avatar } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { textButtonNavigationClasses } from "@/shared/components/ui/text-button";
import { Button } from "@/shared/components/ui/button";
import type { LiveSummaryResponse } from "@/entities/live/api/seller-live-api";
import {
  getLiveDemo,
  getLiveDemoConnection,
  getUpcomingProjectHref,
  subscribedIds,
  type LiveDemo,
} from "../model/live-demo";
import {
  fillRealSlots,
  noRealLives,
  realLiveHref,
  realLiveTitle,
  scheduleLabel,
  type RealLives,
} from "../model/live-main-real";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import styles from "./buyer-live-main.module.css";
import { PendingDestination } from "@/shared/components/ui/pending-destination";

function scheduledTitle(id: string) {
  return getLiveDemo(id, true).title;
}

/* 모바일에서도 보이는 칸 수. 캐러셀의 나머지 칸과 목록의 나머지 행은 1200px 이상에서만 보인다.
   실제 LIVE는 두 화면에 모두 보이는 칸의 끝에 넣는다. */
const mobileCarouselCards = 4;
const mobileListItems = 5;

/* 실제 LIVE 썸네일은 없을 수 있다. 그때는 카드의 중립 배경만 남긴다. 외부 주소는 최적화 없이 그대로 쓴다. */
function Thumbnail({ src, sizes }: { src?: string | null; sizes: string }) {
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
      unoptimized={/^https?:\/\//.test(src)}
    />
  );
}

function LiveAsset({
  name,
  className = "size-4",
}: {
  name: "alarm" | "viewers" | "bell-add" | "bell-subscribed" | "live-navigation";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(/images/buyer-live/${{ alarm: "a5c09.svg", viewers: "b19ca.svg", "bell-add": "14f62.svg", "bell-subscribed": "95476.svg", "live-navigation": "3fa99.svg" }[name]})`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

function Seller({ data, ranking = false }: { data: LiveDemo; ranking?: boolean }) {
  return (
    <div
      className={
        ranking
          ? "text-body-s flex items-center gap-2 font-medium"
          : "text-label-m text-text-secondary"
      }
    >
      {ranking && (
        <Avatar size={28}>
          <Image src={data.avatar!} alt="" fill sizes="28px" className="object-cover" />
        </Avatar>
      )}
      <span>{data.seller}</span>
    </div>
  );
}

function StatusBadge({
  scheduled = false,
  live = false,
  ranking = false,
  viewers = "101",
}: {
  scheduled?: boolean;
  live?: boolean;
  ranking?: boolean;
  /** 시청자 수 표시. 목업은 Figma 예시 값이다. */
  viewers?: string;
}) {
  return (
    <Badge
      shape="rounded"
      variant="neutral"
      className={live ? styles.liveBadge : ranking ? styles.rankingBadge : styles.viewerBadge}
    >
      <LiveAsset name={scheduled ? "alarm" : live ? "live-navigation" : "viewers"} />
      <span>{scheduled ? "예정됨" : live ? "LIVE" : viewers}</span>
    </Badge>
  );
}

/* pending을 주면 전체보기를 비활성으로 남긴다. 목적지가 정해진 섹션은
   viewAllHref로 실제 이동 링크를 전달한다. */
function Section({
  title,
  pending = false,
  viewAllHref,
  children,
  className = "",
}: {
  title: string;
  pending?: boolean;
  viewAllHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={`flex min-w-0 flex-col gap-3 min-[1200px]:mx-auto min-[1200px]:w-full min-[1200px]:max-w-300 min-[1200px]:gap-6 ${className}`}
    >
      <div className="flex h-7 items-center justify-between gap-2">
        <h2 className="text-title-m text-text-title min-[1200px]:text-heading-l">{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className={textButtonNavigationClasses}>
            전체보기
          </Link>
        ) : pending ? (
          <PendingDestination label={title + " 전체보기"} className={textButtonNavigationClasses}>
            전체보기
          </PendingDestination>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** 카드 한 장의 표시 값. 목업(getLiveDemo)과 실제 LIVE가 같은 카드 모양을 쓴다. */
type CardView = {
  href: string;
  title: string;
  image?: string | null;
  badge: "viewers" | "scheduled" | "live";
  /** `viewers` 뱃지의 수. 없으면 목업 예시 값이다. */
  viewers?: string;
  /** 실제 LIVE는 판매자·추천 사유가 BE에 없어 비운다. */
  seller?: LiveDemo;
  reasons?: string[];
};

function LiveCardView({
  card,
  compact = false,
  desktopOnly = false,
}: {
  card: CardView;
  compact?: boolean;
  desktopOnly?: boolean;
}) {
  return (
    <article
      className={`${compact ? "w-41 min-w-0 shrink-0 min-[1200px]:w-[226px]" : "min-w-0"} ${desktopOnly ? "hidden min-[1200px]:block" : ""}`}
    >
      <Link
        href={card.href}
        className="flex flex-col gap-2"
        aria-label={card.title + " 라이브 보기"}
      >
        <div
          className={
            "bg-layer-bg relative overflow-hidden rounded-xs " +
            (compact ? "aspect-square" : "aspect-[3/4]")
          }
        >
          <Thumbnail
            src={card.image}
            sizes="(min-width: 1200px) 226px, (max-width: 390px) 44vw, 169px"
          />
          <span className="absolute top-1 right-2">
            <StatusBadge
              scheduled={card.badge === "scheduled"}
              live={card.badge === "live"}
              viewers={card.viewers}
            />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-body-s min-[1200px]:text-body-m line-clamp-2 leading-[1.42] font-medium">
            {card.title}
          </h3>
          {card.seller && <Seller data={card.seller} />}
        </div>
        {card.reasons && (
          <div className="flex flex-wrap gap-2">
            {card.reasons.map((reason) => (
              <Badge variant="neutral" key={reason} className={styles.reasonBadge}>
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </Link>
    </article>
  );
}

function LiveCard({
  id,
  compact = false,
  desktopOnly = false,
}: {
  id: string;
  compact?: boolean;
  desktopOnly?: boolean;
}) {
  const data = getLiveDemo(id);
  return (
    <LiveCardView
      compact={compact}
      desktopOnly={desktopOnly}
      card={{
        href: "/live/" + id,
        title: data.title,
        image: data.image,
        badge: data.scheduled ? "scheduled" : id.startsWith("follow-") ? "live" : "viewers",
        seller: data,
        reasons: data.reasons,
      }}
    />
  );
}

/* 방송 중이면 시청자 수를 목업 카드와 같은 뱃지로 보인다. 수는 실시간 순위 조회에서만 와서(withViewerCounts)
   모르면 숫자 대신 LIVE로 표시한다. */
function RealLiveCard({ live, compact = false }: { live: LiveSummaryResponse; compact?: boolean }) {
  return (
    <LiveCardView
      compact={compact}
      card={{
        href: realLiveHref(live),
        title: realLiveTitle(live),
        image: live.thumbnailUrl,
        badge:
          live.status === "SCHEDULED"
            ? "scheduled"
            : live.viewerCount === undefined
              ? "live"
              : "viewers",
        viewers: live.viewerCount?.toLocaleString("ko-KR"),
      }}
    />
  );
}

/** 예정 카드 딤의 이미지·날짜·시간. */
type ScheduleView = { image?: string | null; date: string; time: string };

/* 목업 예정 카드는 Figma 원문의 날짜·시간을 그대로 쓴다(docs/BUYER_LIVE_MAIN.md). */
const demoSchedule = (id: string): ScheduleView => ({
  image: getLiveDemo(id, true).image,
  date: "09.18",
  time: "오후 3:40",
});

const realSchedule = (live: LiveSummaryResponse): ScheduleView => ({
  image: live.thumbnailUrl,
  ...scheduleLabel(live.scheduledStartAt),
});

function ScheduleMedia({
  schedule,
  className = "",
  large = false,
}: {
  schedule: ScheduleView;
  className?: string;
  large?: boolean;
}) {
  return (
    <div
      className={
        "bg-layer-bg text-text-static-white relative flex flex-col items-center justify-center overflow-hidden rounded-xs text-center " +
        (large ? "gap-2 " : "gap-1 ") +
        className
      }
    >
      <Thumbnail
        src={schedule.image}
        sizes="(min-width: 1200px) 226px, (max-width: 390px) 44vw, 169px"
      />
      <span className="bg-layer-overlay absolute inset-0" />
      <span
        className={"relative font-bold " + (large ? "text-[24px] leading-[1.35]" : "text-title-m")}
      >
        {schedule.date}
      </span>
      <span className={"relative font-medium " + (large ? "text-body-m" : "text-body-s")}>
        {schedule.time}
      </span>
    </div>
  );
}

/** 실시간 순위 한 행의 표시 값. 실제 LIVE는 카테고리·달성률·판매자가 BE에 없어 비운다. */
type RankingView = {
  href: string;
  title: string;
  image?: string | null;
  /** 없으면 시청자 뱃지를 그리지 않는다. */
  viewers?: string;
  category?: string;
  achievement?: ReactNode;
  seller?: LiveDemo;
};

function RankingCard({ rank, card }: { rank: number; card: RankingView }) {
  return (
    <Link href={card.href} className="flex gap-3">
      <div className="bg-layer-bg relative aspect-[3/4] w-[150px] max-w-[44%] shrink-0 overflow-hidden rounded-xs px-2 py-1 min-[1200px]:w-[186px]">
        <Thumbnail src={card.image} sizes="150px" />
        <div className="relative flex items-start justify-between gap-1">
          <span
            aria-label={`${rank}위`}
            className="text-text-static-white text-[28px] leading-[1.3] font-bold [text-shadow:1px_2px_8px_rgba(0,0,0,0.3)]"
          >
            {rank}
          </span>
          {card.viewers !== undefined && <StatusBadge ranking viewers={card.viewers} />}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between py-2">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            {card.category && (
              <span className="text-label-m text-text-secondary">{card.category}</span>
            )}
            <h3 className="min-[1200px]:text-title-m line-clamp-3 text-[16px] leading-6 font-semibold">
              {card.title}
            </h3>
          </div>
          {card.achievement}
        </div>
        {card.seller && <Seller ranking data={card.seller} />}
      </div>
    </Link>
  );
}

function demoRanking(rank: number): RankingView {
  const data = getLiveDemo(`rank-${rank}`);
  return {
    href: `/live/rank-${rank}`,
    title: data.title,
    image: data.image,
    viewers: "101",
    category: data.category,
    achievement: (
      <span className="text-title-s text-text-primary-live">
        <span className="min-[1200px]:hidden">10,000</span>
        <span className="hidden min-[1200px]:inline">
          {[16000, 120000, 11000, 10900, 9000, 9700, 8080, 8000, 17000, 10000][
            rank - 1
          ].toLocaleString("ko-KR")}
        </span>
        % 달성
      </span>
    ),
    seller: data,
  };
}

const realRanking = (live: LiveSummaryResponse): RankingView => ({
  href: realLiveHref(live),
  title: realLiveTitle(live),
  image: live.thumbnailUrl,
  viewers: live.viewerCount?.toLocaleString("ko-KR"),
});

/** 예정 카드 한 장의 표시 값. `id`는 알림 버튼 상태의 키다. */
type ScheduledView = {
  id: string;
  href: string;
  title: string;
  schedule: ScheduleView;
  /** 실제 LIVE는 카테고리·판매자·알림 신청 수가 BE에 없어 비운다. */
  category?: string;
  seller?: LiveDemo;
  /** 목업만 알림 신청 수(Figma 예시 값)를 보인다. */
  showNotificationCount: boolean;
};

function demoScheduled(id: string): ScheduledView {
  const data = getLiveDemo(id, true);
  return {
    id,
    href: getUpcomingProjectHref(id),
    title: data.title,
    schedule: demoSchedule(id),
    category: data.category,
    seller: data,
    showNotificationCount: true,
  };
}

const realScheduled = (live: LiveSummaryResponse): ScheduledView => ({
  id: live.liveId,
  href: realLiveHref(live),
  title: realLiveTitle(live),
  schedule: realSchedule(live),
  showNotificationCount: false,
});

export function BuyerLiveMain({
  hasFollowing = true,
  view = "live",
  real = noRealLives,
}: {
  hasFollowing?: boolean;
  view?: "live" | "upcoming";
  /** 섹션별로 섞을 실제 LIVE(#345). 없으면 전부 목업이다. Storybook은 넘기지 않는다. */
  real?: RealLives;
}) {
  const upcoming = view === "upcoming";
  const [notifications, setNotifications] = useState<ReadonlySet<string>>(
    () => new Set(subscribedIds),
  );
  /* 알림 신청 목록은 목업 카드로만 그린다. 실제 LIVE의 알림 버튼도 같은 목업 상태를 켜고 끄지만
     실제 알림 API가 없어(IA 알림함 제외) 이 목록에는 넣지 않는다. */
  const subscriptionIds = Array.from(notifications).filter(
    (id) => getLiveDemoConnection(id, true) !== undefined,
  );
  const newOpenSlots = fillRealSlots(mobileCarouselCards, real.newOpen);
  const rankingSlots = fillRealSlots(mobileListItems, real.ranking);
  /* 실시간 탭의 팔로우 4칸은 모두 보이고, 예정 탭은 캐러셀의 앞 4칸이 모바일에 보인다. */
  const followingSlots = fillRealSlots(mobileCarouselCards, real.following);
  const scheduledSlots = fillRealSlots(mobileListItems, real.scheduled);
  const [announcement, setAnnouncement] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const carouselDrag = useHorizontalDrag();
  const followingDrag = useHorizontalDrag();
  const sentinel = useRef<HTMLDivElement>(null);
  const recommendationList = useRef<HTMLDivElement>(null);
  const subscriptionList = useRef<HTMLDivElement>(null);
  const emptySubscriptions = useRef<HTMLParagraphElement>(null);
  const subscriptionFocusIndex = useRef<number | null>(null);
  const recommendationFocusIndex = useRef<number | null>(null);
  const hasMore = visibleCount < 30;
  useEffect(() => {
    const index = subscriptionFocusIndex.current;
    if (index === null) return;
    subscriptionFocusIndex.current = null;
    const buttons = subscriptionList.current?.querySelectorAll<HTMLButtonElement>("button");
    if (buttons?.length) buttons[Math.min(index, buttons.length - 1)].focus();
    else emptySubscriptions.current?.focus();
  }, [notifications]);
  useEffect(() => {
    const index = recommendationFocusIndex.current;
    if (index === null) return;
    recommendationFocusIndex.current = null;
    recommendationList.current?.querySelectorAll<HTMLAnchorElement>("article a")[index]?.focus();
  }, [visibleCount]);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !target.contains(document.activeElement)) {
        observer.disconnect();
        setVisibleCount((count) => Math.min(count + 10, 30));
        setAnnouncement(
          `추천 라이브 ${Math.min(visibleCount + 10, 30)}개를 표시합니다.${visibleCount >= 20 ? " 마지막 목록입니다." : ""}`,
        );
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  function toggleNotification(id: string) {
    const enabled = !notifications.has(id);
    setNotifications((previous) => {
      const next = new Set(previous);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
    setAnnouncement(enabled ? "시작 알림을 설정했습니다." : "시작 알림을 해제했습니다.");
  }

  function notificationButton(
    id: string,
    title: string,
    variant: "card" | "round" | "subscription" = "card",
  ) {
    const enabled = notifications.has(id);
    return (
      <Button
        size="md"
        shape={variant === "card" ? "default" : "pill"}
        variant={enabled ? "primary" : "secondary"}
        aria-label={`${title} ${variant === "card" ? (enabled ? "알림 설정됨" : "알림 받기") : "시작 알림"}`}
        aria-pressed={enabled}
        onClick={() => {
          if (variant === "subscription")
            subscriptionFocusIndex.current = subscriptionIds.indexOf(id);
          toggleNotification(id);
        }}
        className={
          variant === "card" ? "text-body-s! w-full gap-1 font-medium" : "size-8! shrink-0 p-0!"
        }
      >
        {variant === "card" && (enabled ? "알림 설정됨" : "알림받기")}
        <LiveAsset name={enabled ? "bell-subscribed" : "bell-add"} />
      </Button>
    );
  }

  function notificationCount(id: string) {
    const base = id.startsWith("subscribed-")
      ? 119999
      : id.startsWith("scheduled-")
        ? 100000
        : 1000000;
    return (base + Number(notifications.has(id))).toLocaleString("ko-KR");
  }

  function scheduledCard(card: ScheduledView, compact = false, desktopOnly = false) {
    return (
      <article
        key={card.id}
        className={`flex min-w-0 flex-col gap-2 ${compact ? "w-[153px] shrink-0 min-[1200px]:w-[226px]" : ""} ${desktopOnly ? "hidden min-[1200px]:flex" : ""}`}
      >
        <Link href={card.href} className="flex flex-col gap-2">
          <ScheduleMedia
            schedule={card.schedule}
            className={compact ? "aspect-square" : "aspect-square min-[1200px]:aspect-[3/4]"}
          />
          <div className="flex flex-col gap-1">
            {compact && card.seller && <Seller data={card.seller} />}
            <h3 className="text-body-s min-[1200px]:text-body-m line-clamp-2 leading-[1.42] font-medium">
              {card.title}
            </h3>
          </div>
        </Link>
        {!compact && card.seller && <Seller data={card.seller} />}
        {/* 실제 LIVE는 판매자 줄이 없어 버튼을 카드 아래에 붙여 옆 카드와 줄을 맞춘다.
            목업 카드는 contents라 배치가 그대로다. */}
        <div className={card.seller ? "contents" : "mt-auto"}>
          {notificationButton(card.id, card.title)}
        </div>
      </article>
    );
  }

  function scheduledRow(rank: number, card: ScheduledView) {
    return (
      <article className="flex gap-3">
        <Link
          href={card.href}
          aria-label={`${rank}번째 예정 라이브 보기`}
          className="w-[150px] max-w-[44%] shrink-0 min-[1200px]:w-[186px]"
        >
          <ScheduleMedia schedule={card.schedule} className="aspect-[3/4]" large />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <Link href={card.href} className="flex flex-col gap-1">
            {card.category && (
              <span className="text-label-m text-text-secondary">{card.category}</span>
            )}
            <h3 className="min-[1200px]:text-title-m line-clamp-3 text-[16px] leading-6 font-semibold">
              {card.title}
            </h3>
            {card.seller && (
              <span className="text-label-m text-text-secondary mt-1">{card.seller.seller}</span>
            )}
          </Link>
          <div className="flex items-center justify-end gap-2">
            {card.showNotificationCount && (
              <p className="text-body-s text-text-primary-live min-w-0 flex-1 truncate font-semibold">
                {(100000 + Number(notifications.has(card.id))).toLocaleString("ko-KR")}명 알림 신청
              </p>
            )}
            {notificationButton(card.id, card.title, "round")}
          </div>
        </div>
      </article>
    );
  }

  return (
    <div
      className={`${styles.screen} bg-layer-surface-default text-text-default mx-auto min-h-screen w-full pb-[calc(54px+env(safe-area-inset-bottom))] min-[1200px]:pb-0`}
    >
      <BuyerDesktopHeader />
      <div className="min-[1200px]:mx-auto min-[1200px]:flex min-[1200px]:h-[138px] min-[1200px]:max-w-300 min-[1200px]:items-center min-[1200px]:justify-center min-[1200px]:gap-10">
        <header className="flex items-center gap-4 py-2 pr-3 pl-5 min-[1200px]:order-2 min-[1200px]:w-[614px] min-[1200px]:p-0">
          <form action="/live/search" role="search" className="min-w-0 flex-1">
            <SearchField name="q" aria-label="라이브 검색" placeholder="검색어를 입력해주세요" />
          </form>
          <PendingDestination
            label="알림함"
            className="flex size-10 shrink-0 items-center justify-center min-[1200px]:hidden"
          >
            <Icon name="bell" className="size-6" />
          </PendingDestination>
        </header>
        <TabList mode="nav" aria-label="라이브 탐색" className="w-full min-[1200px]:w-[390px]">
          <Tab
            href="/live"
            selected={!upcoming}
            variant="primaryLive"
            className="text-body-m w-1/2!"
          >
            실시간
          </Tab>
          <Tab
            href="/live/upcoming"
            selected={upcoming}
            variant="primaryLive"
            className="text-body-m w-1/2!"
          >
            예정 LIVE
          </Tab>
        </TabList>
      </div>
      <main className="bg-layer-bg min-[1200px]:bg-layer-surface-default flex flex-col gap-3 min-[1200px]:gap-16 min-[1200px]:px-5 min-[1200px]:pt-12 min-[1200px]:pb-16">
        <div className="bg-layer-surface-default flex flex-col gap-10 px-5 pt-4 min-[1200px]:contents">
          <h1 className="sr-only">{upcoming ? "예정 라이브" : "라이브 메인"}</h1>
          {(!upcoming || hasFollowing) && (
            <Section
              className={upcoming ? "min-[1200px]:order-3" : "min-[1200px]:order-1"}
              title={upcoming ? "팔로우한 창작자" : "신규 오픈"}
              pending
            >
              <div
                role="region"
                aria-label={upcoming ? "팔로우한 창작자 예정 라이브 목록" : "신규 오픈 라이브 목록"}
                tabIndex={0}
                className={`${styles.carousel} flex overflow-x-auto ${upcoming ? "gap-4" : "gap-3"}`}
                {...carouselDrag}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const live = upcoming ? followingSlots[n - 1] : newOpenSlots[n - 1];
                  if (upcoming)
                    return scheduledCard(
                      live ? realScheduled(live) : demoScheduled(`follow-${n}`),
                      true,
                      n > mobileCarouselCards,
                    );
                  return live ? (
                    <RealLiveCard key={live.liveId} live={live} compact />
                  ) : (
                    <LiveCard
                      key={n}
                      id={`new-${n}`}
                      compact
                      desktopOnly={n > mobileCarouselCards}
                    />
                  );
                })}
              </div>
            </Section>
          )}
          <Section
            className="min-[1200px]:order-2"
            title={upcoming ? "9/8일 (화) 예정된 라이브" : "실시간 순위"}
          >
            <ol className="flex flex-col gap-4 min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-x-24">
              {Array.from({ length: upcoming ? 8 : 10 }, (_, i) => i + 1).map((rank) => {
                const live = (upcoming ? scheduledSlots : rankingSlots)[rank - 1];
                return (
                  <li
                    key={rank}
                    className={rank > mobileListItems ? "hidden min-[1200px]:block" : ""}
                  >
                    {upcoming ? (
                      scheduledRow(
                        rank,
                        live ? realScheduled(live) : demoScheduled(`scheduled-${rank}`),
                      )
                    ) : (
                      <RankingCard
                        rank={rank}
                        card={live ? realRanking(live) : demoRanking(rank)}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
            {upcoming ? (
              <PendingDestination
                label="예정된 라이브 전체보기"
                className={textButtonNavigationClasses + " mx-auto"}
              >
                더 보러 가기
              </PendingDestination>
            ) : (
              <PendingDestination
                label="실시간 순위 전체보기"
                className={textButtonNavigationClasses + " mx-auto"}
              >
                더 보러 가기
              </PendingDestination>
            )}
          </Section>
        </div>
        <div className="bg-layer-surface-default flex flex-col gap-10 px-5 pt-4 pb-10 min-[1200px]:contents">
          {!upcoming && hasFollowing && (
            <Section
              className="min-[1200px]:order-3"
              title="팔로우한 창작자"
              viewAllHref="/my/wishlist?tab=sellers"
            >
              <div
                {...followingDrag}
                tabIndex={0}
                role="region"
                aria-label="팔로우한 창작자 라이브 목록"
                className={`${styles.carousel} grid grid-cols-2 gap-3 min-[1200px]:flex min-[1200px]:overflow-x-auto min-[1200px]:[&>article]:w-[226px] min-[1200px]:[&>article]:shrink-0`}
              >
                {[1, 2, 3, 4].map((n) => {
                  const live = followingSlots[n - 1];
                  return live ? (
                    <RealLiveCard key={live.liveId} live={live} />
                  ) : (
                    <LiveCard key={n} id={`follow-${n}`} />
                  );
                })}
              </div>
            </Section>
          )}
          {upcoming && (
            <Section className="min-[1200px]:order-4" title="알림 신청한 라이브" pending>
              <div
                ref={subscriptionList}
                className="flex flex-col gap-3 min-[1200px]:grid min-[1200px]:grid-cols-3 min-[1200px]:gap-6"
              >
                {subscriptionIds.map((id) => (
                  <article key={id} className="flex gap-3">
                    <Link
                      href={getUpcomingProjectHref(id)}
                      aria-label={`${scheduledTitle(id)} 라이브 보기`}
                      className="w-[104px] shrink-0"
                    >
                      <ScheduleMedia schedule={demoSchedule(id)} className="h-full min-h-[104px]" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                      <Link href={getUpcomingProjectHref(id)} className="flex flex-col gap-1">
                        <Seller data={getLiveDemo(id, true)} />
                        <h3 className="text-body-s min-[1200px]:text-body-m line-clamp-2 leading-[1.42] font-medium">
                          {scheduledTitle(id)}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1">
                        <p className="text-text-primary-live min-w-0 flex-1 truncate text-[16px] leading-6 font-semibold">
                          {notificationCount(id)}명 알림 신청
                        </p>
                        {notificationButton(id, scheduledTitle(id), "subscription")}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {subscriptionIds.length === 0 && (
                <p ref={emptySubscriptions} tabIndex={-1} className="text-body-s">
                  알림 신청한 라이브가 없습니다.
                </p>
              )}
            </Section>
          )}
          <Section className="min-[1200px]:order-5" title="추천 라이브">
            <div
              ref={recommendationList}
              className="grid grid-cols-2 gap-x-3 gap-y-4 min-[1200px]:grid-cols-5 min-[1200px]:gap-x-4 min-[1200px]:gap-y-6"
            >
              {Array.from({ length: visibleCount }, (_, i) =>
                upcoming ? (
                  scheduledCard(demoScheduled(`recommended-${i + 1}`))
                ) : (
                  <LiveCard key={i} id={`recommended-${i + 1}`} />
                ),
              )}
            </div>
            {hasMore && (
              <div ref={sentinel} className="-mt-3">
                <button
                  type="button"
                  className="sr-only focus:not-sr-only"
                  onClick={() => {
                    recommendationFocusIndex.current = visibleCount;
                    setVisibleCount((count) => Math.min(count + 10, 30));
                    setAnnouncement(
                      `추천 라이브 ${Math.min(visibleCount + 10, 30)}개를 표시합니다.${visibleCount >= 20 ? " 마지막 목록입니다." : ""}`,
                    );
                  }}
                >
                  추천 라이브 더 불러오기
                </button>
              </div>
            )}
          </Section>
        </div>
      </main>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <BuyerBottomNavigation
        activeHref="/live"
        aria-label="LIVE 화면 하단 메뉴"
        flat
        className="fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 min-[1200px]:hidden"
      />
    </div>
  );
}
