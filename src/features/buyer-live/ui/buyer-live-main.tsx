"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import styles from "./buyer-live-main.module.css";

const projectTitle = "프로젝트 제목 프로젝트 제목 프로젝트 제목 프로젝트 제목";
const rankingTitle =
  "로보락F25 정말 좋고 깔끔하고 착한 무선 청소기! 이것은 역작이라고 말할 수 있다";
const reasons = ["많이 본 카테고리", "좋아요한 브랜드", "시청 기반"];
const subscribedIds = Array.from({ length: 5 }, (_, i) => `subscribed-${i + 1}`);

function scheduledTitle(id: string) {
  return id.startsWith("follow-") || id.startsWith("recommended-") ? projectTitle : rankingTitle;
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
        maskImage: `url(/icons/buyer-live/${name}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

function Seller({
  ranking = false,
  following = false,
}: {
  ranking?: boolean;
  following?: boolean;
}) {
  return (
    <div
      className={
        ranking
          ? "flex items-center gap-2 text-[14px] leading-5 font-medium"
          : following
            ? "text-[13px] leading-[18px] font-medium"
            : "text-[12px] leading-4 font-medium"
      }
    >
      {ranking && <span aria-hidden className="bg-border-default size-7 shrink-0 rounded-full" />}
      <span>판매자 이름</span>
    </div>
  );
}

function StatusBadge({ scheduled = false, live = false }: { scheduled?: boolean; live?: boolean }) {
  return (
    <span
      className={`bg-border-default text-caption-strong inline-flex items-center ${scheduled || live ? "gap-1" : "gap-2"} rounded-xs px-2 py-1`}
    >
      <LiveAsset
        name={scheduled ? "alarm" : live ? "live-navigation" : "viewers"}
        className="size-3.5"
      />
      <span>{scheduled ? "예정됨" : live ? "LIVE" : "101"}</span>
    </span>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-title-m">{title}</h2>
        {href && (
          <Link href={href} className={styles.more} aria-label={`${title} 전체보기`}>
            전체보기
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function LiveCard({
  id,
  reason,
  compact = false,
  scheduled = false,
}: {
  id: string;
  reason?: string;
  compact?: boolean;
  scheduled?: boolean;
}) {
  return (
    <article className={`min-w-0 ${compact ? "w-41 shrink-0" : ""}`}>
      <Link
        href={`/live/${id}`}
        className="flex flex-col gap-2"
        aria-label={`${projectTitle} 라이브 보기`}
      >
        <div
          className={`bg-layer-surface-disabled relative rounded-xs ${compact ? "aspect-[164/163]" : "aspect-[169/170]"}`}
        >
          <span className="absolute top-2 right-2">
            <StatusBadge scheduled={scheduled} live={Boolean(reason)} />
          </span>
        </div>
        <div className={`flex flex-col ${reason ? "gap-1" : "gap-2"}`}>
          <h3 className={styles.cardTitle}>{projectTitle}</h3>
          <Seller />
        </div>
        {reason && (
          <span className="bg-layer-surface-disabled w-fit max-w-full truncate rounded-xs px-2 py-1 text-[11px] leading-[14px] font-medium">
            {reason}
          </span>
        )}
      </Link>
    </article>
  );
}

function ScheduleMedia({ className = "", large = false }: { className?: string; large?: boolean }) {
  return (
    <div
      className={`bg-layer-surface-disabled flex flex-col items-center justify-center ${large ? "gap-2" : "gap-1"} rounded-xs text-center ${className}`}
    >
      <span
        className={`${large ? "text-[24px] leading-[1.35]" : "text-[20px] leading-7"} font-bold`}
      >
        09.18
      </span>
      <span className={`${large ? "text-[16px] leading-6" : "text-[14px] leading-5"} font-medium`}>
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
  const [carouselScrolling, setCarouselScrolling] = useState(false);
  const carouselScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (carouselScrollTimer.current !== null) clearTimeout(carouselScrollTimer.current);
    },
    [],
  );
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
      <button
        type="button"
        aria-label={`${scheduledTitle(id)} ${variant === "card" ? (enabled ? "알림 설정됨" : "알림 받기") : "시작 알림"}`}
        aria-pressed={enabled}
        onClick={() => {
          if (variant === "subscription")
            subscriptionFocusIndex.current = Array.from(notifications).indexOf(id);
          toggleNotification(id);
        }}
        className={`${styles.notificationButton} flex shrink-0 items-center justify-center gap-2 border text-[14px] leading-5 font-medium ${variant === "card" ? `w-full rounded-xs ${id.startsWith("follow-") ? "border-[#ededed]" : "border-border-default"} p-2` : `border-border-default rounded-full ${variant === "subscription" ? "size-8" : "size-9"}`}`}
      >
        {variant === "card" && (enabled ? "알림 설정됨" : "알림 받기")}
        <LiveAsset name={enabled ? "bell-subscribed" : "bell-add"} />
      </button>
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

  function scheduledCard(id: string, compact = false) {
    return (
      <article
        key={id}
        className={`flex min-w-0 flex-col gap-2 ${compact ? "w-[153px] shrink-0" : ""}`}
      >
        <Link href={`/live/${id}`} className="flex flex-col gap-2">
          <ScheduleMedia className="aspect-square" />
          <div className="flex flex-col gap-1">
            {compact && <Seller following />}
            <h3 className={styles.cardTitle}>{projectTitle}</h3>
          </div>
        </Link>
        {!compact && (
          <p className="-mt-1 truncate text-[13px] leading-[18px] font-medium">
            {notificationCount(id)}명 알림 신청
          </p>
        )}
        {notificationButton(id)}
      </article>
    );
  }

  return (
    <div
      className={`${styles.screen} bg-layer-surface-default text-text-default mx-auto min-h-screen w-full max-w-[390px] pb-[calc(76px+env(safe-area-inset-bottom))]`}
    >
      <header className="flex items-center gap-4 px-5 py-2">
        <form action="/live/search" role="search" className="min-w-0 flex-1">
          <SearchField
            name="q"
            aria-label="라이브 검색"
            placeholder="place holder"
            className={styles.search}
          />
        </form>
        <Link
          href="/my/notifications"
          aria-label="알림함"
          className="flex h-10 w-6 shrink-0 items-center justify-center"
        >
          <Icon name="bell" className="h-3.5 w-6" />
        </Link>
      </header>
      <TabList mode="nav" aria-label="라이브 탐색" className={styles.tabs}>
        <Tab href="/live" selected={!upcoming} className={styles.tab}>
          실시간
        </Tab>
        <Tab href="/live/upcoming" selected={upcoming} className={styles.tab}>
          예정 라이브
        </Tab>
      </TabList>
      <main className="flex flex-col gap-10 px-5 pt-4 pb-10">
        <h1 className="sr-only">{upcoming ? "예정 라이브" : "라이브 메인"}</h1>
        {(!upcoming || hasFollowing) && (
          <Section
            title={upcoming ? "팔로우한 판매자" : "신규 오픈"}
            href={upcoming ? "/live/following" : "/live/new"}
          >
            <div
              role="region"
              aria-label={upcoming ? "팔로우한 판매자 예정 라이브 목록" : "신규 오픈 라이브 목록"}
              tabIndex={0}
              className={`${styles.carousel} flex overflow-x-auto ${upcoming ? "gap-4" : "gap-3"}`}
              data-scrolling={carouselScrolling}
              onScroll={() => {
                setCarouselScrolling(true);
                if (carouselScrollTimer.current !== null) clearTimeout(carouselScrollTimer.current);
                carouselScrollTimer.current = setTimeout(() => setCarouselScrolling(false), 700);
              }}
            >
              {[1, 2, 3, 4].map((n) =>
                upcoming ? (
                  scheduledCard(`follow-${n}`, true)
                ) : (
                  <LiveCard key={n} id={`new-${n}`} compact scheduled={n % 2 === 0} />
                ),
              )}
            </div>
          </Section>
        )}
        <Section title={upcoming ? "9/8일 (화) 예정된 라이브" : "실시간 순위"}>
          <ol className="flex flex-col gap-4">
            {[1, 2, 3, 4, 5].map((rank) => (
              <li key={rank}>
                {upcoming ? (
                  <article className="flex gap-3">
                    <Link
                      href={`/live/scheduled-${rank}`}
                      aria-label={`${rank}번째 예정 라이브 보기`}
                      className="w-[146px] max-w-[44%] shrink-0"
                    >
                      <ScheduleMedia className="h-[194px]" large />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <Link href={`/live/scheduled-${rank}`} className="flex flex-col gap-1">
                        <span className="py-1 text-[12px] leading-4 font-medium">테크·가전</span>
                        <h3 className="line-clamp-4 text-[16px] leading-6 font-semibold">
                          {rankingTitle}
                        </h3>
                        <span className="mt-1 text-[14px] leading-5">판매자 이름</span>
                      </Link>
                      <div className="flex items-center gap-2">
                        <p className="text-title-s min-w-0 flex-1 truncate">
                          {(100000 + Number(notifications.has(`scheduled-${rank}`))).toLocaleString(
                            "ko-KR",
                          )}
                          명 알림 신청
                        </p>
                        {notificationButton(`scheduled-${rank}`, "round")}
                      </div>
                    </div>
                  </article>
                ) : (
                  <Link href={`/live/rank-${rank}`} className="flex gap-3">
                    <div className="bg-layer-surface-disabled relative h-[194px] w-[146px] max-w-[44%] shrink-0 rounded-xs px-2 py-1">
                      <div className="flex items-start justify-between gap-1">
                        <span
                          aria-label={`${rank}위`}
                          className={`text-[24px] leading-8 ${rank <= 3 ? "font-bold" : "font-medium"}`}
                        >
                          {rank}
                        </span>
                        <StatusBadge />
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-2">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] leading-4 font-medium">테크·가전</span>
                          <h3 className="line-clamp-3 text-[16px] leading-6 font-semibold">
                            {rankingTitle}
                          </h3>
                        </div>
                        <span className="text-title-s">10,000% 달성</span>
                      </div>
                      <Seller ranking />
                    </div>
                  </Link>
                )}
              </li>
            ))}
          </ol>
          {upcoming ? (
            <button
              type="button"
              disabled
              aria-label="예정된 라이브 전체보기 · 화면 미정"
              className="text-body-emphasis mx-auto cursor-not-allowed px-3 py-2"
            >
              전체보기
            </button>
          ) : (
            <Link
              href="/live/rank"
              aria-label="실시간 순위 전체보기"
              className="text-body-emphasis mx-auto px-3 py-2"
            >
              전체보기
            </Link>
          )}
        </Section>
        {!upcoming && hasFollowing && (
          <Section title="팔로우한 판매자" href="/live/following">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((n) => (
                <LiveCard key={n} id={`follow-${n}`} />
              ))}
            </div>
          </Section>
        )}
        {upcoming && (
          <Section title="알림 신청한 라이브" href="/my/notifications">
            <div ref={subscriptionList} className="flex flex-col gap-3">
              {Array.from(notifications).map((id) => (
                <article key={id} className="flex gap-3">
                  <Link
                    href={`/live/${id}`}
                    aria-label={`${scheduledTitle(id)} 라이브 보기`}
                    className="w-[104px] shrink-0"
                  >
                    <ScheduleMedia className="h-full min-h-[104px]" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
                    <Link href={`/live/${id}`} className="flex flex-col gap-1">
                      <Seller />
                      <h3 className={styles.cardTitle}>{scheduledTitle(id)}</h3>
                    </Link>
                    <div className="flex items-center gap-1">
                      <p className="min-w-0 flex-1 truncate text-[16px] leading-6 font-semibold">
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
        <Section title="추천 라이브">
          <div
            ref={recommendationList}
            className={`grid gap-3 ${upcoming ? "grid-cols-[repeat(2,minmax(0,168px))]" : "grid-cols-2"}`}
          >
            {Array.from({ length: visibleCount }, (_, i) =>
              upcoming ? (
                scheduledCard(`recommended-${i + 1}`)
              ) : (
                <LiveCard
                  key={i}
                  id={`recommended-${i + 1}`}
                  reason={reasons[i % reasons.length]}
                />
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
      </main>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <BuyerBottomNavigation
        activeHref="/live"
        aria-label="LIVE 화면 하단 메뉴"
        className="fixed bottom-0 left-1/2 z-20 w-full max-w-[390px] -translate-x-1/2"
      />
    </div>
  );
}
