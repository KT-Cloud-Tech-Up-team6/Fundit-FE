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
 * 판매자 채팅. 입력 상태는 패널이 갖는다. `onSend`가 `false`를 돌려주면 입력을 지우지 않는다
 * (실제 채팅이 연결되지 않아 보내지 못한 경우 쓴 글을 잃지 않게 한다).
 */
export function SellerChatPanel({
  messages,
  countLabel = String(messages.length),
  inactive = false,
  disabled = false,
  onSend,
}: {
  messages: { id: number | string; author: string; text: string }[];
  countLabel?: string;
  /** 송출 전처럼 채팅 영역을 흐리게 그린다. */
  inactive?: boolean;
  disabled?: boolean;
  onSend: (text: string) => boolean | void;
}) {
  const [chat, setChat] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);
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
                <li key={message.id} className="flex items-start gap-2 py-1">
                  <span className="text-label-m text-text-secondary shrink-0 pt-0.5">
                    {message.author}
                  </span>
                  <p className="text-body-s min-w-0 break-words whitespace-pre-wrap">
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
          if (disabled || !chat.trim()) return;
          if (onSend(chat) !== false) setChat("");
        }}
      >
        <input
          aria-label="판매자 채팅 입력"
          value={chat}
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
          disabled={disabled || !chat.trim()}
          className="disabled:text-text-disabled flex size-9 shrink-0 items-center justify-center"
        >
          <Icon name="send" className="inline-block size-5 shrink-0" />
        </button>
      </form>
    </section>
  );
}
