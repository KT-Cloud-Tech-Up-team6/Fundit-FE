"use client";

import Image from "next/image";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { projectDemo, replayDemos, clipDemos, questionDemos } from "../model/project-demo";
import { Tooltip } from "@/shared/components/ui/tooltip";
import type { VideoCard } from "../model/live-replay";
import styles from "./buyer-project-detail.module.css";

const tabs = [
  ["story", "리워드 정보"],
  ["live-proof", "LIVE 체크"],
  ["news", "새소식"],
  ["community", "커뮤니티"],
  ["supporters", "서포터"],
  ["refund-policy", "환불 정책"],
] as const;

export function DetailIcon({
  name,
  className = "size-4",
}: {
  name: "share" | "heart" | "question-filled" | "info" | "replay" | "arrow-left";
  className?: string;
}) {
  const folder =
    name === "info" || name === "replay" || name === "arrow-left"
      ? "buyer-project"
      : "buyer-live-room";
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(/icons/${folder}/${name}.svg)`,
        maskSize: "100% 100%",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

export function Information({ label, disabled = false }: { label: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const tooltip = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    function fitTooltip() {
      const element = tooltip.current;
      const screen = element?.closest("main");
      if (!element || !screen) return;
      element.style.maxWidth = `${screen.getBoundingClientRect().right - element.getBoundingClientRect().left - 20}px`;
    }
    fitTooltip();
    window.addEventListener("resize", fitTooltip);
    return () => window.removeEventListener("resize", fitTooltip);
  }, [open]);
  return (
    <span className={styles.information}>
      <button
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen(!open)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
        }}
      >
        <DetailIcon name="info" className="h-3.5 w-4" />
      </button>
      {open && (
        <div ref={tooltip} id={id} role="tooltip" className={styles.tooltip}>
          <Tooltip direction="horizontal">
            <span className="flex flex-col gap-1">
              <span>
                본 상품 정보는 AI를 활용하여 작성된 후 판매자의 검토 및 수정을 거쳐 게시되었습니다.
              </span>
            </span>
          </Tooltip>
        </div>
      )}
    </span>
  );
}

/* 숏 클립 썸네일은 AI가 채우기 전까지 비어 있어(BE) LIVE 클립 관리처럼 클립 영상의 첫 프레임을 쓴다.
   둘 다 없으면 빈 면이다. */
function VideoPoster({ image, video }: Pick<VideoCard, "image" | "video">) {
  if (image)
    return (
      <Image
        src={image}
        alt=""
        fill
        sizes="163px"
        className="object-cover"
        unoptimized={/^https?:\/\//.test(image)}
      />
    );
  if (video)
    return (
      <video
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
        preload="metadata"
        src={video}
      />
    );
  return null;
}

/**
 * 종료된 라이브·숏 클립 가로 목록(`1541:50498`). `state`를 주면 목록 대신 그 안내(불러오는 중·오류·빈 목록)를
 * 보인다. 건수는 목록 길이가 아니라 전체 건수라 따로 받고, 모르면(불러오는 중·오류) 적지 않는다.
 */
export function VideoList({
  title,
  count,
  videos,
  state,
}: {
  title: string;
  count?: number;
  videos: readonly VideoCard[];
  state?: ReactNode;
}) {
  const carouselDrag = useHorizontalDrag();
  return (
    <section className={styles.videoSection} aria-label={title}>
      <h3>
        {title} {count !== undefined && <small>{count}건</small>}
      </h3>
      {state ?? (
        <div
          {...carouselDrag}
          className={styles.carousel}
          tabIndex={0}
          role="region"
          aria-label={`${title} 목록`}
        >
          {videos.map((video, index) => (
            <article key={video.id}>
              <Link href={video.href} aria-label={`${title} ${index + 1} · ${video.title} 재생`}>
                <span className={styles.videoPoster}>
                  <VideoPoster image={video.image} video={video.video} />
                  {video.badge && (
                    <Badge variant="live" className="relative">
                      {video.badge}
                    </Badge>
                  )}
                </span>
                <span className="text-body-s mt-1 line-clamp-2 font-medium">{video.title}</span>
                {video.date && (
                  <span className="text-caption-s text-text-secondary block">{video.date}</span>
                )}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

/** "LIVE 다시 보기" 절(`1541:50492`). 건수는 종료된 라이브와 숏 클립을 합친 수이고, 모르면 적지 않는다. */
export function LiveReplaySection({
  count,
  className = "",
  children,
}: {
  count?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-label="LIVE 다시 보기"
      className={`${styles.replay} flex min-w-0 flex-col gap-3 ${className}`}
    >
      <h2>
        <DetailIcon name="replay" className="text-text-primary-live size-3.5" />
        LIVE 다시 보기 {count !== undefined && <small>{count}건</small>}
      </h2>
      {children}
    </section>
  );
}

export function BuyerProjectDetail({
  projectId,
  activeTab,
  fundingAction,
  project = projectDemo,
  liveId = "demo-live",
  hasLive = true,
  preview = false,
  storyContent,
  rewardSummary,
  rewardSelection,
  server,
  tabContent,
}: {
  projectId: string;
  activeTab: string;
  fundingAction: ReactNode;
  project?: typeof projectDemo;
  liveId?: string;
  hasLive?: boolean;
  preview?: boolean;
  storyContent?: ReactNode;
  rewardSummary?: ReactNode;
  rewardSelection?: ReactNode;
  server?: { remainingDays?: number | null; participantCount: number };
  tabContent?: ReactNode;
}) {
  const Content = preview ? "div" : "main";
  const tabsDrag = useHorizontalDrag();
  const [liked, setLiked] = useState(false);
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedTab = useRef<HTMLAnchorElement>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const link = selectedTab.current;
    const container = link?.parentElement;
    if (!link || !container) return;
    const bounds = container.getBoundingClientRect();
    const selected = link.getBoundingClientRect();
    if (selected.right > bounds.right) container.scrollLeft += selected.right - bounds.right;
    else if (selected.left < bounds.left) container.scrollLeft += selected.left - bounds.left;
  }, [activeTab]);
  function announce(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(() => setNotice(""), 4000);
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        new URL(
          `/projects/${encodeURIComponent(projectId)}?tab=${activeTab}`,
          window.location.origin,
        ).href,
      );
      announce("프로젝트 링크를 복사했습니다.");
    } catch {
      announce("링크를 복사하지 못했습니다. 주소창의 링크를 복사해주세요.");
    }
  }
  const footer = (
    <footer className={`${styles.footer} border-border-default border-t`}>
      <button
        type="button"
        aria-label="프로젝트 찜"
        aria-pressed={liked}
        disabled={preview || Boolean(server)}
        onClick={() => setLiked(!liked)}
      >
        <DetailIcon name="heart" className="size-6" />
        {!server && <span className={preview ? "" : "min-[1200px]:hidden"}>9999+</span>}
        {!preview && !server && <span className="hidden min-[1200px]:inline">2.4천+</span>}
      </button>
      {!preview && (
        <button
          type="button"
          aria-label="프로젝트 공유"
          onClick={share}
          className="hidden min-[1200px]:flex min-[1200px]:w-11 min-[1200px]:shrink-0 min-[1200px]:flex-col min-[1200px]:items-center"
        >
          <DetailIcon name="share" className="size-6" />
          <span className="text-body-s">공유</span>
        </button>
      )}
      {fundingAction}
    </footer>
  );
  return (
    <div
      className={
        styles.screen +
        " bg-layer-surface-default text-text-default mx-auto w-full min-w-0 " +
        (preview
          ? `${styles.preview} max-w-[390px]`
          : `${styles.desktop} min-h-dvh pb-[calc(63px+env(safe-area-inset-bottom))] min-[1200px]:pb-0`)
      }
    >
      {!preview && <BuyerDesktopHeader />}
      <header className={`${styles.header} ${preview ? "" : "min-[1200px]:hidden"}`}>
        {preview ? (
          <button type="button" disabled aria-label="라이브 목록으로 돌아가기">
            <DetailIcon name="arrow-left" className="size-5" />
          </button>
        ) : (
          <Link href="/live" aria-label="라이브 목록으로 돌아가기">
            <DetailIcon name="arrow-left" className="size-5" />
          </Link>
        )}
        <span>상세페이지</span>
        <button type="button" aria-label="프로젝트 공유" onClick={share} disabled={preview}>
          <DetailIcon name="share" className="size-6" />
        </button>
      </header>
      <Content className={styles.layout} data-tab={activeTab}>
        <div className={`${styles.hero} bg-layer-bg relative aspect-[390/292] overflow-hidden`}>
          {project.image ? (
            <Image
              src={project.image}
              alt={preview ? `${project.title} 썸네일` : ""}
              fill
              sizes="(min-width: 1200px) 714px, 390px"
              unoptimized={preview || Boolean(server)}
              className={preview ? "object-cover" : styles.heroImage}
            />
          ) : (
            <p className="text-body-s text-text-secondary flex h-full items-center justify-center">
              등록된 썸네일 이미지가 없습니다.
            </p>
          )}
          {hasLive && (
            <Link
              href={`/live/${encodeURIComponent(liveId)}`}
              aria-label="진행 중 라이브 시청"
              className="absolute top-5 left-5 flex flex-col gap-1"
            >
              <Badge
                variant="neutral"
                size="sm"
                shape="rounded"
                className={`${styles.liveBadge} ${preview ? "" : "min-[1200px]:text-caption-s min-[1200px]:h-[26px] min-[1200px]:font-medium"}`}
              >
                <Image src="/images/buyer-live/3fa99.svg" width={16} height={16} alt="" />
                LIVE
              </Badge>
              <div className="border-border-default relative h-30 w-[90px] overflow-hidden rounded-xs border shadow-md">
                <Image src={project.poster} alt="" fill sizes="90px" className="object-cover" />
              </div>
            </Link>
          )}
          {((!preview && !server) || project.image) && (
            <Badge variant="neutral" className="absolute right-5 bottom-5">
              {preview || server ? "1/1" : "1/3"}
            </Badge>
          )}
        </div>
        <aside className={styles.summaryColumn}>
          <section className={styles.projectInfo + " px-5 py-4"} aria-label="프로젝트 정보">
            <p className="text-body-s text-text-secondary mb-1 font-medium">{project.seller}</p>
            <h1 className="text-title-m">{project.title}</h1>
            <div className={styles.fundingNumbers}>
              <div>
                <p>
                  <strong>{project.rate}</strong> <span>% 달성</span>
                </p>
                <Badge
                  variant="accent"
                  size="md"
                  className={
                    preview
                      ? undefined
                      : "max-[1200px]:bg-status-info max-[1200px]:text-text-info max-[1200px]:text-label-m max-[1200px]:h-6 max-[1200px]:font-semibold"
                  }
                >
                  {server
                    ? server.remainingDays == null
                      ? "기간 미정"
                      : server.remainingDays <= 0
                        ? "종료"
                        : `D-${server.remainingDays}`
                    : "D-28"}
                </Badge>
              </div>
              <div>
                <p>
                  <b>{project.amount}</b> <span className="text-body-s">/{project.goal}원</span>
                </p>
                <span className={styles.participants}>
                  {server ? server.participantCount.toLocaleString("ko-KR") : "100"}명 참여
                </span>
              </div>
            </div>
            {!server && (
              <section
                className="border-border-default mt-3 flex flex-col gap-2 rounded-xs border px-3 py-2"
                aria-label="AI 프로젝트 요약"
              >
                <div className="flex items-center gap-1">
                  <Image src="/images/buyer-project/spark.svg" width={14} height={14} alt="" />
                  <h2 className="text-label-l">AI 프로젝트 요약</h2>
                  <Information label="AI 프로젝트 요약 안내" disabled={preview} />
                </div>
                {["프로젝트 요약", "프로젝트 요약", ...(hasLive ? ["라이브 요약"] : [])].map(
                  (title, i) => (
                    <div className="text-caption-s" key={i}>
                      <h3 className="flex items-center gap-1 font-medium">
                        <Image
                          src="/images/buyer-project/summary-check.svg"
                          width={12}
                          height={12}
                          alt=""
                        />
                        {title}
                      </h3>
                      <p className="pl-4">상세 내용</p>
                    </div>
                  ),
                )}
              </section>
            )}
          </section>
          {!preview && rewardSelection && (
            <div className="hidden min-[1200px]:block">{rewardSelection}</div>
          )}
          {!preview && footer}
          {!preview && !rewardSelection && (
            <div className="hidden min-[1200px]:block">{rewardSummary}</div>
          )}
        </aside>
        <nav {...tabsDrag} className={styles.tabs} aria-label="프로젝트 상세 탭">
          {tabs.map(([value, label]) =>
            preview ? (
              <button
                key={value}
                type="button"
                disabled
                className="text-body-m text-text-disabled border-border-default aria-[current=page]:border-border-primary aria-[current=page]:text-text-default flex h-[46px] shrink-0 items-center gap-2 border-b p-2 whitespace-nowrap aria-[current=page]:border-b-[1.8px] aria-[current=page]:font-medium"
                aria-current={value === activeTab ? "page" : undefined}
              >
                {label}
                {!server && value !== "story" && value !== "refund-policy" && <small>000</small>}
              </button>
            ) : (
              <Link
                scroll={false}
                className="text-body-m text-text-disabled border-border-default aria-[current=page]:border-border-primary aria-[current=page]:text-text-default flex h-[46px] shrink-0 items-center gap-2 border-b p-2 whitespace-nowrap aria-[current=page]:border-b-[1.8px] aria-[current=page]:font-medium"
                key={value}
                ref={value === activeTab ? selectedTab : undefined}
                href={`/projects/${encodeURIComponent(projectId)}?tab=${value}`}
                aria-current={value === activeTab ? "page" : undefined}
              >
                {label}
                {!server && value !== "story" && value !== "refund-policy" && <small>000</small>}
              </Link>
            ),
          )}
        </nav>
        {tabContent ? (
          <section className={styles.story + " relative mx-5 mt-4 mb-8"}>{tabContent}</section>
        ) : activeTab === "story" ? (
          <section className={styles.story + " relative mx-5 mt-4 mb-8"} aria-label="상품 소개">
            {storyContent ?? (
              <div className={styles.storyImage}>
                <Image
                  src="/images/buyer-project/story.png"
                  alt="CleanForge 무선 청소기 상품 소개 예시"
                  fill
                  unoptimized
                />
              </div>
            )}
          </section>
        ) : (
          <div className={styles.liveContent + " flex flex-col gap-6 px-5 pt-4 pb-10"}>
            <LiveReplaySection count={replayDemos.length + clipDemos.length}>
              <VideoList
                title="종료된 라이브"
                count={replayDemos.length}
                videos={replayDemos.map((video, index) => ({
                  id: `replay-${index}`,
                  href: `/live/${encodeURIComponent(liveId)}?mode=replay`,
                  title: video.title,
                  date: video.date,
                  image: projectDemo.poster,
                }))}
              />
              <VideoList
                title="숏 클립"
                count={clipDemos.length}
                videos={clipDemos.map((video, index) => ({
                  id: `clip-${index}`,
                  href: `/live/${encodeURIComponent(liveId)}?mode=replay&view=clip`,
                  title: video.title,
                  date: video.date,
                  image: projectDemo.image,
                  badge: index === 0 || index === 2 ? "시연 영상" : "하이라이트",
                }))}
              />
            </LiveReplaySection>
            <section className="flex flex-col gap-6" aria-label="LIVE Q&A">
              <div className="-mb-3 flex items-center gap-1">
                <h2>
                  <DetailIcon name="question-filled" className="text-text-primary-live size-5" />
                  LIVE Q&amp;A <small>{questionDemos.length}건</small>
                </h2>
                <Information label="LIVE Q&A 안내" />
              </div>
              {questionDemos.map((question) => (
                <article key={question.title}>
                  <h3>{question.title}</h3>
                  <p className="text-caption-s text-text-secondary block">
                    {question.count}건 · {question.date}
                  </p>
                  <div className="border-border-default text-body-s mt-2 flex flex-col gap-1 rounded-xs border px-3 py-2 font-medium">
                    <p>{question.answer}</p>
                    <p className="text-caption-s text-text-secondary block">
                      판매자 · {question.answeredAt}
                    </p>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </Content>
      {preview && footer}

      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
