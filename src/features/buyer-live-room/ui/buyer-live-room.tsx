"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { DialogBase } from "@/shared/components/ui/dialog-base";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-live-room.module.css";

const sampleMessages = [
  "할인 있나요?",
  "나도 이번에 무선 청소기 사볼까~",
  "나도 이번에 무선 청소기 사볼까~",
  "로보락이 뭐예요?",
  "로보락이 뭐예요?",
];
const projectTitle =
  "프로젝트 제목 로보락F25 등 프로젝트 제목 로보락F25 등 프로젝트 제목 로보락F25 등";

function RoomIcon({
  name,
  className = "size-7",
}: {
  name: "expand" | "question" | "question-filled" | "share" | "heart" | "viewers";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(/icons/${name === "viewers" ? "buyer-live/viewers" : `buyer-live-room/${name}`}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}

type BuyerLiveRoomProps = {
  liveId: string;
  initialChatExpanded?: boolean;
  initialQuestions?: "closed" | "compact" | "expanded";
  initialMessage?: string;
};

export function BuyerLiveRoom({
  liveId,
  initialChatExpanded = false,
  initialQuestions = "closed",
  initialMessage = "",
}: BuyerLiveRoomProps) {
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(initialChatExpanded);
  const [questions, setQuestions] = useState(initialQuestions);
  const [draft, setDraft] = useState(initialMessage);
  const [messages, setMessages] = useState(() =>
    Array.from({ length: 15 }, (_, index) => ({
      id: index,
      author: "아이디",
      text: sampleMessages[index % sampleMessages.length],
    })),
  );
  const [notice, setNotice] = useState("");
  const [blocked, setBlocked] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLButtonElement>(null);
  const questionDragY = useRef<number | null>(null);
  const questionStartHeight = useRef(0);
  const [questionHeight, setQuestionHeight] = useState<number>();
  const questionDragged = useRef(false);
  const errorId = useId();
  const questionsId = useId();
  // Figma의 차단 예시만 재현한다. 실제 금칙어 정책이나 서버 검증이 아니다.
  const invalid = draft.includes("바보");

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
      <header className={styles.header}>
        <h1>라이브명(프로젝트 제목)</h1>
        <button type="button" onClick={toggleFullscreen} aria-label="라이브 전체 화면">
          <RoomIcon name="expand" className="size-5" />
        </button>
        <Link href="/live" aria-label="라이브 나가기">
          <Icon name="close" className="inline-block size-5" />
        </Link>
      </header>
      <main className={styles.main}>
        <section aria-label="판매자와 라이브 현황" className={styles.seller}>
          <div className={styles.sellerRow}>
            <span className={styles.avatar} aria-hidden />
            <span>판매자</span>
            <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)}>
              {following ? "팔로잉" : "팔로우"}
            </button>
          </div>
          <div className={styles.metrics}>
            <span aria-label="펀딩 수치 목업">
              <Icon name="funding" className="inline-block size-3.5" />
              000,000
            </span>
            <span aria-label="시청자 수 목업">
              <RoomIcon name="viewers" className="size-3.5" />
              000,000
            </span>
          </div>
        </section>
        <div className={styles.video} role="img" aria-label="라이브 영상 영역 · 실제 송출 미연결" />
        <div
          className={styles.controls}
          style={{ visibility: questions === "closed" ? "visible" : "hidden" }}
        >
          <div className={styles.contentRow}>
            <div className={styles.contentColumn}>
              <button
                ref={chat}
                type="button"
                className={styles.chat}
                data-expanded={chatExpanded}
                aria-label={chatExpanded ? "채팅 축소" : "채팅 확대"}
                aria-expanded={chatExpanded}
                onClick={() => setChatExpanded(!chatExpanded)}
              >
                {messages.map((message) => (
                  <span key={message.id} className={styles.message}>
                    <strong>{message.author}</strong>
                    <span>{message.text}</span>
                  </span>
                ))}
              </button>
              <article className={styles.product}>
                <span aria-hidden className={styles.productImage} />
                <div>
                  <h2>{projectTitle}</h2>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice(
                        "연결된 프로젝트 정보가 없는 목업입니다. 펀딩 연결은 API 연동 후 제공됩니다.",
                      )
                    }
                  >
                    펀딩하기
                  </button>
                </div>
              </article>
            </div>
            <div className={styles.actions}>
              <button type="button" aria-haspopup="dialog" onClick={() => setQuestions("compact")}>
                <RoomIcon name="question" />
                <span>Q&amp;A</span>
              </button>
              <button type="button" onClick={share}>
                <RoomIcon name="share" />
                <span>공유</span>
              </button>
              <button type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>
                <RoomIcon name="heart" />
                <span>{liked ? "좋아요 취소" : "좋아요"}</span>
              </button>
            </div>
          </div>
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
      <DialogBase
        open={questions !== "closed"}
        onClose={() => {
          setQuestions("closed");
          setQuestionHeight(undefined);
          questionDragY.current = null;
        }}
        aria-labelledby={questionsId}
        style={{ height: questionHeight }}
        className={`${styles.questions} ${questions === "expanded" ? styles.questionsExpanded : ""}`}
      >
        <div className={styles.questionContent}>
          <h2 id={questionsId}>
            <button
              type="button"
              aria-label={questions === "expanded" ? "Q&A 축소" : "Q&A 확대"}
              aria-expanded={questions === "expanded"}
              onClick={() => {
                if (questionDragged.current) {
                  questionDragged.current = false;
                  return;
                }
                setQuestions(questions === "expanded" ? "compact" : "expanded");
              }}
              onPointerDown={(event) => {
                if (event.button !== 0 || !event.isPrimary) return;
                questionDragged.current = false;
                questionDragY.current = event.clientY;
                questionStartHeight.current = event.currentTarget
                  .closest("dialog")!
                  .getBoundingClientRect().height;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (questionDragY.current === null) return;
                const delta = questionDragY.current - event.clientY;
                if (Math.abs(delta) > 5) questionDragged.current = true;
                const maximum = window.innerHeight - 64;
                setQuestionHeight(
                  Math.max(
                    Math.min(329, maximum),
                    Math.min(maximum, questionStartHeight.current + delta),
                  ),
                );
              }}
              onPointerUp={(event) => {
                if (
                  questionDragY.current !== null &&
                  Math.abs(event.clientY - questionDragY.current) > 30
                ) {
                  questionDragged.current = true;
                  setQuestions(event.clientY < questionDragY.current ? "expanded" : "compact");
                }
                questionDragY.current = null;
                setQuestionHeight(undefined);
              }}
              onPointerCancel={() => {
                questionDragY.current = null;
                questionDragged.current = false;
                setQuestionHeight(undefined);
              }}
            >
              Q&amp;A
            </button>
          </h2>
          <button
            type="button"
            className="sr-only focus:not-sr-only"
            onClick={() => setQuestions("closed")}
          >
            Q&amp;A 닫기
          </button>
          <div
            className={styles.questionList}
            tabIndex={0}
            role="region"
            aria-label="Q&A 질문 목록"
          >
            {Array.from({ length: 4 }, (_, index) => (
              <article key={index}>
                <div className={styles.questionTitle}>
                  <RoomIcon name="question-filled" className="size-5" />
                  <h3>로보락이 뭐예요?</h3>
                </div>
                <p className={styles.questionCount}>질문 12건</p>
                <div className={styles.answer}>
                  <p>무선 청소기 입니다.</p>
                  <p>판매자 · 1분 전</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </DialogBase>
    </div>
  );
}
