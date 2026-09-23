"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { BuyerDesktopHeader } from "@/shared/components/layout/buyer-desktop-header";
import { Avatar } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { Modal } from "@/shared/components/ui/modal";
import { desktopMessages, desktopProductDescription } from "../model/desktop-room-demo";
import { roomDemo } from "../model/room-demo";
import styles from "./buyer-live-desktop.module.css";

type Chapter = { time: string; title: string; label: string; progress: number };
type Question = { id?: string; title: string; answer: string; count?: number; answeredBy?: string };

function WatchIcon({
  name,
  className = "size-7",
}: {
  name:
    | "question"
    | "question-filled"
    | "share"
    | "heart"
    | "viewers"
    | "chat"
    | "chat-filled"
    | "chapters"
    | "chapters-filled"
    | "previous"
    | "next"
    | "play"
    | "pause";
  className?: string;
}) {
  const src = ["play", "pause", "previous", "next"].includes(name)
    ? `/images/buyer-live-replay/${name}.svg`
    : name === "viewers"
      ? "/icons/buyer-live/viewers.svg"
      : `/icons/${["question", "question-filled", "share", "heart"].includes(name) ? "buyer-live-room" : "buyer-live-replay"}/${name}.svg`;
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{ mask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

export function BuyerLiveDesktop({
  liveId,
  product = roomDemo,
  replay = false,
  clip = false,
  clipTitle = "[제품명] AI 생성 제목",
  clipBadge = "시연 영상",
  rewardSummary,
  questions,
  chapters,
  initialPanel,
  initialMessage = "",
  video,
  videoConnected = Boolean(video),
  demoMode = true,
  questionsState,
  onRefreshQuestions,
  progress: progressProp,
  onSeek,
  playing: playingProp,
  onTogglePlay,
  timeText,
  liked: likedProp,
  likeCount,
  onToggleLike,
  replayMessages,
}: {
  liveId: string;
  product?: typeof roomDemo;
  replay?: boolean;
  clip?: boolean;
  /** 쇼츠 제목·배지. 기본값은 Figma 예시 문구다(데모). */
  clipTitle?: string;
  clipBadge?: string;
  rewardSummary: ReactNode;
  questions: Question[];
  chapters: Chapter[];
  initialPanel?: "chat" | "chapters";
  initialMessage?: string;
  video?: ReactNode;
  videoConnected?: boolean;
  demoMode?: boolean;
  questionsState?: ReactNode;
  /* 진행바는 목업(0~100 고정값)과 실제 영상 둘 다를 그린다. onSeek를 주면 실제 영상이
     위치를 소유하고 이 컴포넌트는 표시만 한다. 주지 않으면 기존 목업 동작을 유지한다. */
  progress?: number;
  onSeek?: (progressPercent: number) => void;
  /** 실제 영상의 재생 여부·재생 전환과 재생바 시각. 주지 않으면 목업 상태를 쓴다. */
  playing?: boolean;
  onTogglePlay?: () => void;
  timeText?: { current: string; duration: string };
  liked?: boolean;
  likeCount?: number;
  onToggleLike?: () => void;
  /** 다시보기 구간 채팅. 주면 목업 채팅 대신 이 목록을 그린다. */
  replayMessages?: { id: string; author: string; text: string }[];
  onRefreshQuestions?: () => void;
}) {
  const [following, setFollowing] = useState(false);
  const [internalLiked, setInternalLiked] = useState(false);
  const liked = likedProp ?? internalLiked;
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [panel, setPanel] = useState(initialPanel ?? (clip ? "chapters" : "chat"));
  const [internalPlaying, setInternalPlaying] = useState(true);
  const playing = playingProp ?? internalPlaying;
  /* 실제 경로에서는 받아온 구간이 있을 때만 사이드 패널을 연다. 없으면 기존처럼 영상만 그린다. */
  const sidePanel = replay && chapters.length > 0;
  const [internalProgress, setInternalProgress] = useState(37.5);
  const progress = onSeek ? (progressProp ?? 0) : internalProgress;
  const selectedChapter = chapters.filter((chapter) => chapter.progress <= progress).length - 1;
  const [draft, setDraft] = useState(initialMessage);
  const [blocked, setBlocked] = useState(false);
  const [messages, setMessages] = useState(() =>
    demoMode ? desktopMessages.map((text, id) => ({ id, text, author: "아이디" })) : [],
  );
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chat = useRef<HTMLDivElement>(null);
  const chapterList = useRef<HTMLDivElement>(null);
  const playbackButton = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const errorId = useId();
  // Figma의 두 차단 예시만 재현하며 서버 금칙어 정책이 아니다.
  const invalid = /바보|멍청이/.test(draft);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [messages, panel]);
  useEffect(() => {
    const list = chapterList.current;
    const selected = list?.children[selectedChapter] as HTMLElement | undefined;
    if (list && selected)
      list.scrollTo({
        top: selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2,
        behavior: "smooth",
      });
  }, [selectedChapter, panel]);
  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    field.style.height = "20px";
    field.style.height = `${Math.min(field.scrollHeight, 60)}px`;
    if (mirror.current) mirror.current.scrollTop = field.scrollTop;
  }, [draft, panel]);

  function announce(text: string) {
    if (timer.current) clearTimeout(timer.current);
    setNotice(text);
    timer.current = text ? setTimeout(() => setNotice(""), 4000) : null;
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        new URL(`/live/${encodeURIComponent(liveId)}`, window.location.origin).href,
      );
      announce("라이브 링크를 복사했습니다.");
    } catch {
      announce("링크를 복사하지 못했습니다. 주소창의 링크를 복사해주세요.");
    }
  }
  function send() {
    if (!draft.trim()) return;
    if (invalid) {
      setBlocked(true);
      input.current?.focus();
      return;
    }
    setMessages((previous) => [
      ...previous,
      { id: previous.length, text: draft.trim(), author: "나" },
    ]);
    setDraft("");
    setBlocked(false);
    input.current?.focus();
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

  return (
    <div className={`${styles.screen} bg-layer-bg text-text-default min-h-dvh`}>
      <BuyerDesktopHeader exitHref="/live" />
      <main
        aria-label={`${replay ? (clip ? "숏 클립" : "라이브 다시보기") : "라이브 시청"}${demoMode ? " 목업" : ""}`}
        className="mx-auto grid w-full max-w-300 grid-cols-3 items-start gap-6 pt-10 pb-16"
      >
        {/* 실제 경로에는 판매자·상품 데이터가 없다. 숏 클립이면 Figma 위치(왼쪽 패널)에 제목만 그린다. */}
        {(demoMode || clip) && (
          <section
            aria-label="상품 정보"
            className="bg-layer-surface-default border-border-default h-[726px] rounded-sm border px-4 py-3"
          >
            {!demoMode && <h1 className="text-title-s mt-3">{clipTitle}</h1>}
            {demoMode && (
              <div className="flex gap-2">
                <Badge variant={replay ? "neutral" : "accent"}>
                  <Icon name={replay ? "calendar" : "funding"} className="size-4" />
                  {replay ? "09.07" : "000,000"}
                </Badge>
                <Badge variant={replay ? "neutral" : "accent"}>
                  <WatchIcon name="viewers" className="size-4" />
                  000,000
                </Badge>
              </div>
            )}
            {demoMode && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <Avatar size={32}>
                    <Image src={product.avatar} alt="" fill sizes="32px" className="object-cover" />
                  </Avatar>
                  <span className="text-body-s text-text-secondary">{product.seller}</span>
                  <Button
                    size="sm"
                    variant={following ? "primary" : "secondary"}
                    className="text-body-s! ml-auto h-9! px-3"
                    aria-pressed={following}
                    onClick={() => setFollowing(!following)}
                  >
                    {following ? "팔로잉" : "팔로우"}
                  </Button>
                </div>
                <h1 className="text-title-s mt-6">{clip ? clipTitle : product.title}</h1>
              </>
            )}
            {demoMode && (
              <>
                <h2 className="text-label-m text-text-secondary mt-6">상품 정보</h2>
                <div className="text-body-s mt-1 space-y-5">
                  {desktopProductDescription.map((text) => (
                    <p key={text}>{text}</p>
                  ))}
                </div>
              </>
            )}
          </section>
        )}
        <section
          aria-label={videoConnected ? "방송 영상" : "방송 영상 · 실제 재생 미연결"}
          /* Figma 3열(정보·영상·리워드와 타임라인)처럼 실제 경로도 영상을 가운데 열에 둔다. 정보 열이
             없어도 구간·채팅 패널이 영상 오른쪽 열에 오게 한다. */
          className={`text-text-static-white relative h-[725px] overflow-hidden rounded-sm bg-[black] ${demoMode || clip ? "" : "col-start-2"}`}
        >
          {video ? (
            /* 다시보기·쇼츠는 Figma처럼 16:9 재생 틀 대신 영역 높이를 채운다(가로 VOD·번인 자막이
               잘리지 않게 contain). 남는 여백은 흰 배지가 읽히도록 영역과 같은 검정으로 채운다. */
            <div
              className={`relative h-full w-full ${replay ? "[&>*]:aspect-auto [&>*]:h-full [&>*]:bg-[black]!" : ""}`}
            >
              {video}
            </div>
          ) : (
            <Image
              src="/images/buyer-live-room/desktop-poster.png"
              alt="라이브 방송 포스터"
              fill
              sizes="560px"
              className={styles.poster}
              priority
            />
          )}
          {/* 장식용 그라데이션이다. 영역 높이를 채우는 쇼츠의 재생 컨트롤 클릭을 막지 않게 통과시킨다. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-[rgba(0,0,0,0.5)] to-transparent" />
          {/* 실제 다시보기·쇼츠도 Figma 배지를 쓴다. 실제 라이브 시청은 기존대로 배지를 그리지 않는다. */}
          {(demoMode || replay) && (
            <Badge
              size="md"
              variant={replay && !clip ? "accent" : "primaryLive"}
              shape={replay ? "square" : "rounded"}
              className="absolute top-3 left-3 z-20"
            >
              {!replay && <Icon name="live" className="size-4" />}
              {replay ? (clip ? clipBadge : "다시보기") : "LIVE"}
            </Badge>
          )}
          {demoMode && clip && (
            <>
              <p className={styles.subtitle}>
                안녕하세요. 오늘은 로보락 F25를 직접 보면서, 왜 물걸레 청소기와 진공청소기를 하나로
              </p>
              <p className={styles.caption}>
                <strong>물걸레+진공</strong> 동시 청소
              </p>
            </>
          )}
          <div
            className={`absolute right-3 z-20 flex w-[58px] flex-col gap-3 ${replay ? "bottom-[106px]" : "bottom-8"}`}
          >
            <button
              type="button"
              className={styles.action}
              aria-haspopup="dialog"
              onClick={() => setQuestionsOpen(true)}
            >
              <WatchIcon name="question" />
              Q&amp;A
            </button>
            {replay && (demoMode || chapters.length > 0) ? (
              <>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={panel === "chat"}
                  onClick={() => setPanel("chat")}
                >
                  <WatchIcon name={panel === "chat" ? "chat-filled" : "chat"} />
                  채팅
                </button>
                <button
                  type="button"
                  className={styles.action}
                  aria-pressed={panel === "chapters"}
                  onClick={() => setPanel("chapters")}
                >
                  <WatchIcon name={panel === "chapters" ? "chapters-filled" : "chapters"} />
                  타임라인
                </button>
              </>
            ) : !replay ? (
              <>
                <button type="button" className={styles.action} onClick={share}>
                  <WatchIcon name="share" />
                  공유
                </button>
                {(demoMode || onToggleLike) && (
                  <button
                    type="button"
                    className={styles.action}
                    aria-label={liked ? "좋아요 취소" : "좋아요"}
                    aria-pressed={liked}
                    onClick={() => (onToggleLike ? onToggleLike() : setInternalLiked(!liked))}
                  >
                    <WatchIcon name="heart" />
                    {likeCount === undefined
                      ? liked
                        ? "2.4천+"
                        : "2.4천"
                      : likeCount.toLocaleString("ko-KR")}
                  </button>
                )}
              </>
            ) : null}
          </div>
          {/* Figma 재생바. 실제 경로(onSeek)는 영상이 위치·재생 여부를 소유하고 여기서는 표시·전환만
              한다. 첫 구간 전이거나 구간이 없으면(쇼츠) 이전·다음 구간 이동을 막는다. */}
          {replay && (demoMode || onSeek) && (
            <div className="absolute inset-x-5 bottom-10 z-20">
              <input
                className={styles.range}
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
              <div className="text-caption-s mt-2 flex items-center justify-between">
                <span>{timeText?.current ?? "00:00:00"}</span>
                <button
                  type="button"
                  aria-label="이전 구간"
                  className="flex size-8 items-center justify-center disabled:opacity-40"
                  disabled={selectedChapter <= 0}
                  onClick={() => moveChapter(selectedChapter - 1)}
                >
                  <WatchIcon name="previous" className="size-5" />
                </button>
                <button
                  type="button"
                  ref={playbackButton}
                  aria-label={playing ? "일시정지" : "재생"}
                  className="flex size-8 items-center justify-center"
                  onClick={() => (onTogglePlay ? onTogglePlay() : setInternalPlaying(!playing))}
                >
                  <WatchIcon name={playing ? "pause" : "play"} className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="다음 구간"
                  className="flex size-8 items-center justify-center disabled:opacity-40"
                  disabled={selectedChapter >= chapters.length - 1}
                  onClick={() => moveChapter(selectedChapter + 1)}
                >
                  <WatchIcon name="next" className="size-5" />
                </button>
                <span>{timeText?.duration ?? "00:00:00"}</span>
              </div>
            </div>
          )}
        </section>
        {(demoMode || sidePanel) && (
          <aside className="flex min-w-0 flex-col gap-4" aria-label="리워드와 방송 소통">
            {rewardSummary}
            {replay && (demoMode || chapters.length > 0) && panel === "chapters" ? (
              <div className="bg-layer-surface-default border-border-default h-[310px] min-h-0 rounded-sm border p-3">
                <div
                  ref={chapterList}
                  role="region"
                  aria-label="영상 구간 목록"
                  tabIndex={0}
                  className="relative flex h-full [scrollbar-gutter:stable] flex-col gap-2 overflow-y-scroll overscroll-contain pr-2"
                >
                  {chapters.map((chapter, index) => (
                    <button
                      key={chapter.time}
                      type="button"
                      aria-label={`구간 ${index + 1} 재생`}
                      aria-pressed={selectedChapter === index}
                      onClick={() => seek(chapter.progress)}
                      className="bg-layer-bg aria-pressed:bg-status-accent aria-pressed:border-border-primary-live text-body-s flex shrink-0 flex-col items-start gap-1 rounded-xs border border-transparent p-2 text-left"
                    >
                      <b
                        className={
                          selectedChapter === index
                            ? "text-text-primary-live"
                            : "text-text-secondary"
                        }
                      >
                        {chapter.time}
                      </b>
                      <span className="w-full truncate">{chapter.title}</span>
                      <Badge
                        variant={selectedChapter === index ? "primaryLive" : "neutral"}
                        className="mt-2"
                      >
                        {chapter.label}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <section
                aria-label={replay ? "다시보기 채팅" : "실시간 채팅"}
                className="bg-layer-surface-default border-border-default relative flex h-[310px] min-h-0 flex-col rounded-sm border"
              >
                {demoMode && (
                  <Badge variant="neutral" className="absolute top-3 right-3 z-10">
                    <Icon name="chat" className="size-4" />
                    53
                  </Badge>
                )}
                <div
                  ref={chat}
                  role="log"
                  aria-label="채팅 메시지"
                  aria-live="polite"
                  aria-relevant="additions"
                  tabIndex={0}
                  className="text-body-s flex min-h-0 flex-1 [scrollbar-width:thin] flex-col gap-3 overflow-y-auto overscroll-contain p-3"
                >
                  {(replayMessages ?? messages).map((message) => (
                    <p key={message.id} className="flex items-start gap-2">
                      <span className="text-label-m text-text-secondary mt-0.5 shrink-0">
                        {message.author}
                      </span>
                      <span className="min-w-0 wrap-anywhere whitespace-pre-wrap">
                        {message.text}
                      </span>
                    </p>
                  ))}
                  {/* 다시보기 채팅은 현재 구간 것만 온다. 비어 있으면 빈 상자 대신 이유를 적는다. */}
                  {replayMessages?.length === 0 && (
                    <p className="text-text-secondary m-auto text-center">
                      이 구간의 채팅이 없습니다.
                    </p>
                  )}
                </div>
                {demoMode && (
                  <form
                    className="border-layer-bg relative flex shrink-0 items-end gap-2 border-t-4 p-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      send();
                    }}
                  >
                    <div className={styles.inputBox}>
                      <div aria-hidden ref={mirror} className={styles.mirror}>
                        {draft.split(/(바보|멍청이)/g).map((part, index) => (
                          <span
                            key={index}
                            className={
                              /^(바보|멍청이)$/.test(part) ? "text-text-warning" : undefined
                            }
                          >
                            {part}
                          </span>
                        ))}
                        {"\n"}
                      </div>
                      <textarea
                        ref={input}
                        rows={1}
                        value={draft}
                        aria-label="메시지 입력"
                        placeholder="메시지 입력"
                        aria-invalid={blocked && invalid}
                        aria-describedby={blocked && invalid ? errorId : undefined}
                        onChange={(event) => {
                          setDraft(event.target.value);
                          setBlocked(false);
                        }}
                        onScroll={(event) => {
                          if (mirror.current)
                            mirror.current.scrollTop = event.currentTarget.scrollTop;
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            !event.shiftKey &&
                            !event.nativeEvent.isComposing &&
                            event.keyCode !== 229
                          ) {
                            event.preventDefault();
                            send();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="submit"
                      aria-label="메시지 전송"
                      disabled={!draft.trim()}
                      className="flex size-9 shrink-0 items-center justify-center rounded-xs disabled:opacity-40"
                    >
                      <span
                        aria-hidden
                        className="size-6 bg-current [mask:url(/icons/buyer-live-room/send.svg)_center/contain_no-repeat]"
                      />
                    </button>
                    {blocked && invalid && (
                      <p
                        id={errorId}
                        role="alert"
                        className="text-body-s text-text-static-white absolute right-11 bottom-[calc(100%+16px)] z-20 w-75 rounded-sm bg-[rgba(0,0,0,0.7)] px-3 py-3 text-center"
                      >
                        부적절한 단어가 포함되어 있어
                        <br />
                        메시지를 전송할 수 없습니다
                      </p>
                    )}
                  </form>
                )}
              </section>
            )}
          </aside>
        )}
      </main>
      <Modal
        open={questionsOpen}
        onClose={() => setQuestionsOpen(false)}
        title="Q&A"
        className={`${styles.questions} h-[672px]`}
      >
        <div className="mt-6 space-y-6 pr-2" role="region" aria-label="Q&A 질문 목록" tabIndex={0}>
          {onRefreshQuestions && (
            <button type="button" className="text-caption-s underline" onClick={onRefreshQuestions}>
              새로고침
            </button>
          )}
          {questionsState ??
            questions.map((question, index) => (
              <article key={question.id ?? question.title}>
                <div className="flex items-start gap-2">
                  <WatchIcon name="question-filled" className="mt-1 size-5" />
                  <h3 className="text-body-strong">{question.title}</h3>
                </div>
                <p className="text-label-m text-text-secondary mt-1 ml-7">
                  질문 {question.count ?? (index === 0 ? 12 : 11)}건
                </p>
                <div className="border-border-default text-body-s mt-2 rounded-xs border px-3 py-2">
                  <p>{question.answer}</p>
                  <p className="text-label-m text-text-secondary mt-1">
                    {question.answeredBy ?? "판매자"}
                  </p>
                </div>
              </article>
            ))}
        </div>
      </Modal>
      <p
        role="status"
        className={
          notice
            ? "text-body-s text-text-static-white fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-sm bg-[rgba(0,0,0,0.8)] px-4 py-3"
            : "sr-only"
        }
      >
        {notice}
      </p>
    </div>
  );
}
