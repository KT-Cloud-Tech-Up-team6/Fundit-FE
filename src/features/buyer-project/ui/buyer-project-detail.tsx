"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
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
  const tooltip = useRef<HTMLSpanElement>(null);
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
        <span ref={tooltip} id={id} role="tooltip" className={styles.tooltip}>
          <Image src="/icons/buyer-project/tooltip-tail.svg" width={8.925} height={21} alt="" />
          <span className={styles.tooltipBody}>
            <span>
              본 상품 정보는 AI를 활용하여 작성된 후 판매자의 검토 및 수정을 거쳐 게시되었습니다.
            </span>
            <span>
              다만 일부 표현이나 정보에 오류가 있을 수 있으니, 정확한 사항은 구매 전 문의해 주시기
              바랍니다.
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

function VideoList({ clips = false, onPlay }: { clips?: boolean; onPlay: () => void }) {
  const title = clips ? "숏 클립" : "종료된 라이브";
  return (
    <section className={styles.videoSection} aria-label={title}>
      <h3>
        {title} <small>3건</small>
      </h3>
      <div className={styles.carousel} tabIndex={0} role="region" aria-label={`${title} 목록`}>
        {[1, 2, 3].map((n) => (
          <article key={n}>
            <button
              type="button"
              onClick={onPlay}
              aria-label={`${title} ${n} · (프로젝트 명 무선 청소기 입니다.) 재생`}
            >
              <span className={styles.videoPoster}>
                {clips && <span>{n === 2 ? "하이라이트" : "시연 영상"}</span>}
              </span>
              <span className={styles.videoTitle}>(프로젝트 명 무선 청소기 입니다.)</span>
              <span className={styles.date}>09.07</span>
            </button>
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
}: {
  projectId: string;
  activeTab: "story" | "live-proof";
  fundingAction: ReactNode;
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
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link href="/live" aria-label="라이브 목록으로 돌아가기">
          <DetailIcon name="arrow-left" className="size-5" />
        </Link>
        <span>상세페이지</span>
        <button type="button" aria-label="프로젝트 공유" onClick={share}>
          <DetailIcon name="share" className="h-3.5 w-6" />
        </button>
      </header>
      <main>
        <div className={styles.hero} role="img" aria-label="상품 이미지 목업 · 1/3">
          <span className={styles.liveThumbnail}>
            라이브
            <br />
            썸네일
            <br />
            -진행중일 시
          </span>
          <span className={styles.liveBadge}>
            <Icon name="live" className="inline-block h-3.5 w-4" /> LIVE
          </span>
          <span className={styles.imageLabel}>상품 이미지</span>
          <span className={styles.pagination}>1/3</span>
        </div>
        <section className={styles.summary} aria-label="프로젝트 정보">
          <p className={styles.seller}>판매자 정보</p>
          <h1>[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기</h1>
          <div className={styles.fundingNumbers}>
            <div>
              <p>
                <strong>10,000</strong> <span>% 달성</span>
              </p>
              <span className={styles.deadline}>D-28</span>
            </div>
            <div>
              <p>
                <b>2,000,000</b> <span className={styles.goal}>/10,000,000원</span>
              </p>
              <span className={styles.participants}>100명 참여</span>
            </div>
          </div>
          <section className={styles.aiSummary} aria-label="AI 프로젝트 요약">
            <div className={styles.aiHeading}>
              <h2>AI 프로젝트 요약</h2>
              <Information label="AI 프로젝트 요약 안내" />
            </div>
            {["프로젝트 요약", "프로젝트 요약", "라이브 요약(라이브 미 진행 시 생략)"].map(
              (title, i) => (
                <div className={styles.summaryItem} key={i}>
                  <h3>
                    <Image src="/icons/buyer-project/check.svg" width={12} height={12} alt="" />
                    {title}
                  </h3>
                  <p>뭐시기저시기</p>
                </div>
              ),
            )}
          </section>
        </section>
        <nav className={styles.tabs} aria-label="프로젝트 상세 탭">
          {tabs.map(([value, label]) => (
            <Link
              key={value}
              ref={value === activeTab ? selectedTab : undefined}
              href={`/projects/${encodeURIComponent(projectId)}?tab=${value}`}
              scroll={false}
              aria-current={value === activeTab ? "page" : undefined}
            >
              {label}
              {value !== "story" && value !== "refund-policy" && <small>000</small>}
            </Link>
          ))}
        </nav>
        {activeTab === "story" ? (
          <section className={styles.story} aria-label="상품 소개">
            <div className={styles.storyImage}>
              <Image
                src="/images/buyer-project/story.png"
                alt="CleanForge 무선 청소기 상품 소개 예시"
                fill
                sizes="(max-width: 390px) 112vw, 436px"
                unoptimized
              />
            </div>
            <p>예시 이미지로, 자세한 결과물은 AI측의 솔루션에 따라 바뀔 것 같습니다</p>
          </section>
        ) : (
          <div className={styles.liveContent}>
            <section aria-label="LIVE 다시 보기" className={styles.replays}>
              <h2>
                <DetailIcon name="replay" className="size-3.5" />
                LIVE 다시 보기 <small>3건</small>
              </h2>
              <VideoList onPlay={() => announce("영상 재생은 아직 연결되지 않은 목업입니다.")} />
              <VideoList
                clips
                onPlay={() => announce("영상 재생은 아직 연결되지 않은 목업입니다.")}
              />
            </section>
            <section className={styles.questions} aria-label="LIVE Q&A">
              <div className={styles.questionHeading}>
                <h2>
                  <DetailIcon name="question-filled" className="h-3.5 w-5" />
                  LIVE Q&amp;A <small>3건</small>
                </h2>
                <Information label="LIVE Q&A 안내" />
              </div>
              {[1, 2, 3].map((n) => (
                <article key={n}>
                  <h3>로보락이 뭐예요?</h3>
                  <p className={styles.date}>12건 · 09.07</p>
                  <div className={styles.answer}>
                    <p>무선 청소기 입니다.</p>
                    <p className={styles.date}>판매자 · 09.07</p>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </main>
      <footer className={styles.footer}>
        <button
          type="button"
          aria-label="프로젝트 찜"
          aria-pressed={liked}
          onClick={() => setLiked(!liked)}
        >
          <DetailIcon name="heart" className="h-3.5 w-6" />
          <span>{activeTab === "live-proof" ? "9999+" : 9999 + Number(liked)}</span>
        </button>
        {fundingAction}
      </footer>
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
