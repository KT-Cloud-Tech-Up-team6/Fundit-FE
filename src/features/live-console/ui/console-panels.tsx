"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./console.module.css";

/* 데모와 실제 콘솔이 같은 Figma 패널을 쓰도록 데이터만 받는 표시 조각이다. */

export type ConsoleCue = { title: string; until: string; outline: string[]; script: string };

export function CuePanel({
  cues,
  collapsed: initialCollapsed = false,
  emptyMessage = "저장된 큐시트가 없습니다.",
}: {
  cues: ConsoleCue[];
  collapsed?: boolean;
  emptyMessage?: ReactNode;
}) {
  const outlineId = useId();
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const cue = cues[Math.min(index, cues.length - 1)];
  if (!cue)
    return (
      <section
        className="border-border-default bg-layer-surface-default text-body-s text-text-secondary flex h-100 items-center justify-center rounded-sm border px-4 py-3 text-center"
        aria-label="큐시트"
      >
        {emptyMessage}
      </section>
    );
  return (
    <section
      className="border-border-default bg-layer-surface-default flex h-100 flex-col gap-2 rounded-sm border px-4 py-3"
      aria-label="큐시트"
    >
      <div className="flex items-center gap-2">
        <h2 className="text-title-s min-w-0 flex-1">
          {cue.title} <span className="text-body-s">{cue.until}까지</span>
        </h2>
        <span
          className="bg-layer-surface-disabled text-caption-s rounded-xs px-2 py-1"
          aria-live="polite"
        >
          {index + 1}/{cues.length}
        </span>
      </div>
      <div
        className={`bg-layer-bg rounded-xs px-2 pt-3 pb-1 ${collapsed ? "flex items-center" : ""}`}
      >
        <ul
          id={outlineId}
          className={`text-body-s list-disc pl-5 ${collapsed ? "min-w-0 flex-1" : ""}`}
        >
          {(collapsed ? cue.outline.slice(0, 1) : cue.outline).map((line, lineIndex) => (
            <li key={`${lineIndex}-${line}`} className={collapsed ? "truncate" : ""}>
              {line}
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={outlineId}
          className={`${styles.link} text-caption-strong ml-auto block shrink-0 px-2 py-1`}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "펼치기" : "접기"}
        </button>
      </div>
      <p
        key={index}
        tabIndex={0}
        aria-label={`${cue.title} 대사`}
        className="text-body-s min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap"
      >
        {cue.script}
      </p>
      <div className="flex justify-between">
        <button
          type="button"
          aria-label="이전 구간"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className={`${styles.secondary} flex h-7 items-center px-6!`}
        >
          <Icon name="previous" className="inline-block size-3 shrink-0" />
        </button>
        <button
          type="button"
          aria-label="다음 구간"
          disabled={index >= cues.length - 1}
          onClick={() => setIndex(index + 1)}
          className={`${styles.secondary} flex h-7 items-center px-6!`}
        >
          <Icon name="next" className="inline-block size-3 shrink-0" />
        </button>
      </div>
    </section>
  );
}

const statClass =
  "bg-layer-surface-primary-live/5 text-text-primary-live text-caption-s flex items-center gap-1 rounded-xs px-2 py-1";

/** 송출 모니터링. 영상 자리(`media`)와 세 지표는 바깥이 정한다. 모르는 지표는 `-`로 준다. */
export function MonitoringPanel({
  media,
  viewers,
  funding,
  elapsed,
  onCheckStream,
}: {
  media?: ReactNode;
  viewers: string;
  funding: string;
  elapsed: string;
  onCheckStream: () => void;
}) {
  return (
    <section className={`${styles.panel} flex flex-col`} aria-label="송출 모니터링">
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 px-4 py-1.5">
        <h2 className="text-title-s">송출 모니터링</h2>
        <button
          type="button"
          className={`${styles.link} text-caption-s flex items-center gap-2`}
          onClick={onCheckStream}
        >
          스트림 상태 확인
          <Icon name="stream" className="inline-block size-3.5 shrink-0" />
        </button>
      </div>
      <div className="bg-layer-surface-disabled relative min-h-0 flex-1 p-3">
        {media}
        <div className="pointer-events-none relative flex flex-wrap items-center justify-between gap-1">
          <span className={statClass}>
            <Icon name="people" className="inline-block size-3.5 shrink-0" />
            <span className="sr-only">시청자 </span>
            {viewers}
          </span>
          <span className={statClass}>
            <Icon name="funding" className="inline-block size-3.5 shrink-0" />
            <span className="sr-only">펀딩 </span>
            {funding}
          </span>
          <span className={statClass}>
            <Icon name="play" className="inline-block size-3.5 shrink-0" />
            <span className="sr-only">경과 시간 </span>
            {elapsed}
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * 판매자 채팅. 입력 상태는 패널이 갖는다. `onSend`가 `false`를 돌려주면(비동기면 `false`로 끝나면)
 * 입력을 지우지 않는다 — 보내지 못한 글을 잃지 않게 한다. 비동기 전송을 기다리는 동안은 다시 보내지 않는다.
 */
export function SellerChatPanel({
  messages,
  countLabel = String(messages.length),
  inactive = false,
  disabled = false,
  maxLength,
  onSend,
}: {
  /** `ai`면 라벨을 윗줄에 두고 본문을 초록으로 그린다(Figma 295:50452). */
  messages: { id: number | string; author: string; text: string; ai?: boolean }[];
  countLabel?: string;
  /** 송출 전처럼 채팅 영역을 흐리게 그린다. */
  inactive?: boolean;
  disabled?: boolean;
  maxLength?: number;
  onSend: (text: string) => boolean | void | Promise<boolean>;
}) {
  const [chat, setChat] = useState("");
  const [sending, setSending] = useState(false);
  /* 대기 표시는 다음 렌더에 반영된다. 그 사이 Enter를 두 번 누르면 같은 메시지가 두 번 나간다. */
  const sendingRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);
  async function submit() {
    if (disabled || sendingRef.current || !chat.trim()) return;
    const text = chat;
    const result = onSend(text);
    if (!(result instanceof Promise)) {
      if (result !== false) setChat("");
      return;
    }
    sendingRef.current = true;
    setSending(true);
    const sent = await result;
    sendingRef.current = false;
    setSending(false);
    /* 기다리는 동안 고쳐 쓴 글은 지우지 않는다. */
    if (sent) setChat((current) => (current === text ? "" : current));
  }
  return (
    <section
      className="border-border-default flex h-[310px] flex-col overflow-hidden rounded-sm border"
      aria-label="판매자 채팅"
    >
      <div
        className={`${inactive ? "bg-layer-surface-disabled" : "bg-layer-surface-default"} relative min-h-0 flex-1`}
      >
        <span
          aria-label={`채팅 ${countLabel}개`}
          className="bg-border-default text-caption-s absolute top-3 right-3 z-10 flex items-center gap-1 rounded-xs px-2 py-1"
        >
          <Icon name="chat" className="inline-block size-3.5 shrink-0" />
          {countLabel}
        </span>
        <div
          ref={listRef}
          role="log"
          aria-label="채팅 내역"
          aria-live="polite"
          tabIndex={0}
          className="h-full overflow-y-auto px-3 pt-3 pb-1"
        >
          {messages.length ? (
            <ul className="space-y-1">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={message.ai ? "flex flex-col py-1" : "flex items-start gap-2 py-1"}
                >
                  {/* 작성자 닉네임이 길면 줄의 절반에서 말줄임한다(#488). */}
                  <span className="text-label-m text-text-secondary max-w-1/2 shrink-0 truncate pt-0.5">
                    {message.author}
                  </span>
                  <p
                    className={`text-body-s min-w-0 break-words whitespace-pre-wrap ${message.ai ? "text-text-success" : ""}`}
                  >
                    {message.text}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption-s flex h-full items-center justify-center">
              아직 채팅이 없습니다
            </p>
          )}
        </div>
      </div>
      <form
        className="border-border-default flex shrink-0 items-center gap-2 border-t p-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <input
          aria-label="판매자 채팅 입력"
          value={chat}
          maxLength={maxLength}
          onChange={(event) => setChat(event.target.value)}
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && event.nativeEvent.isComposing) event.preventDefault();
          }}
          placeholder="판매자 계정입니다. 채팅에 주의해주세요."
          className="bg-layer-surface-disabled text-body-s h-9 min-w-0 flex-1 rounded-xs px-2"
        />
        <button
          type="submit"
          aria-label="채팅 전송"
          disabled={disabled || sending || !chat.trim()}
          className="disabled:text-text-disabled flex size-9 shrink-0 items-center justify-center"
        >
          <Icon name="send" className="inline-block size-5 shrink-0" />
        </button>
      </form>
    </section>
  );
}
