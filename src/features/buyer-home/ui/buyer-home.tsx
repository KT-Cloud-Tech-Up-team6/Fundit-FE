"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { buyerCategories } from "@/entities/category/model/category-mock";
import { BuyerBottomNavigation } from "@/shared/components/layout/buyer-bottom-navigation";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { Badge } from "@/shared/components/ui/badge";
import { ErrorState } from "@/shared/components/ui/error-state";
import { Icon } from "@/shared/components/ui/icon";
import { PendingDestination } from "@/shared/components/ui/pending-destination";
import { SearchField } from "@/shared/components/ui/search-field";
import { textButtonNavigationClasses } from "@/shared/components/ui/text-button";
import { setCategoryReturnPath } from "@/shared/lib/category-return-path";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import type { FeaturedCard, LiveCard, SectionData } from "../model/home-cards";
import {
  deadlineProjects,
  heroSlides,
  recommendedProjects,
  type MockProjectCard,
} from "../model/home-mock";
import { HomeHeroCarousel } from "./home-hero-carousel";
import styles from "./buyer-home.module.css";

/* 썸네일이 없으면 카드의 중립 배경만 남긴다. BE 썸네일(외부 주소)은 최적화 없이 그대로 쓴다. */
function CardImage({ src, sizes }: { src?: string | null; sizes: string }) {
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

/** 가로로 넘기는 목록. `desktopScroll`이 없으면 1200px 이상에서는 넘길 것이 없는 목록이다. */
function ScrollList({
  label,
  desktopScroll = false,
  className,
  children,
}: {
  label?: string;
  desktopScroll?: boolean;
  className: string;
  children: ReactNode;
}) {
  const drag = useHorizontalDrag();
  return (
    <ul
      {...drag}
      aria-label={label}
      className={`${desktopScroll ? styles.scroller : styles.mobileScroller} flex overflow-x-auto ${className}`}
    >
      {children}
    </ul>
  );
}

/** 실제 API 섹션의 조회 중·실패·빈 목록 안내. 어느 경우에도 섹션 제목은 남긴다. */
function SectionBody<T>({
  data,
  messages,
  children,
}: {
  data: SectionData<T>;
  messages: { loading: string; error: string; empty: string };
  children: (items: readonly T[]) => ReactNode;
}) {
  if (data.status === "loading")
    return (
      <p role="status" className="text-body-s text-text-secondary py-6 text-center">
        {messages.loading}
      </p>
    );
  if (data.status === "error")
    return (
      <ErrorState
        variant="section"
        description={messages.error}
        action={{ label: "다시 시도", onClick: data.onRetry }}
        className="py-6"
      />
    );
  if (data.items.length === 0)
    return <p className="text-body-s text-text-secondary py-6 text-center">{messages.empty}</p>;
  return children(data.items);
}

/* 프로젝트 섹션의 제목 줄. 전체보기 목록 화면은 이번 범위가 아니라 비활성으로 둔다.
   모바일은 제목 옆에 전체보기, 설명은 아래 줄이다. PC는 제목·설명 오른쪽 가운데에 전체보기가 온다. */
function ProjectSection({
  title,
  description,
  descriptionDesktopOnly = false,
  children,
}: {
  title: string;
  description: string;
  descriptionDesktopOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="min-[1200px]:bg-layer-surface-default min-[1200px]:py-12"
    >
      <div className="flex flex-col gap-3 min-[1200px]:mx-auto min-[1200px]:max-w-300 min-[1200px]:gap-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
          <h2 className="text-title-m text-text-title min-[1200px]:text-title-l">{title}</h2>
          <PendingDestination
            label={`${title} 전체보기`}
            className={`${textButtonNavigationClasses} min-[1200px]:text-body-m -my-1.5 min-[1200px]:row-span-2 min-[1200px]:my-0`}
          >
            전체보기
          </PendingDestination>
          <p
            className={`text-body-s text-text-secondary col-span-2 min-[1200px]:col-span-1 ${descriptionDesktopOnly ? "hidden min-[1200px]:block" : ""}`}
          >
            {description}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

/* 모바일 `2315:71305`(144×192)와 PC `2315:71636`(220×293). 모바일은 판매자가 제목 위, PC는 대분류가
   제목 위이고 판매자가 달성률 아래다. 판매자 아바타는 BE에 없어 이름만 둔다. */
function FeaturedItem({ card }: { card: FeaturedCard }) {
  const content = (
    <>
      <div className="bg-layer-bg relative aspect-[3/4] overflow-hidden rounded-xs">
        <CardImage src={card.image} sizes="(min-width: 1200px) 220px, 144px" />
      </div>
      <div className="mt-2 flex flex-col gap-1 min-[1200px]:gap-2">
        <div className="flex flex-col gap-1">
          {card.seller && (
            <p className="text-text-secondary text-[12px] leading-[1.3] font-medium min-[1200px]:hidden">
              {card.seller}
            </p>
          )}
          {card.category && (
            <p className="text-text-secondary hidden text-[13px] leading-[1.4] font-medium min-[1200px]:block">
              {card.category}
            </p>
          )}
          <h3 className="line-clamp-2 text-[14px] leading-[1.42] font-medium min-[1200px]:text-[18px]">
            {card.title}
          </h3>
          {/* 달성률은 상세를 받은 뒤 채워진다. 그동안 카드 높이가 바뀌지 않게 한 줄을 비워 둔다. */}
          <p className="text-title-s min-[1200px]:text-title-l min-h-[1lh]">{card.achievement}</p>
        </div>
        {card.seller && (
          <p className="hidden text-[14px] leading-[1.42] font-medium min-[1200px]:block">
            {card.seller}
          </p>
        )}
      </div>
    </>
  );
  if (card.href)
    return (
      <Link href={card.href} className="block">
        {content}
      </Link>
    );
  /* 공개 UUID가 없는 카드는 숫자 ID로 상세를 열 수 없어 링크로 만들지 않는다(검색 목록과 같다). */
  return (
    <div>
      {content}
      <p className="text-caption-s text-text-secondary mt-1">상세 연결 준비 중</p>
    </div>
  );
}

/* 모바일 `2315:71352`(164×164)와 PC `2315:71752`(224×224). "라이브 특가"는 BE에 값이 없어 두지 않는다. */
function LiveItem({ card }: { card: LiveCard }) {
  return (
    <Link href={card.href} className="flex flex-col gap-2">
      <div className="bg-layer-bg relative aspect-square overflow-hidden rounded-xs">
        <CardImage src={card.image} sizes="(min-width: 1200px) 224px, 164px" />
        {card.viewers && (
          <Badge variant="accent" shape="rounded" className="absolute top-3 right-3">
            {/* Figma의 사람 둘 아이콘. LIVE 메인 시청자 뱃지와 같은 파일이다. */}
            <span
              aria-hidden
              className="size-4 shrink-0 bg-current"
              style={{
                maskImage: "url(/images/buyer-live/b19ca.svg)",
                maskSize: "contain",
                maskPosition: "center",
                maskRepeat: "no-repeat",
              }}
            />
            <span className="sr-only">시청자 </span>
            {card.viewers}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="min-[1200px]:text-body-emphasis line-clamp-2 text-[14px] leading-[1.42] font-medium">
          {card.title}
        </h3>
        {card.seller && (
          <p className="text-text-secondary min-[1200px]:text-caption-m text-[12px] leading-[1.3] font-medium">
            {card.seller}
          </p>
        )}
      </div>
    </Link>
  );
}

/* 마감 임박(모바일 `2315:71409` 165×220, PC 186×248)과 추천(모바일 `2315:71445` 169×225, PC 220×293) 목업 카드. */
function MockItem({ card, sizes }: { card: MockProjectCard; sizes: string }) {
  return (
    <Link href={card.href} className="flex flex-col gap-2">
      <div className="bg-layer-bg relative aspect-[3/4] overflow-hidden rounded-xs">
        <CardImage src={card.image} sizes={sizes} />
        {card.dday && (
          <Badge variant="info" shape="rounded" className="absolute top-2 right-2">
            {card.dday}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="min-[1200px]:text-body-emphasis line-clamp-2 text-[14px] leading-[1.42] font-medium whitespace-pre-line">
            {card.title}
          </h3>
          <p className="text-text-secondary min-[1200px]:text-caption-m text-[12px] leading-[1.3] font-medium">
            {card.seller}
          </p>
        </div>
        {card.reasons && (
          <div className="flex flex-wrap gap-2">
            {card.reasons.map((reason) => (
              <Badge key={reason} variant="info">
                {reason}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

/* 모바일은 제목 줄과 가로 목록, PC(`2315:71742`)는 파란 띠 안에 소개와 가로 목록이다. 전체보기는 LIVE 메인이다. */
function LiveSection({ lives }: { lives: SectionData<LiveCard> }) {
  return (
    <section
      aria-label="실시간 LIVE"
      className="min-[1200px]:bg-status-accent min-[1200px]:px-10 min-[1200px]:py-12"
    >
      <div className="flex flex-col gap-3 min-[1200px]:mx-auto min-[1200px]:max-w-300 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:gap-6">
        <div className="flex h-7 items-center justify-between gap-2 min-[1200px]:hidden">
          <h2 className="text-title-m text-text-primary-live">실시간 LIVE</h2>
          <Link href="/live" className={`${textButtonNavigationClasses} -my-1.5`}>
            전체보기
          </Link>
        </div>
        <div className="hidden w-[282px] shrink-0 flex-col gap-6 min-[1200px]:flex">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-start gap-3">
              <Badge variant="primaryLive" shape="rounded" size="md" showIcon>
                LIVE
              </Badge>
              <h2 className="text-heading-l text-text-primary-live">실시간 LIVE 진행 중!</h2>
            </div>
            <p className="text-body-emphasis text-text-secondary w-64">
              지금 라이브에서만 만날 수 있는 특별한 혜택을 놓치지 마세요
            </p>
          </div>
          <Link
            href="/live"
            className="border-border-primary-live text-text-primary-live text-label-l flex w-fit items-center gap-2 rounded-full border px-4 py-2"
          >
            라이브 전체보기
            <Icon name="next" className="size-3" />
          </Link>
        </div>
        <div className="min-w-0 flex-1">
          <SectionBody
            data={lives}
            messages={{
              loading: "실시간 LIVE를 불러오고 있습니다.",
              error: "실시간 LIVE를 불러오지 못했습니다.",
              empty: "지금 진행 중인 LIVE가 없습니다.",
            }}
          >
            {(items) => (
              <ScrollList
                label="실시간 LIVE 목록"
                desktopScroll
                className="-mx-5 gap-3 px-5 min-[1200px]:mx-0 min-[1200px]:px-0"
              >
                {items.map((card) => (
                  <li key={card.id} className="w-41 shrink-0 min-[1200px]:w-56">
                    <LiveItem card={card} />
                  </li>
                ))}
              </ScrollList>
            )}
          </SectionBody>
        </div>
      </div>
    </section>
  );
}

/**
 * 구매자 홈 `FL_B_HM_HOME`(Figma `2315:72822`). 주목받는 프로젝트와 실시간 LIVE는 실제 API 결과를
 * `SectionData`로 받고, 히어로·마감 임박·추천은 FE 목업(`home-mock.ts`)이다.
 */
export function BuyerHome({
  featured,
  lives,
}: {
  featured: SectionData<FeaturedCard>;
  lives: SectionData<LiveCard>;
}) {
  return (
    <div
      className={`${styles.screen} bg-layer-surface-default min-[1200px]:bg-layer-bg text-text-default min-h-dvh w-full pb-[calc(var(--buyer-bottom-navigation-height)+env(safe-area-inset-bottom))] min-[1200px]:pb-0`}
    >
      <BuyerDesktopHeader />
      <header className="flex items-center gap-4 px-5 py-2 min-[1200px]:hidden">
        <Link href="/" aria-label="Fundit 홈" className="shrink-0 pb-2">
          <Image src="/logo.svg" alt="Fundit" width={80} height={29} />
        </Link>
        <form action="/search" role="search" className="min-w-0 flex-1">
          <SearchField name="q" aria-label="프로젝트 검색" placeholder="검색어를 입력하세요" />
        </form>
        <PendingDestination
          label="알림함"
          className="flex size-10 shrink-0 items-center justify-center"
        >
          <Icon name="bell" className="size-6" />
        </PendingDestination>
      </header>
      <div className="bg-layer-surface-default hidden justify-center py-[42px] min-[1200px]:flex">
        <form action="/search" role="search" className="w-[636px]">
          <SearchField
            size="lg"
            name="q"
            aria-label="프로젝트 검색"
            placeholder="검색어를 입력해주세요"
          />
        </form>
      </div>
      <main className="flex flex-col">
        <h1 className="sr-only">Fundit 홈</h1>
        <div className="bg-layer-surface-default px-5 py-2 min-[1200px]:p-2">
          <div className="min-[1200px]:mx-auto min-[1200px]:max-w-300">
            <HomeHeroCarousel slides={heroSlides} />
          </div>
        </div>
        {/* 확정 카테고리 7종이 모두 보여 Figma의 더보기는 두지 않는다. 하단 메뉴·PC 헤더의 카테고리처럼
            들어온 주소를 복귀 경로로 남겨, 카테고리 화면에서 카테고리 탭을 다시 누르면 홈으로 돌아온다. */}
        <nav aria-label="카테고리 바로가기" className="bg-layer-surface-default min-[1200px]:py-6">
          <ScrollList className="gap-4 px-5 py-1 min-[1200px]:mx-auto min-[1200px]:max-w-300 min-[1200px]:gap-3 min-[1200px]:p-0">
            {buyerCategories.map((category) => (
              <li key={category.slug} className="shrink-0">
                <Link
                  href={`/categories/${category.slug}`}
                  onClick={() =>
                    setCategoryReturnPath(window.location.pathname + window.location.search)
                  }
                  className="min-[1200px]:border-border-default flex items-center gap-1 py-2 text-[13px] leading-[1.4] font-medium whitespace-nowrap min-[1200px]:h-13 min-[1200px]:min-w-[116px] min-[1200px]:justify-center min-[1200px]:gap-2 min-[1200px]:border-b-[1.5px] min-[1200px]:pr-2 min-[1200px]:pl-1 min-[1200px]:text-[18px] min-[1200px]:leading-[1.42]"
                >
                  <span
                    aria-hidden
                    className="size-5 shrink-0 bg-current"
                    style={{
                      maskImage: `url(/icons/buyer-category/${category.slug}.svg)`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                    }}
                  />
                  {category.name}
                </Link>
              </li>
            ))}
          </ScrollList>
        </nav>
        <div className="bg-layer-surface-default flex flex-col gap-10 px-5 pt-4 pb-10 min-[1200px]:contents">
          <ProjectSection
            title="지금 주목받는 프로젝트"
            description="지금 많은 사람들이 지지하는 핫한 프로젝트를 만나보세요."
            descriptionDesktopOnly
          >
            <SectionBody
              data={featured}
              messages={{
                loading: "지금 주목받는 프로젝트를 불러오고 있습니다.",
                error: "지금 주목받는 프로젝트를 불러오지 못했습니다.",
                empty: "지금 주목받는 프로젝트가 없습니다.",
              }}
            >
              {(items) => (
                <ScrollList
                  label="지금 주목받는 프로젝트 목록"
                  className="-mx-5 gap-3 px-5 min-[1200px]:mx-0 min-[1200px]:grid min-[1200px]:grid-cols-5 min-[1200px]:gap-x-6 min-[1200px]:gap-y-8 min-[1200px]:px-0"
                >
                  {items.map((card) => (
                    <li key={card.id} className="w-36 shrink-0 min-[1200px]:w-auto">
                      <FeaturedItem card={card} />
                    </li>
                  ))}
                </ScrollList>
              )}
            </SectionBody>
          </ProjectSection>
          <LiveSection lives={lives} />
          <ProjectSection
            title="마감 임박 프로젝트"
            description="지금이 아니면 만나기 어려운 프로젝트, 서둘러 참여하세요!"
          >
            <ScrollList
              label="마감 임박 프로젝트 목록"
              className="-mx-5 gap-3 px-5 min-[1200px]:mx-0 min-[1200px]:gap-4 min-[1200px]:px-0"
            >
              {deadlineProjects.map((card) => (
                <li key={card.id} className="w-[165px] shrink-0 min-[1200px]:w-[186px]">
                  <MockItem card={card} sizes="(min-width: 1200px) 186px, 165px" />
                </li>
              ))}
            </ScrollList>
          </ProjectSection>
          {/* 모바일 원본의 "추천 라이브"(`2315:71443`)는 IA·PC와 같은 추천 프로젝트로 둔다. */}
          <ProjectSection
            title="추천 프로젝트"
            description="Fundit이 엄선한 특별한 프로젝트를 만나보세요."
            descriptionDesktopOnly
          >
            <ul
              aria-label="추천 프로젝트 목록"
              className="grid grid-cols-2 gap-x-3 gap-y-4 min-[1200px]:grid-cols-5 min-[1200px]:gap-x-6 min-[1200px]:gap-y-8"
            >
              {recommendedProjects.map((card) => (
                <li key={card.id} className="min-w-0">
                  <MockItem card={card} sizes="(min-width: 1200px) 220px, 44vw" />
                </li>
              ))}
            </ul>
          </ProjectSection>
        </div>
      </main>
      <BuyerBottomNavigation
        activeHref="/"
        flat
        aria-label="홈 화면 하단 메뉴"
        className="fixed bottom-0 left-1/2 z-20 w-full -translate-x-1/2 min-[1200px]:hidden"
      />
    </div>
  );
}
