"use client";

import Image from "next/image";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import Link from "next/link";
import { Avatar } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { textButtonNavigationClasses } from "@/shared/components/ui/text-button";
import { Button } from "@/shared/components/ui/button";
import {
  getLiveDemo,
  getUpcomingProjectHref,
  subscribedIds,
  type LiveDemo,
} from "../model/live-demo";
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
}: {
  scheduled?: boolean;
  live?: boolean;
  ranking?: boolean;
}) {
  return (
    <Badge
      shape="rounded"
      variant="neutral"
      className={live ? styles.liveBadge : ranking ? styles.rankingBadge : styles.viewerBadge}
    >
      <LiveAsset name={scheduled ? "alarm" : live ? "live-navigation" : "viewers"} />
      <span>{scheduled ? "예정됨" : live ? "LIVE" : "101"}</span>
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
    <article
      className={`${compact ? "w-41 min-w-0 shrink-0 min-[1200px]:w-[226px]" : "min-w-0"} ${desktopOnly ? "hidden min-[1200px]:block" : ""}`}
    >
      <Link
        href={"/live/" + id}
        className="flex flex-col gap-2"
        aria-label={data.title + " 라이브 보기"}
      >
        <div
          className={
            "bg-layer-bg relative overflow-hidden rounded-xs " +
            (compact ? "aspect-square" : "aspect-[3/4]")
          }
        >
          <Image
            src={data.image}
            alt=""
            fill
            sizes="(min-width: 1200px) 226px, (max-width: 390px) 44vw, 169px"
            className="object-cover"
          />
          <span className="absolute top-1 right-2">
            <StatusBadge scheduled={data.scheduled} live={id.startsWith("follow-")} />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-body-s min-[1200px]:text-body-m line-clamp-2 leading-[1.42] font-medium">
            {data.title}
          </h3>
          <Seller data={data} />
        </div>
        {data.reasons && (
          <div className="flex flex-wrap gap-2">
            {data.reasons.map((reason) => (
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

function ScheduleMedia({
  id,
  className = "",
  large = false,
}: {
  id: string;
  className?: string;
  large?: boolean;
}) {
  const data = getLiveDemo(id, true);
  return (
    <div
      className={
        "bg-layer-bg text-text-static-white relative flex flex-col items-center justify-center overflow-hidden rounded-xs text-center " +
        (large ? "gap-2 " : "gap-1 ") +
        className
      }
    >
      <Image
        src={data.image}
        alt=""
        fill
        sizes="(min-width: 1200px) 226px, (max-width: 390px) 44vw, 169px"
        className="object-cover"
      />
      <span className="bg-layer-overlay absolute inset-0" />
      <span
        className={"relative font-bold " + (large ? "text-[24px] leading-[1.35]" : "text-title-m")}
      >
        09.18
      </span>
      <span className={"relative font-medium " + (large ? "text-body-m" : "text-body-s")}>
        오후 3:40
      </span>
    </div>
  );
}

export function BuyerLiveMain({
  hasFollowing = true,
  view = "live",
}: {
  hasFollowing?: boolean;
  view?: "live" | "upcoming";
}) {
  const upcoming = view === "upcoming";
  const [notifications, setNotifications] = useState<ReadonlySet<string>>(
    () => new Set(subscribedIds),
  );
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

  function notificationButton(id: string, variant: "card" | "round" | "subscription" = "card") {
    const enabled = notifications.has(id);
    return (
      <Button
        size="md"
        shape={variant === "card" ? "default" : "pill"}
        variant={enabled ? "primary" : "secondary"}
        aria-label={`${scheduledTitle(id)} ${variant === "card" ? (enabled ? "알림 설정됨" : "알림 받기") : "시작 알림"}`}
        aria-pressed={enabled}
        onClick={() => {
          if (variant === "subscription")
            subscriptionFocusIndex.current = Array.from(notifications).indexOf(id);
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

  function scheduledCard(id: string, compact = false, desktopOnly = false) {
    const data = getLiveDemo(id, true);
    return (
      <article
        key={id}
        className={`flex min-w-0 flex-col gap-2 ${compact ? "w-[153px] shrink-0 min-[1200px]:w-[226px]" : ""} ${desktopOnly ? "hidden min-[1200px]:flex" : ""}`}
      >
        <Link href={getUpcomingProjectHref(id)} className="flex flex-col gap-2">
          <ScheduleMedia
            id={id}
            className={compact ? "aspect-square" : "aspect-square min-[1200px]:aspect-[3/4]"}
          />
          <div className="flex flex-col gap-1">
            {compact && <Seller data={data} />}
            <h3 className="text-body-s min-[1200px]:text-body-m line-clamp-2 leading-[1.42] font-medium">
              {data.title}
            </h3>
          </div>
        </Link>
        {!compact && <Seller data={data} />}
        {notificationButton(id)}
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
              title={upcoming ? "팔로우한 판매자" : "신규 오픈"}
              pending
            >
              <div
                role="region"
                aria-label={upcoming ? "팔로우한 판매자 예정 라이브 목록" : "신규 오픈 라이브 목록"}
                tabIndex={0}
                className={`${styles.carousel} flex overflow-x-auto ${upcoming ? "gap-4" : "gap-3"}`}
                {...carouselDrag}
              >
                {[1, 2, 3, 4, 5, 6].map((n) =>
                  upcoming ? (
                    scheduledCard(`follow-${n}`, true, n > 4)
                  ) : (
                    <LiveCard key={n} id={`new-${n}`} compact desktopOnly={n > 4} />
                  ),
                )}
              </div>
            </Section>
          )}
          <Section
            className="min-[1200px]:order-2"
            title={upcoming ? "9/8일 (화) 예정된 라이브" : "실시간 순위"}
          >
            <ol className="flex flex-col gap-4 min-[1200px]:grid min-[1200px]:grid-cols-2 min-[1200px]:gap-x-24">
              {Array.from({ length: upcoming ? 8 : 10 }, (_, i) => i + 1).map((rank) => (
                <li key={rank} className={rank > 5 ? "hidden min-[1200px]:block" : ""}>
                  {upcoming ? (
                    <article className="flex gap-3">
                      <Link
                        href={getUpcomingProjectHref(`scheduled-${rank}`)}
                        aria-label={`${rank}번째 예정 라이브 보기`}
                        className="w-[150px] max-w-[44%] shrink-0 min-[1200px]:w-[186px]"
                      >
                        <ScheduleMedia id={`scheduled-${rank}`} className="aspect-[3/4]" large />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <Link
                          href={getUpcomingProjectHref(`scheduled-${rank}`)}
                          className="flex flex-col gap-1"
                        >
                          <span className="text-label-m text-text-secondary">
                            {getLiveDemo(`scheduled-${rank}`).category}
                          </span>
                          <h3 className="min-[1200px]:text-title-m line-clamp-3 text-[16px] leading-6 font-semibold">
                            {getLiveDemo(`scheduled-${rank}`).title}
                          </h3>
                          <span className="text-label-m text-text-secondary mt-1">
                            {getLiveDemo(`scheduled-${rank}`).seller}
                          </span>
                        </Link>
                        <div className="flex items-center gap-2">
                          <p className="text-body-s text-text-primary-live min-w-0 flex-1 truncate font-semibold">
                            {(
                              100000 + Number(notifications.has(`scheduled-${rank}`))
                            ).toLocaleString("ko-KR")}
                            명 알림 신청
                          </p>
                          {notificationButton(`scheduled-${rank}`, "round")}
                        </div>
                      </div>
                    </article>
                  ) : (
                    <Link href={`/live/rank-${rank}`} className="flex gap-3">
                      <div className="bg-layer-bg relative aspect-[3/4] w-[150px] max-w-[44%] shrink-0 overflow-hidden rounded-xs px-2 py-1 min-[1200px]:w-[186px]">
                        <Image
                          src={getLiveDemo(`rank-${rank}`).image}
                          alt=""
                          fill
                          sizes="150px"
                          className="object-cover"
                        />
                        <div className="relative flex items-start justify-between gap-1">
                          <span
                            aria-label={`${rank}위`}
                            className="text-text-static-white text-[28px] leading-[1.3] font-bold [text-shadow:1px_2px_8px_rgba(0,0,0,0.3)]"
                          >
                            {rank}
                          </span>
                          <StatusBadge ranking />
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between py-2">
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-label-m text-text-secondary">
                              {getLiveDemo(`rank-${rank}`).category}
                            </span>
                            <h3 className="min-[1200px]:text-title-m line-clamp-3 text-[16px] leading-6 font-semibold">
                              {getLiveDemo(`rank-${rank}`).title}
                            </h3>
                          </div>
                          <span className="text-title-s text-text-primary-live">
                            <span className="min-[1200px]:hidden">10,000</span>
                            <span className="hidden min-[1200px]:inline">
                              {[16000, 120000, 11000, 10900, 9000, 9700, 8080, 8000, 17000, 10000][
                                rank - 1
                              ].toLocaleString("ko-KR")}
                            </span>
                            % 달성
                          </span>
                        </div>
                        <Seller ranking data={getLiveDemo(`rank-${rank}`)} />
                      </div>
                    </Link>
                  )}
                </li>
              ))}
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
              title="팔로우한 판매자"
              viewAllHref="/my/wishlist?tab=sellers"
            >
              <div
                {...followingDrag}
                tabIndex={0}
                role="region"
                aria-label="팔로우한 판매자 라이브 목록"
                className={`${styles.carousel} grid grid-cols-2 gap-3 min-[1200px]:flex min-[1200px]:overflow-x-auto min-[1200px]:[&>article]:w-[226px] min-[1200px]:[&>article]:shrink-0`}
              >
                {[1, 2, 3, 4].map((n) => (
                  <LiveCard key={n} id={`follow-${n}`} />
                ))}
              </div>
            </Section>
          )}
          {upcoming && (
            <Section className="min-[1200px]:order-4" title="알림 신청한 라이브" pending>
              <div
                ref={subscriptionList}
                className="flex flex-col gap-3 min-[1200px]:grid min-[1200px]:grid-cols-3 min-[1200px]:gap-6"
              >
                {Array.from(notifications).map((id) => (
                  <article key={id} className="flex gap-3">
                    <Link
                      href={getUpcomingProjectHref(id)}
                      aria-label={`${scheduledTitle(id)} 라이브 보기`}
                      className="w-[104px] shrink-0"
                    >
                      <ScheduleMedia id={id} className="h-full min-h-[104px]" />
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
                        {notificationButton(id, "subscription")}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {notifications.size === 0 && (
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
                  scheduledCard(`recommended-${i + 1}`)
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
