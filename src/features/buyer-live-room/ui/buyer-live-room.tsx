"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { roomDemo, roomQuestions, sampleMessages } from "../model/room-demo";
import type { LiveSeller } from "../model/live-seller";
import { LiveQuestionsSheet, type LiveQuestion } from "./live-questions-sheet";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-live-room.module.css";
import { RoomIcon } from "./room-icon";

type BuyerLiveRoomProps = {
  liveId: string;
  projectId?: string;
  rewardAction?: ReactNode;
  product?: typeof roomDemo;
  initialChatExpanded?: boolean;
  initialQuestions?: "closed" | "compact" | "expanded";
  initialMessage?: string;
  video?: ReactNode;
  questionsData?: LiveQuestion[];
  questionsState?: ReactNode;
  demoMode?: boolean;
  onRefreshQuestions?: () => void;
  liked?: boolean;
  likeCount?: number;
  /** 주면 실제 경로에서도 좋아요 버튼을 노출하고 서버에 보낸다. */
  onToggleLike?: () => void;
  /** 실제 경로의 판매자 행. 주면 목업 판매자 대신 그린다. 주지 않으면 목업에서만 판매자 행을 그린다. */
  seller?: LiveSeller;
};

export function BuyerLiveRoom({
  liveId,
  projectId,
  rewardAction,
  product = roomDemo,
  initialChatExpanded = false,
  initialQuestions = "closed",
  initialMessage = "",
  video,
  questionsData = roomQuestions,
  questionsState,
  demoMode = true,
  onRefreshQuestions,
  liked: likedProp,
  likeCount,
  onToggleLike,
  seller,
}: BuyerLiveRoomProps) {
  const [internalFollowing, setInternalFollowing] = useState(false);
  const following = seller ? seller.following : internalFollowing;
  const onToggleFollow = seller
    ? seller.onToggleFollow
    : () => setInternalFollowing(!internalFollowing);
  const [internalLiked, setInternalLiked] = useState(false);
  const liked = likedProp ?? internalLiked;
  const [chatExpanded, setChatExpanded] = useState(initialChatExpanded);
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState(initialMessage);
  const [messages, setMessages] = useState(() =>
    demoMode
      ? Array.from({ length: 15 }, (_, index) => ({
          id: index,
          author: "아이디",
          text: sampleMessages[index % sampleMessages.length],
        }))
      : [],
  );
  const [notice, setNoticeValue] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blocked, setBlocked] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const chatPointerStart = useRef<{ x: number; y: number } | null>(null);
  const chatId = useId();
  const errorId = useId();
  // Figma의 차단 예시만 재현한다. 실제 금칙어 정책이나 서버 검증이 아니다.
  const invalid = draft.includes("바보");

  function setNotice(message: string) {
    if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    setNoticeValue(message);
    noticeTimer.current = message ? setTimeout(() => setNoticeValue(""), 4000) : null;
  }

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) clearTimeout(noticeTimer.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    field.style.height = "24px";
    field.style.height = `${Math.min(field.scrollHeight, 72)}px`;
    if (mirror.current) mirror.current.scrollTop = field.scrollTop;
  }, [draft]);

  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [messages, chatExpanded]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateViewport = () => {
      root.current?.style.setProperty("--room-height", `${viewport.height}px`);
      root.current?.style.setProperty("--room-top", `${viewport.offsetTop}px`);
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
    };
  }, []);

  async function share() {
    try {
      await navigator.clipboard.writeText(
        new URL(`/live/${encodeURIComponent(liveId)}`, window.location.origin).href,
      );
      setNotice("라이브 링크를 복사했습니다.");
    } catch {
      setNotice("링크를 복사하지 못했습니다. 주소창의 링크를 복사해주세요.");
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (root.current?.requestFullscreen) await root.current.requestFullscreen();
      else setNotice("이 브라우저는 전체 화면을 지원하지 않습니다.");
    } catch {
      setNotice("전체 화면으로 전환하지 못했습니다.");
    }
  }

  function sendMessage() {
    if (!draft.trim()) return;
    if (invalid) {
      setNotice("");
      setBlocked(true);
      input.current?.focus();
      return;
    }
    setMessages((previous) => [
      ...previous,
      { id: previous.length, author: "나", text: draft.trim() },
    ]);
    setDraft("");
    setBlocked(false);
    setNotice("목업 메시지를 전송했습니다.");
    input.current?.focus();
  }

  return (
    <div ref={root} className={styles.room}>
      {demoMode && (
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <Image src={product.poster} alt="" fill sizes="566px" className={styles.poster} />
        </div>
      )}
      <header className={`${styles.header} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
        <h1>{product.title}</h1>
        <button type="button" onClick={toggleFullscreen} aria-label="라이브 전체 화면">
          <RoomIcon name="expand" className="size-5" />
        </button>
        <Link href="/live" aria-label="라이브 나가기">
          <Icon name="close" className="inline-block size-5" />
        </Link>
      </header>
      <main className={styles.main}>
        <section aria-label="판매자와 라이브 현황" className={styles.seller}>
          {(demoMode || seller) && (
            <div className={styles.sellerRow}>
              {/* 실제 판매자 프로필 이미지는 BE 응답에 없어 기본 아바타를 그린다. */}
              <Avatar size={32}>
                {seller ? undefined : (
                  <Image src={product.avatar} alt="" fill sizes="32px" className="object-cover" />
                )}
              </Avatar>
              <span className="min-w-0 truncate [text-shadow:0_0_4px_rgba(0,0,0,0.3)]">
                {seller?.name ?? product.seller}
              </span>
              {onToggleFollow && (
                /* Figma 1408:42133 button secondary/XS: 높이 28, 좌우 12px, Caption/Medium_13. */
                <Button
                  size="sm"
                  variant={following ? "primary" : "secondary"}
                  className="text-caption-s! ml-auto px-3 font-medium"
                  aria-pressed={following}
                  onClick={onToggleFollow}
                >
                  {following ? "팔로잉" : "팔로우"}
                </Button>
              )}
            </div>
          )}
          {demoMode && (
            <div className={`${styles.metrics} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
              <span aria-label="펀딩 수치 목업">
                <Icon name="funding" className="inline-block size-3.5" />
                000,000
              </span>
              <span aria-label="시청자 수 목업">
                <RoomIcon name="viewers" className="size-3.5" />
                000,000
              </span>
            </div>
          )}
        </section>
        <div
          className={styles.video}
          role={video ? undefined : "img"}
          aria-label={video ? "라이브 영상" : "라이브 영상 영역 · 실제 송출 미연결"}
        >
          {video}
        </div>
        <div
          className={styles.controls}
          style={{ visibility: questions === "closed" ? "visible" : "hidden" }}
        >
          <div className={styles.contentRow}>
            <div className={styles.contentColumn}>
              <div className="relative">
                <button
                  type="button"
                  className="sr-only absolute top-0 right-0 focus:not-sr-only"
                  aria-controls={chatId}
                  aria-expanded={chatExpanded}
                  onClick={() => setChatExpanded(!chatExpanded)}
                >
                  {chatExpanded ? "채팅 축소" : "채팅 확대"}
                </button>
                <div
                  ref={chat}
                  id={chatId}
                  role="log"
                  aria-label="라이브 채팅 메시지"
                  aria-live="polite"
                  aria-relevant="additions"
                  tabIndex={0}
                  className={`${styles.chat} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}
                  data-expanded={chatExpanded}
                  onPointerDown={(event) => {
                    chatPointerStart.current =
                      event.isPrimary && event.button === 0
                        ? { x: event.clientX, y: event.clientY }
                        : null;
                  }}
                  onPointerUp={(event) => {
                    const start = chatPointerStart.current;
                    chatPointerStart.current = null;
                    if (
                      start &&
                      Math.hypot(event.clientX - start.x, event.clientY - start.y) < 5 &&
                      !window.getSelection()?.toString()
                    )
                      setChatExpanded((previous) => !previous);
                  }}
                  onPointerCancel={() => {
                    chatPointerStart.current = null;
                  }}
                >
                  {messages.map((message) => (
                    <span key={message.id} className={styles.message}>
                      <strong>{message.author}</strong>
                      <span>{message.text}</span>
                    </span>
                  ))}
                </div>
              </div>
              {demoMode && (
                <article className={styles.product}>
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
                        setNotice(
                          "연결된 프로젝트 정보가 없는 목업입니다. 리워드 연결은 API 연동 후 제공됩니다.",
                        )
                      }
                    >
                      5+
                      <br />
                      더보기
                    </button>
                  )}
                </article>
              )}
            </div>
            <div className={`${styles.actions} drop-shadow-[0_0_2px_rgba(0,0,0,0.3)]`}>
              <button type="button" aria-haspopup="dialog" onClick={() => setQuestions("compact")}>
                <RoomIcon name="question" />
                <span>Q&amp;A</span>
              </button>
              <button type="button" onClick={share}>
                <RoomIcon name="share" />
                <span>공유</span>
              </button>
              {(demoMode || onToggleLike) && (
                <button
                  type="button"
                  aria-pressed={liked}
                  aria-label={liked ? "좋아요 취소" : "좋아요"}
                  onClick={() => (onToggleLike ? onToggleLike() : setInternalLiked(!liked))}
                >
                  <RoomIcon name="heart" />
                  <span>
                    {likeCount === undefined
                      ? liked
                        ? "좋아요 취소"
                        : "좋아요"
                      : likeCount.toLocaleString("ko-KR")}
                  </span>
                </button>
              )}
            </div>
          </div>
          {demoMode ? (
            <form
              className={styles.composer}
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              <div className={styles.inputBox}>
                <div ref={mirror} aria-hidden className={styles.inputMirror}>
                  {draft.split(/(바보)/g).map((part, index) => (
                    <span key={index} className={part === "바보" ? styles.warning : undefined}>
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
                    setNotice("");
                  }}
                  onFocus={() => setChatExpanded(false)}
                  onScroll={(event) => {
                    if (mirror.current) mirror.current.scrollTop = event.currentTarget.scrollTop;
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing &&
                      event.keyCode !== 229
                    ) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              <button
                className={styles.send}
                type="submit"
                aria-label="메시지 전송"
                disabled={!draft.trim()}
              >
                <Icon name="send" className="inline-block size-6" />
              </button>
            </form>
          ) : (
            <p className={styles.composer} role="status">
              실시간 채팅 작성은 아직 제공하지 않습니다.
            </p>
          )}
          {blocked && invalid && (
            <p id={errorId} role="alert" className={styles.toast}>
              부적절한 단어가 포함되어 있어
              <br />
              메시지를 전송할 수 없습니다
            </p>
          )}
        </div>
      </main>
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
      <LiveQuestionsSheet
        state={questions}
        onStateChange={setQuestions}
        questions={questionsData}
        questionsState={questionsState}
        onRefresh={onRefreshQuestions}
        demoMode={demoMode}
      />
    </div>
  );
}
