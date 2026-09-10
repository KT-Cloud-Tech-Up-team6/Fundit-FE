"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./buyer-live-replay.module.css";

const messages = [
  "할인 있나요?",
  "할인 있나요?",
  "나도 이번에 무선 청소기 사볼까~",
  "나도 이번에 무선 청소기 사볼까~",
  "로보락이 뭐예요?",
  "로보락이 뭐예요?",
];
const title = "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기";
// 원본의 37.5% 진행률이 첫 구간에 속하도록 설정한 목업 시작점이다.
const chapterStarts = [0, 50, 75, 90];
const projectTitle =
  "프로젝트 제목 로보락F25 등 프로젝트 제목 로보락F25 등 프로젝트 제목 로보락F25 등";

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
        maskImage: `url(/icons/${name === "viewers" ? "buyer-live/viewers" : `${folder}/${name}`}.svg)`,
      }}
    />
  );
}

export function BuyerLiveReplay({
  liveId,
  clip = false,
  initialPanel = "chat",
}: {
  liveId: string;
  clip?: boolean;
  initialPanel?: "chat" | "chapters";
}) {
  const [panel, setPanel] = useState(initialPanel);
  const [following, setFollowing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(37.5);
  const currentChapter = chapterStarts.filter((start) => start <= progress).length - 1;
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const chapters = useRef<HTMLDivElement>(null);
  const chat = useRef<HTMLElement>(null);

  useEffect(() => {
    if (chat.current) chat.current.scrollTop = chat.current.scrollHeight;
  }, [panel]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const list = chapters.current;
    const selected = list?.children[currentChapter] as HTMLElement | undefined;
    if (list && selected)
      list.scrollTo({ left: selected.offsetLeft - list.offsetLeft, behavior: "smooth" });
  }, [currentChapter, panel]);

  function announce(message: string) {
    if (timer.current) clearTimeout(timer.current);
    setNotice(message);
    timer.current = setTimeout(() => setNotice(""), 4000);
  }
  function seek(value: number) {
    setProgress(value);
    setPlaying(true);
  }
  async function share() {
    try {
      await navigator.clipboard.writeText(
        new URL(
          `/live/${encodeURIComponent(liveId)}?mode=replay${clip ? "&view=clip" : ""}`,
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
    <div ref={root} className={styles.screen}>
      <header className={styles.header}>
        <h1>{title}</h1>
        <button type="button" aria-label="전체 화면 전환" onClick={fullscreen}>
          <ReplayIcon name="expand" />
        </button>
        <Link href="/live" aria-label="라이브 목록으로 나가기">
          <Icon name="close" className="size-5" />
        </Link>
      </header>
      <main aria-label={clip ? "숏 클립 목업" : "라이브 다시보기 목업"}>
        <section className={styles.seller} aria-label="판매자 정보">
          <div className={styles.sellerRow}>
            <div>
              <Image src="/icons/buyer-live-replay/avatar.svg" width={32} height={32} alt="" />
              <span>판매자</span>
            </div>
            <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)}>
              {following ? "팔로잉" : "팔로우"}
            </button>
          </div>
          {clip ? (
            <span className={styles.badge}>시연 영상</span>
          ) : (
            <div className={styles.metrics}>
              <span>
                <Icon name="funding" className="size-3.5" />
                000,000
              </span>
              <span>
                <ReplayIcon name="viewers" />
                000,000
              </span>
            </div>
          )}
        </section>
        {clip ? (
          <div className={styles.clipActions}>
            <button type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>
              <ReplayIcon name="heart" />
              좋아요
            </button>
            <button
              type="button"
              onClick={() => announce("숏 클립 채팅은 아직 연결되지 않은 목업입니다.")}
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
          <div className={styles.bottom}>
            <div className={styles.contentRow}>
              <div className={styles.leftColumn}>
                {panel === "chat" && (
                  <section
                    ref={chat}
                    className={styles.chat}
                    aria-label="다시보기 채팅 기록"
                    tabIndex={0}
                  >
                    <div>
                      {messages.map((message, i) => (
                        <p key={i}>
                          <b>아이디</b>
                          <span>{message}</span>
                        </p>
                      ))}
                    </div>
                  </section>
                )}
                <section className={styles.project} aria-label="연결된 프로젝트 목업">
                  <div className={styles.thumbnail} />
                  <div>
                    <p>{projectTitle}</p>
                    <button
                      type="button"
                      onClick={() => announce("연결된 프로젝트 정보가 없는 목업입니다.")}
                    >
                      펀딩하기
                    </button>
                  </div>
                </section>
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  onClick={() => announce("다시보기 Q&A는 아직 연결되지 않은 목업입니다.")}
                >
                  <ReplayIcon name="question" />
                  Q&amp;A
                </button>
                <button
                  type="button"
                  aria-pressed={panel === "chat"}
                  onClick={() => setPanel("chat")}
                >
                  <ReplayIcon name={panel === "chat" ? "chat-filled" : "chat"} small />
                  채팅
                </button>
                <button
                  type="button"
                  aria-pressed={panel === "chapters"}
                  onClick={() => setPanel("chapters")}
                >
                  <ReplayIcon name={panel === "chapters" ? "chapters-filled" : "chapters"} small />
                  구간 탐색
                </button>
              </div>
            </div>
            {panel === "chapters" && (
              <div
                ref={chapters}
                className={styles.chapters}
                role="region"
                aria-label="영상 구간 목록"
                tabIndex={0}
              >
                {[0, 1, 2, 3].map((n) => (
                  <button
                    type="button"
                    key={n}
                    aria-label={`구간 ${n + 1} 재생`}
                    aria-pressed={currentChapter === n}
                    onClick={() => seek(chapterStarts[n])}
                  >
                    <span className={styles.chapterImage} />
                    <span>
                      <b>00분 00초</b>
                      <span className={styles.chapterText}>
                        구간 개요 구간 개요 구간 개요 구간 개요 구간 개요 구간 개요 구간 개요 구간
                        개요 구간 개요
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div className={styles.playback}>
              <input
                style={{ "--progress": `${progress}%` } as CSSProperties}
                type="range"
                min={0}
                max={100}
                value={progress}
                aria-label="목업 재생 위치"
                aria-valuetext={`${progress}% · 실제 영상 미연결`}
                onChange={(event) => seek(Number(event.target.value))}
              />
              <div className={styles.controls}>
                <span>00:00:00</span>
                <div>
                  <button
                    type="button"
                    aria-label="이전 구간"
                    disabled={currentChapter === 0}
                    onClick={() => seek(chapterStarts[currentChapter - 1])}
                  >
                    <ReplayIcon name="previous" small />
                  </button>
                  <button
                    type="button"
                    aria-label={playing ? "일시정지" : "재생"}
                    onClick={() => setPlaying(!playing)}
                  >
                    {playing ? (
                      <ReplayIcon name="pause" small />
                    ) : (
                      <Icon name="play" className="h-3.5 w-5" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="다음 구간"
                    disabled={currentChapter === 3}
                    onClick={() => seek(chapterStarts[currentChapter + 1])}
                  >
                    <ReplayIcon name="next" small />
                  </button>
                </div>
                <span>00:00:00</span>
              </div>
            </div>
          </div>
        )}
      </main>
      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>
    </div>
  );
}
