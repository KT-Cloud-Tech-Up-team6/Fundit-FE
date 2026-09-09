"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import { SearchField } from "@/shared/components/ui/search-field";
import { Tab, TabList } from "@/shared/components/ui/tab";
import styles from "./buyer-live-main.module.css";

const projectTitle = "프로젝트 명 프로젝트 명 프로젝트 명 프로젝트 명 프로젝트 명";
const rankingTitle =
  "로보락F25 정말 좋고 깔끔하고 착한 로봇 청소기! 이것은 역작이라고 말할 수 있다";
const reasons = ["많이 본 카테고리", "좋아요한 브랜드", "시청 기반"];

function LiveAsset({
  name,
  className = "size-5",
}: {
  name: "home" | "categories" | "live-navigation" | "alarm" | "bell-add" | "bell-selected";
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

function Seller({ ranking = false }: { ranking?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 ${ranking ? styles.rankingSeller : "text-caption-strong"}`}
    >
      <span aria-hidden className="bg-border-default size-5 shrink-0 rounded-full" />
      <span>판매자 이름</span>
    </div>
  );
}

function StatusBadge({ scheduled = false }: { scheduled?: boolean }) {
  return (
    <span
      className={`${styles.statusBadge} text-caption-strong inline-flex items-center gap-1 rounded-xs px-2 py-1`}
    >
      {scheduled ? (
        <LiveAsset name="alarm" className="size-3.5" />
      ) : (
        <Icon name="viewers" className="size-3.5" />
      )}
      <span>{scheduled ? "예정됨" : "101"}</span>
    </span>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2 py-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-title-m">{title}</h2>
        {href && (
          <Link href={href} className={styles.more} aria-label={`${title} 더보기`}>
            더보기
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
  children,
  compact = false,
}: {
  id: string;
  reason?: string;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <article
      className={`relative min-w-0 overflow-hidden rounded-xs ${compact ? "w-41 shrink-0" : ""}`}
    >
      <Link href={`/live/${id}`} className="block" aria-label={`${projectTitle} 라이브 보기`}>
        <div className="bg-border-default aspect-square" />
        <div className="bg-layer-surface-disabled flex flex-col gap-2 p-2">
          <h3 className={styles.cardTitle}>{projectTitle}</h3>
          <Seller />
          {reason && (
            <span className="bg-border-default text-label-s w-fit rounded-xs px-2 py-1 font-medium">
              {reason}
            </span>
          )}
        </div>
      </Link>
      {children && <div className="pointer-events-none absolute top-2 right-2">{children}</div>}
    </article>
  );
}

export function BuyerLiveMain({ hasFollowing = true }: { hasFollowing?: boolean }) {
  const [notifications, setNotifications] = useState<ReadonlySet<string>>(
    () => new Set(["follow-3"]),
  );
  const [announcement, setAnnouncement] = useState("");

  function toggleNotification(id: string) {
    const enabled = !notifications.has(id);
    setNotifications((previous) => {
      const next = new Set(previous);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
    setAnnouncement(
      enabled
        ? "목업 시작 알림을 설정했습니다. 실제 알림은 발송되지 않습니다."
        : "목업 시작 알림을 해제했습니다.",
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
        <Tab href="/live" selected className={styles.tab}>
          실시간
        </Tab>
        <Tab href="/live/upcoming" className={styles.tab}>
          예정 라이브
        </Tab>
      </TabList>
      <main className="flex flex-col gap-6 px-5 pb-10">
        <h1 className="sr-only">라이브 메인</h1>
        <Section title="신규 오픈" href="/live/new">
          <div
            role="region"
            aria-label="신규 오픈 라이브 목록"
            tabIndex={0}
            className="flex gap-3 overflow-x-auto pb-1"
          >
            {[1, 2, 3, 4].map((number) => (
              <LiveCard key={number} id={`new-${number}`} compact>
                <StatusBadge scheduled={number % 2 === 0} />
              </LiveCard>
            ))}
          </div>
        </Section>
        <Section title="실시간 순위">
          <ol className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((rank) => (
              <li key={rank}>
                <Link
                  href={`/live/rank-${rank}`}
                  className="bg-layer-surface-disabled flex gap-2 rounded-sm p-2"
                >
                  <div className="bg-border-default relative h-[194px] w-[146px] max-w-[44%] shrink-0 rounded-xs px-2 py-1">
                    <div className="flex items-start justify-between gap-1">
                      <span
                        aria-label={`${rank}위`}
                        className={rank <= 3 ? "text-heading-m" : "text-body-strong"}
                      >
                        {rank}
                      </span>
                      <StatusBadge />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-2">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-caption-strong">테크·가전</span>
                        <h3 className="text-body-strong">{rankingTitle}</h3>
                      </div>
                      <span className="text-title-s">10,000% 달성</span>
                    </div>
                    <Seller ranking />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <Link
            href="/live/rank"
            aria-label="실시간 순위 더보기"
            className="text-body-emphasis mx-auto px-3 py-2"
          >
            더보기
          </Link>
        </Section>
        {hasFollowing && (
          <Section title="팔로우 브랜드" href="/live/following">
            <div className="grid grid-cols-2 gap-3">
              <LiveCard id="follow-1">
                <span
                  className={`${styles.statusBadge} text-caption-strong inline-flex items-center gap-1 rounded-xs px-2 py-1`}
                >
                  <LiveAsset name="live-navigation" className="size-3.5" />
                  LIVE
                </span>
              </LiveCard>
              {["follow-2", "follow-3"].map((id, index) => (
                <LiveCard key={id} id={id}>
                  <button
                    type="button"
                    aria-label={`팔로우 라이브 ${index + 2} 시작 알림`}
                    aria-pressed={notifications.has(id)}
                    onClick={() => toggleNotification(id)}
                    className="bg-border-default pointer-events-auto flex size-9 items-center justify-center rounded-full"
                  >
                    <LiveAsset name={notifications.has(id) ? "bell-selected" : "bell-add"} />
                  </button>
                </LiveCard>
              ))}
            </div>
          </Section>
        )}
        <Section title="추천 라이브" href="/live/recommended">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 9 }, (_, index) => (
              <LiveCard
                key={index}
                id={`recommended-${index + 1}`}
                reason={reasons[index % reasons.length]}
              />
            ))}
          </div>
        </Section>
        <p role="status" className="text-caption-s">
          {announcement}
        </p>
        <p className="text-caption-s text-text-secondary">
          와이어프레임 목업입니다. 연결된 검색·목록·상세 화면은 준비 중이며 알림은 저장되지
          않습니다.
        </p>
      </main>
      <nav
        aria-label="LIVE 화면 하단 메뉴"
        className="bg-layer-surface-disabled fixed bottom-0 left-1/2 z-20 flex w-full max-w-[390px] -translate-x-1/2 justify-between px-5 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]"
      >
        <Link href="/" className={styles.navItem}>
          <LiveAsset name="home" />홈
        </Link>
        <Link href="/live" aria-current="page" className={styles.navItem}>
          <LiveAsset name="live-navigation" />
          라이브
        </Link>
        <button
          type="button"
          disabled
          title="카테고리 화면 미정"
          aria-label="카테고리 · 화면 미정"
          className={styles.navItem}
        >
          <LiveAsset name="categories" />
          카테고리
        </button>
        <Link href="/my" className={styles.navItem}>
          <Icon name="profile" className="size-5" />
          마이
        </Link>
      </nav>
    </div>
  );
}
