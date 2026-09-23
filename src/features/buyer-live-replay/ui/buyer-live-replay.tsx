"use client";

import Image from "next/image";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import Link from "next/link";
import { Avatar } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { replayDemo, chapterDemos, messages } from "../model/replay-demo";
import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { Icon } from "@/shared/components/ui/icon";
import {
  LiveQuestionsSheet,
  type LiveQuestion,
  type QuestionSheetState,
} from "@/features/buyer-live-room/ui/live-questions-sheet";
import styles from "./buyer-live-replay.module.css";

type Chapter = { time: string; title: string; label: string; progress: number };

// UI 목업 진행률이며 영상 타임스탬프가 아니다. 구간을 받지 못했을 때만 쓴다.
const chapterStarts = [0, 50, 75, 90];
const demoChapters: Chapter[] = chapterDemos.map((chapter, index) => ({
  ...chapter,
  progress: chapterStarts[index],
}));
const demoMessages = messages.map((text, id) => ({ id, author: "아이디", text }));

function ReplayIcon({
  name,
  small = false,
}: {
  name:
    | "expand"
    | "question"
    | "heart"
    | "share"
    | "chat"
    | "chat-filled"
    | "chapters"
    | "chapters-filled"
    | "previous"
    | "next"
    | "pause"
    | "play"
    | "viewers";
  small?: boolean;
}) {
  const folder = ["expand", "question", "heart", "share"].includes(name)
    ? "buyer-live-room"
    : "buyer-live-replay";
  return (
    <span
      aria-hidden
      className={small ? styles.smallIcon : styles.icon}
      style={{
        maskImage: ["play", "pause", "previous", "next"].includes(name)
          ? `url(/images/buyer-live-replay/${name}.svg)`
          : `url(/icons/${name === "viewers" ? "buyer-live/viewers" : `${folder}/${name}`}.svg)`,
        maskSize: ["play", "pause"].includes(name) ? "contain" : undefined,
      }}
    />
  );
}

export function BuyerLiveReplay({
  liveId,
  projectId,
  rewardAction,
  product = replayDemo,
  clip = false,
  clipId,
  clipTitle = "[제품명] AI 생성 제목",
  clipBadge = "시연 영상",
  initialPanel = "chat",
  demoMode = true,
  video,
  chapters = demoChapters,
  progress: progressProp,
  onSeek,
  playing: playingProp,
  onTogglePlay,
  timeText,
  liked: likedProp,
  onToggleLike,
  replayMessages,
  questionsData,
  questionsState,
  onRefreshQuestions,
}: {
  liveId: string;
  projectId?: string;
  rewardAction?: ReactNode;
  product?: typeof replayDemo;
  clip?: boolean;
  /** 실제 쇼츠의 하이라이트 id. 공유 링크가 같은 쇼츠를 가리키게 한다. */
  clipId?: string;
  /** 쇼츠 제목·배지. 기본값은 Figma 예시 문구다(데모). */
  clipTitle?: string;
  clipBadge?: string;
  initialPanel?: "chat" | "chapters";
  /** 목업 전용 정보(가짜 지표·프로젝트 카드·자막)를 그릴지. 실제 경로는 false다. */
  demoMode?: boolean;
  /** 주면 포스터 대신 이 영상을 배경으로 그린다. */
  video?: ReactNode;
  chapters?: Chapter[];
  /* 진행바는 목업(0~100 고정값)과 실제 영상 둘 다를 그린다. onSeek를 주면 실제 영상이
     위치를 소유하고 이 컴포넌트는 표시만 한다. 주지 않으면 기존 목업 동작을 유지한다. */
  progress?: number;
  onSeek?: (progressPercent: number) => void;
  /** 실제 영상의 재생 여부·재생 전환과 재생바 시각. 주지 않으면 목업 상태를 쓴다. */
  playing?: boolean;
  onTogglePlay?: () => void;
  timeText?: { current: string; duration: string };
  liked?: boolean;
  /** 주면 숏 클립 좋아요를 바깥(방송 좋아요 API)으로 넘긴다. */
  onToggleLike?: () => void;
  /** 다시보기 구간 채팅. 주면 목업 채팅 대신 이 목록을 그린다. */
  replayMessages?: { id: string; author: string; text: string }[];
  /* 주면 Q&A가 시청과 같은 하단 시트로 실제 답변을 연다. 주지 않으면 기존 안내를 유지한다
     (모바일 데모는 #156에서 안내 동작을 유지하기로 한 화면이다). */
  questionsData?: LiveQuestion[];
  questionsState?: ReactNode;
  onRefreshQuestions?: () => void;
}) {
  const chapterDrag = useHorizontalDrag();
  const [panel, setPanel] = useState(initialPanel);
  const [following, setFollowing] = useState(false);
  const [internalLiked, setInternalLiked] = useState(false);
  const liked = likedProp ?? internalLiked;
  const [internalPlaying, setInternalPlaying] = useState(true);
  const playing = playingProp ?? internalPlaying;
  const [internalProgress, setInternalProgress] = useState(37.5);
  const progress = onSeek ? (progressProp ?? 0) : internalProgress;
  /* 실제 경로에서는 받아온 구간이 있을 때만 타임라인을 연다. 없으면 채팅만 그린다. */
  const timeline = demoMode || chapters.length > 0;
  const activePanel = timeline ? panel : "chat";
  const currentChapter = chapters.filter((chapter) => chapter.progress <= progress).length - 1;
  const [questionSheet, setQuestionSheet] = useState<QuestionSheetState>("closed");
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const chapterList = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLElement>(null);
  const playbackButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [activePanel, replayMessages]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const list = chapterList.current;
    const selected = list?.children[currentChapter] as HTMLElement | undefined;
    if (list && selected) {
      list.scrollTo({
        left: selected.offsetLeft - (list.clientWidth - selected.offsetWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [currentChapter, activePanel]);

  function announce(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(() => setNotice(""), 4000);
  }
  function seek(value: number) {
    if (onSeek) {
      onSeek(value);
      return;
    }
    setInternalProgress(value);
    setInternalPlaying(true);
  }
  function moveChapter(index: number) {
    if (index === 0 || index === chapters.length - 1) playbackButton.current?.focus();
    seek(chapters[index].progress);
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        new URL(
          `/live/${encodeURIComponent(liveId)}?mode=replay${clip ? "&view=clip" : ""}${clip && clipId ? `&clip=${encodeURIComponent(clipId)}` : ""}`,
          window.location.origin,
        ).href,
      );
      announce("링크를 복사했습니다.");
    } catch {
      announce("링크를 복사하지 못했습니다. 주소창의 링크를 복사해주세요.");
    }
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else announce("전체 화면을 지원하지 않는 환경입니다.");
    } catch {
      announce("전체 화면으로 전환하지 못했습니다.");
    }
  }

  return (
    <div ref={root} className={styles.screen} data-clip={clip}>
      {video ? (
        <div className={styles.video}>{video}</div>
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Image src={product.poster} alt="" fill sizes="566px" className={styles.poster} />
        </div>
      )}
      <header className={`${styles.header} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
        <h1>{clip ? clipTitle : product.title}</h1>
        <button type="button" aria-label="전체 화면 전환" onClick={fullscreen}>
          <ReplayIcon name="expand" />
        </button>
        <Link href="/live" aria-label="라이브 목록으로 나가기">
          <Icon name="close" className="size-5" />
        </Link>
      </header>
      <main aria-label={`${clip ? "숏 클립" : "라이브 다시보기"}${demoMode ? " 목업" : ""}`}>
        {/* 실제 경로에는 판매자·지표 데이터가 없다. 클립 뱃지만 남으면 그것만 그린다. */}
        {(demoMode || clip) && (
          <section className={styles.seller} aria-label="판매자 정보">
            {demoMode && (
              <div className={styles.sellerRow}>
                <div>
                  <Avatar size={32}>
                    <Image src={product.avatar} fill sizes="32px" alt="" className="object-cover" />
                  </Avatar>
                  <span className="[text-shadow:0_0_4px_rgba(0,0,0,0.3)]">{product.seller}</span>
                </div>
                <Button
                  size="sm"
                  variant={following ? "primary" : "secondary"}
                  className="text-body-s! px-3"
                  aria-pressed={following}
                  onClick={() => setFollowing(!following)}
                >
                  {following ? "팔로잉" : "팔로우"}
                </Button>
              </div>
            )}
            {clip ? (
              <Badge variant="neutral" className={styles.badge}>
                {clipBadge}
              </Badge>
            ) : (
              demoMode && (
                <div className={`${styles.metrics} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
                  <span>
                    <Icon name="funding" className="size-3.5" />
                    000,000
                  </span>
                  <span>
                    <ReplayIcon name="viewers" />
                    000,000
                  </span>
                </div>
              )
            )}
          </section>
        )}
        {clip && demoMode && (
          <>
            <p className={styles.subtitle}>
              안녕하세요. 오늘은 로보락 F25를 직접 보면서, 왜 물걸레 청소기와 진공청소기를 하나로
            </p>
            <p className={styles.caption}>
              <strong>물걸레+진공</strong> 동시 청소
            </p>
          </>
        )}
        {clip ? (
          <div className={`${styles.clipActions} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
            {(demoMode || onToggleLike) && (
              <button
                type="button"
                aria-pressed={liked}
                onClick={() => (onToggleLike ? onToggleLike() : setInternalLiked(!liked))}
              >
                <ReplayIcon name="heart" />
                좋아요
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                announce(
                  demoMode
                    ? "숏 클립 채팅은 아직 연결되지 않은 목업입니다."
                    : "숏 클립 채팅은 아직 제공되지 않습니다.",
                )
              }
            >
              <ReplayIcon name="chat" small />
              채팅
            </button>
            <button type="button" onClick={share}>
              <ReplayIcon name="share" />
              공유
            </button>
          </div>
        ) : (
          <div
            className={styles.bottom}
            style={{ visibility: questionSheet === "closed" ? "visible" : "hidden" }}
          >
            <div className={styles.contentRow}>
              <div className={styles.leftColumn}>
                {activePanel === "chat" && (
                  <section
                    ref={chat}
                    className={`${styles.chat} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}
                    aria-label="다시보기 채팅 기록"
                    tabIndex={0}
                  >
                    <div>
                      {(replayMessages ?? demoMessages).map((message) => (
                        <p key={message.id}>
                          <b>{message.author}</b>
                          <span>{message.text}</span>
                        </p>
                      ))}
                    </div>
                  </section>
                )}
                {demoMode && (
                  <section className={styles.project} aria-label="연결된 프로젝트 목업">
                    <div className="relative flex min-w-0 flex-1 gap-2 p-2">
                      <div className="relative size-[74px] shrink-0">
                        <Image
                          src={product.productImage}
                          alt=""
                          fill
                          sizes="74px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2>
                          {projectId ? (
                            <Link
                              href={`/projects/${encodeURIComponent(projectId)}?tab=story`}
                              className="after:absolute after:inset-0"
                              aria-label={`${product.title} 프로젝트 상세 보기`}
                            >
                              {product.title}
                            </Link>
                          ) : (
                            product.title
                          )}
                        </h2>
                        <p className="text-text-secondary mt-1 text-[12px] leading-[1.3] line-through">
                          219,000원
                        </p>
                        <p className="text-[14px] leading-[1.3] font-semibold">199,000원</p>
                      </div>
                    </div>
                    {rewardAction ?? (
                      <button
                        type="button"
                        className="bg-layer-surface-primary text-text-static-white self-stretch px-3 text-[12px] leading-[1.3] font-semibold"
                        aria-label="리워드 5개 이상 더보기"
                        onClick={() =>
                          announce(
                            "연결된 프로젝트 정보가 없는 목업입니다. 리워드 연결은 API 연동 후 제공됩니다.",
                          )
                        }
                      >
                        5+
                        <br />
                        더보기
                      </button>
                    )}
                  </section>
                )}
              </div>
              <div className={`${styles.actions} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
                <button
                  type="button"
                  aria-haspopup={questionsData ? "dialog" : undefined}
                  onClick={() =>
                    questionsData
                      ? setQuestionSheet("compact")
                      : announce("다시보기 Q&A는 아직 연결되지 않은 목업입니다.")
                  }
                >
                  <ReplayIcon name="question" />
                  Q&amp;A
                </button>
                <button
                  type="button"
                  aria-pressed={activePanel === "chat"}
                  onClick={() => setPanel("chat")}
                >
                  <ReplayIcon name={activePanel === "chat" ? "chat-filled" : "chat"} small />
                  채팅
                </button>
                {timeline && (
                  <button
                    type="button"
                    aria-pressed={activePanel === "chapters"}
                    onClick={() => setPanel("chapters")}
                  >
                    <ReplayIcon
                      name={activePanel === "chapters" ? "chapters-filled" : "chapters"}
                      small
                    />
                    타임라인
                  </button>
                )}
              </div>
            </div>
            {activePanel === "chapters" && (
              <div
                {...chapterDrag}
                ref={chapterList}
                className={styles.chapters}
                role="region"
                aria-label="영상 구간 목록"
                tabIndex={0}
              >
                {chapters.map((chapter, n) => (
                  <button
                    type="button"
                    key={n}
                    aria-label={`구간 ${n + 1} 재생`}
                    aria-pressed={currentChapter === n}
                    onClick={() => seek(chapter.progress)}
                  >
                    <span className="flex min-w-0 flex-1 flex-col items-start gap-3">
                      <span className="flex w-full flex-col gap-1">
                        <b>{chapter.time}</b>
                        <span className="text-body-s truncate font-medium">{chapter.title}</span>
                      </span>
                      <Badge
                        variant={currentChapter === n ? "neutral" : "live"}
                        className={currentChapter === n ? styles.badge : undefined}
                      >
                        {chapter.label}
                      </Badge>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {/* Figma 재생바. 실제 경로(onSeek)는 영상이 위치·재생 여부를 소유하고 여기서는 표시·전환만 한다.
                첫 구간 전이거나 구간이 없으면 이전·다음 구간 이동을 막는다. */}
            {(demoMode || onSeek) && (
              <div className={styles.playback}>
                <input
                  style={{ "--progress": `${progress}%` } as CSSProperties}
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  aria-label={demoMode ? "목업 재생 위치" : "재생 위치"}
                  aria-valuetext={
                    demoMode
                      ? `${progress}% · 실제 영상 미연결`
                      : `${timeText?.current ?? "00:00:00"} / ${timeText?.duration ?? "00:00:00"}`
                  }
                  onChange={(event) => seek(Number(event.target.value))}
                />
                <div className={styles.controls}>
                  <span>{timeText?.current ?? "00:00:00"}</span>
                  <div>
                    <button
                      type="button"
                      aria-label="이전 구간"
                      disabled={currentChapter <= 0}
                      onClick={() => moveChapter(currentChapter - 1)}
                    >
                      <ReplayIcon name="previous" small />
                    </button>
                    <button
                      type="button"
                      aria-label={playing ? "일시정지" : "재생"}
                      ref={playbackButton}
                      onClick={() => (onTogglePlay ? onTogglePlay() : setInternalPlaying(!playing))}
                    >
                      <ReplayIcon name={playing ? "pause" : "play"} small />
                    </button>
                    <button
                      type="button"
                      aria-label="다음 구간"
                      disabled={currentChapter >= chapters.length - 1}
                      onClick={() => moveChapter(currentChapter + 1)}
                    >
                      <ReplayIcon name="next" small />
                    </button>
                  </div>
                  <span>{timeText?.duration ?? "00:00:00"}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      {/* 클립 레일에는 Q&A 버튼이 없어 열 수 없다. 시트도 그리지 않는다. */}
      {!clip && questionsData && (
        <LiveQuestionsSheet
          state={questionSheet}
          onStateChange={setQuestionSheet}
          questions={questionsData}
          questionsState={questionsState}
          onRefresh={onRefreshQuestions}
          demoMode={demoMode}
        />
      )}
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
