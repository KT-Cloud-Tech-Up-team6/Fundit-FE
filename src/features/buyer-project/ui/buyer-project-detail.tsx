"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { projectDemo, replayDemos } from "../model/project-demo";
import { Tooltip } from "@/shared/components/ui/tooltip";
import styles from "./buyer-project-detail.module.css";

const tabs = [
  ["story", "리워드 정보"],
  ["live-proof", "LIVE 체크"],
  ["news", "새소식"],
  ["community", "커뮤니티"],
  ["supporters", "서포터"],
  ["refund-policy", "환불 정책"],
] as const;

function DetailIcon({
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

function Information({ label }: { label: string }) {
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

function VideoList({ clips = false, liveId }: { clips?: boolean; liveId: string }) {
  const title = clips ? "숏 클립" : "종료된 라이브";
  return (
    <section className={styles.videoSection} aria-label={title}>
      <h3>
        {title} <small>3건</small>
      </h3>
      <div className={styles.carousel} tabIndex={0} role="region" aria-label={`${title} 목록`}>
        {replayDemos.map((video, index) => (
          <article key={index}>
            <Link
              href={`/live/${encodeURIComponent(liveId)}?mode=replay${clips ? "&view=clip" : ""}`}
              aria-label={`${title} ${index + 1} · ${clips ? "[제품명] AI 생성 제목" : video.title} 재생`}
            >
              <span className={styles.videoPoster}>
                <Image
                  src={clips ? projectDemo.image : projectDemo.poster}
                  alt=""
                  fill
                  sizes="163px"
                  className="object-cover"
                />
                {clips && (
                  <Badge variant="live" className="relative">
                    {index === 1 ? "하이라이트" : "시연 영상"}
                  </Badge>
                )}
              </span>
              <span className="text-body-s mt-1 line-clamp-2 font-medium">
                {clips ? "[제품명] AI 생성 제목" : video.title}
              </span>
              <span className="text-caption-s text-text-secondary block">
                {clips ? "09.07" : video.date}
              </span>
            </Link>
          </article>
        ))}
      </div>
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
}: {
  projectId: string;
  activeTab: "story" | "live-proof";
  fundingAction: ReactNode;
  project?: typeof projectDemo;
  liveId?: string;
  hasLive?: boolean;
}) {
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
  return (
    <div
      className={
        styles.screen +
        " bg-layer-surface-default text-text-default mx-auto min-h-dvh w-full max-w-[390px] min-w-0 pb-[calc(63px+env(safe-area-inset-bottom))]"
      }
    >
      <header className={styles.header}>
        <Link href="/live" aria-label="라이브 목록으로 돌아가기">
          <DetailIcon name="arrow-left" className="size-5" />
        </Link>
        <span>상세페이지</span>
        <button type="button" aria-label="프로젝트 공유" onClick={share}>
          <DetailIcon name="share" className="size-6" />
        </button>
      </header>
      <main>
        <div className="bg-layer-bg relative aspect-[390/292] overflow-hidden">
          <Image src={project.image} alt="" fill sizes="390px" className={styles.heroImage} />
          {hasLive && (
            <Link
              href={`/live/${encodeURIComponent(liveId)}`}
              aria-label="진행 중 라이브 시청"
              className="absolute top-5 left-5 flex flex-col gap-1"
            >
              <Badge variant="neutral" shape="rounded" className={styles.liveBadge}>
                <Image src="/images/buyer-live/3fa99.svg" width={16} height={16} alt="" />
                LIVE
              </Badge>
              <div className="border-border-default relative h-30 w-[90px] overflow-hidden rounded-xs border shadow-md">
                <Image src={project.poster} alt="" fill sizes="90px" className="object-cover" />
              </div>
            </Link>
          )}
          <Badge variant="neutral" className="absolute right-5 bottom-5">
            1/3
          </Badge>
        </div>
        <section className="px-5 py-4" aria-label="프로젝트 정보">
          <p className="text-body-s text-text-secondary mb-1 font-medium">{project.seller}</p>
          <h1 className="text-title-m">{project.title}</h1>
          <div className={styles.fundingNumbers}>
            <div>
              <p>
                <strong>{project.rate}</strong> <span>% 달성</span>
              </p>
              <Badge variant="neutral">D-28</Badge>
            </div>
            <div>
              <p>
                <b>{project.amount}</b> <span className="text-body-s">/{project.goal}원</span>
              </p>
              <span className={styles.participants}>100명 참여</span>
            </div>
          </div>
          <section
            className="border-border-default mt-3 flex flex-col gap-2 rounded-xs border px-3 py-2"
            aria-label="AI 프로젝트 요약"
          >
            <div className="flex items-center gap-1">
              <Image src="/images/buyer-project/spark.svg" width={14} height={14} alt="" />
              <h2 className="text-label-l">AI 프로젝트 요약</h2>
              <Information label="AI 프로젝트 요약 안내" />
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
        </section>
        <nav className={styles.tabs} aria-label="프로젝트 상세 탭">
          {tabs.map(([value, label]) => (
            <Link
              scroll={false}
              className="text-body-m text-text-disabled border-border-default aria-[current=page]:border-border-primary aria-[current=page]:text-text-default flex h-[46px] shrink-0 items-center gap-2 border-b p-2 whitespace-nowrap aria-[current=page]:border-b-[1.8px] aria-[current=page]:font-medium"
              key={value}
              ref={value === activeTab ? selectedTab : undefined}
              href={`/projects/${encodeURIComponent(projectId)}?tab=${value}`}
              aria-current={value === activeTab ? "page" : undefined}
            >
              {label}
              {value !== "story" && value !== "refund-policy" && <small>000</small>}
            </Link>
          ))}
        </nav>
        {activeTab === "story" ? (
          <section className={styles.story + " relative mx-5 mt-4 mb-8"} aria-label="상품 소개">
            <div className={styles.storyImage}>
              <Image
                src="/images/buyer-project/story.png"
                alt="CleanForge 무선 청소기 상품 소개 예시"
                fill
                sizes="(max-width: 390px) 112vw, 436px"
                unoptimized
              />
            </div>
          </section>
        ) : (
          <div className={styles.liveContent + " flex flex-col gap-6 px-5 pt-4 pb-10"}>
            <section aria-label="LIVE 다시 보기" className="flex min-w-0 flex-col gap-3">
              <h2>
                <DetailIcon name="replay" className="text-text-primary-live size-3.5" />
                LIVE 다시 보기 <small>3건</small>
              </h2>
              <VideoList liveId={liveId} />
              <VideoList clips liveId={liveId} />
            </section>
            <section className="flex flex-col gap-6" aria-label="LIVE Q&A">
              <div className="-mb-3 flex items-center gap-1">
                <h2>
                  <DetailIcon name="question-filled" className="text-text-primary-live size-5" />
                  LIVE Q&amp;A <small>5건</small>
                </h2>
                <Information label="LIVE Q&A 안내" />
              </div>
              {[1, 2, 3, 4, 5].map((n) => (
                <article key={n}>
                  <h3>로보락이 뭐예요?</h3>
                  <p className="text-caption-s text-text-secondary block">12건 · 09.07</p>
                  <div className="border-border-default text-body-s mt-2 flex flex-col gap-1 rounded-xs border px-3 py-2 font-medium">
                    <p>무선 청소기 입니다.</p>
                    <p className="text-caption-s text-text-secondary block">판매자 · 09.07</p>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </main>
      <footer className={`${styles.footer} border-border-default border-t`}>
        <button
          type="button"
          aria-label="프로젝트 찜"
          aria-pressed={liked}
          onClick={() => setLiked(!liked)}
        >
          <DetailIcon name="heart" className="size-6" />
          <span>9999+</span>
        </button>
        {fundingAction}
      </footer>
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
