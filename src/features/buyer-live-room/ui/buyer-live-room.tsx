"use client";

import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { roomDemo, roomQuestions, sampleMessages, type LiveProduct } from "../model/room-demo";
import { liveChatFailedNotice, type LiveChat, type LiveChatMessage } from "../model/live-chat";
import type { LiveSeller } from "../model/live-seller";
import { LiveProductSummary } from "./live-product-summary";
import { LiveQuestionsSheet, type LiveQuestion } from "./live-questions-sheet";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import { compactCount } from "@/shared/lib/compact-count";
import styles from "./buyer-live-room.module.css";
import { RoomIcon } from "./room-icon";

type BuyerLiveRoomProps = {
  liveId: string;
  /** 연결 프로젝트. 주면 실제 경로에서도 상품 카드를 그리고 카드 본문이 프로젝트 상세로 간다(#555). */
  projectId?: string;
  rewardAction?: ReactNode;
  product?: LiveProduct;
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
  /** 실제 LIVE 채팅. 주면 목업 채팅 대신 이 목록과 입력을 그린다. */
  liveChat?: LiveChat;
  /** 나가기 목적지. 홈에서 들어온 방송은 홈(`/`)이다(#526). */
  exitHref?: string;
  /**
   * 실제 방송 영상의 소리 켜기·끄기. 주면 오른쪽 버튼 열 맨 위에 소리 버튼을 그린다(#549). 모바일 시청 화면은 기본
   * 컨트롤이 없어, 브라우저가 소리를 막아 음소거로 자동 재생되면 이 버튼으로 켠다.
   */
  sound?: { muted: boolean; onToggle: () => void };
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
  liveChat,
  exitHref = "/live",
  sound,
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
  /* 실제 채팅: 서버가 메시지 검토에서 거절(IVS 406)했는지, 보낸 메시지를 기다리는 중인지. */
  const [rejected, setRejected] = useState(false);
  const [sending, setSending] = useState(false);
  /* 대기 표시는 다음 렌더에 반영된다. 그 사이 Enter를 두 번 누르면 같은 메시지가 두 번 나간다. */
  const sendingRef = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLDivElement>(null);
  const chatPointerStart = useRef<{ x: number; y: number } | null>(null);
  const chatId = useId();
  const errorId = useId();
  // Figma의 차단 예시만 재현한다. 실제 금칙어 정책이나 서버 검증이 아니다. 실제 채팅은 서버가 거절한다.
  const invalid = !liveChat && draft.includes("바보");
  const showBlocked = (blocked && invalid) || rejected;
  const chatMessages: (
    LiveChatMessage | { id: number; author: string; text: string; ai?: never }
  )[] = liveChat?.messages ?? messages;

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
  }, [chatMessages, chatExpanded]);

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

  /* 서버가 같은 메시지를 되돌려줄 때까지 입력을 지우지 않는다. 기다리는 동안 고쳐 쓴 글은 지우지 않는다. */
  async function sendLiveMessage(live: LiveChat, text: string) {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    const result = await live.onSend(text);
    sendingRef.current = false;
    setSending(false);
    if (result === "sent") setDraft((current) => (current.trim() === text ? "" : current));
    else if (result === "rejected") {
      setNotice("");
      setRejected(true);
    } else setNotice(liveChatFailedNotice);
    input.current?.focus();
  }

  function sendMessage() {
    if (!draft.trim()) return;
    if (liveChat) {
      void sendLiveMessage(liveChat, draft.trim());
      return;
    }
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
        <Link href={exitHref} aria-label="라이브 나가기">
          <Icon name="close" className="inline-block size-5" />
        </Link>
      </header>
      {video && (
        /* Figma 방송 화면(1408:42074)처럼 실제 영상도 목업 포스터 자리인 방 전체 뒤에 깔고 헤더·판매자·채팅을
           그 위에 겹친다(#497). */
        <section aria-label="라이브 영상" className={styles.videoLayer}>
          {video}
        </section>
      )}
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
                /* Figma 1408:42133 button secondary/XS: 높이 28, 좌우 12px, Caption/Medium_13. 팔로우·팔로잉은
                   디졸브 없이 바로 바뀐다(디자인 QA, #526). 공용 Button의 전환 시간만 0으로 끈다. */
                <Button
                  size="sm"
                  variant={following ? "primary" : "secondary"}
                  className="text-caption-s! ml-auto px-3 font-medium duration-0"
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
        {/* 실제 영상이 있으면 이 칸은 뒤에 깐 영상이 드러나는 빈 곳이다. */}
        <div
          className={styles.video}
          role={video ? undefined : "img"}
          aria-label={video ? undefined : "라이브 영상 영역 · 실제 송출 미연결"}
        />
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
                  {chatMessages.map((message) => (
                    <span
                      key={message.id}
                      className={styles.message}
                      data-ai={message.ai || undefined}
                    >
                      <strong>{message.author}</strong>
                      <span>{message.text}</span>
                    </span>
                  ))}
                </div>
              </div>
              {(demoMode || projectId) && (
                <article className={styles.product}>
                  <LiveProductSummary product={product} projectId={projectId} />
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
              {sound && (
                /* Figma에 없는 버튼이라 옆 버튼과 같은 아이콘+라벨 모양으로 둔다(FE 자체 판단, #549). 아이콘은
                   지금 상태(음소거면 X 스피커)이고 라벨도 상태를 적는다. 음량은 기기 버튼이 맡는다 — iOS는 웹에서
                   음량을 바꿀 수 없다. */
                <button
                  type="button"
                  aria-label={sound.muted ? "소리 켜기" : "소리 끄기"}
                  onClick={sound.onToggle}
                >
                  <RoomIcon name={sound.muted ? "sound-off" : "sound-on"} />
                  <span>{sound.muted ? "음소거" : "소리"}</span>
                </button>
              )}
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
                  {/* 누르면 채운 heart이고 선택 색은 아이콘에만 쓴다. 라벨은 전체 좋아요 수다(목업은
                      Figma 데스크톱 예시 "2.4천", 디자인 QA #526). */}
                  <RoomIcon name={liked ? "heart-filled" : "heart"} />
                  <span>{likeCount === undefined ? "2.4천" : compactCount(likeCount)}</span>
                </button>
              )}
            </div>
          </div>
          {(demoMode || liveChat) && (
            <form
              className={styles.composer}
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
            >
              {liveChat?.onRequireLogin ? (
                /* 비로그인은 좋아요·팔로우처럼 로그인으로 보내고 끝나면 이 화면으로 돌아온다. */
                <button
                  type="button"
                  className={`${styles.inputBox} ${styles.loginPrompt}`}
                  aria-label="로그인하고 메시지 입력"
                  onClick={liveChat.onRequireLogin}
                >
                  메시지 입력
                </button>
              ) : (
                <div className={styles.inputBox}>
                  <div ref={mirror} aria-hidden className={styles.inputMirror}>
                    {(liveChat ? [draft] : draft.split(/(바보)/g)).map((part, index) => (
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
                    maxLength={liveChat?.maxLength}
                    aria-invalid={showBlocked}
                    aria-describedby={showBlocked ? errorId : undefined}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setBlocked(false);
                      setRejected(false);
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
              )}
              <button
                className={styles.send}
                type="submit"
                aria-label="메시지 전송"
                disabled={!draft.trim() || sending}
              >
                <Icon name="send" className="inline-block size-6" />
              </button>
            </form>
          )}
          {showBlocked && (
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
