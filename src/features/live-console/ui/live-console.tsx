"use client";

import Link from "next/link";
import { useEffect, useId, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  consoleDemoReducer,
  createConsoleDemo,
  demoCues,
  demoQuestions,
} from "../model/console-demo";
import { ConsoleDialog } from "./console-dialog";
import { Icon } from "@/shared/components/ui/icon";
import { OriginalQuestions, QuestionManager, type ManagerView } from "./question-manager";
import styles from "./console.module.css";

export type ConsolePreview =
  | "ready"
  | "live"
  | "originals"
  | "answer"
  | "unavailable"
  | "cue-collapsed"
  | "ended"
  | "check"
  | "check-detail";
type CheckDialog =
  { kind: "ended" | "check" } | { kind: "detail" | "originals"; questionId: string };

function CuePanel({ collapsed: initialCollapsed }: { collapsed: boolean }) {
  const outlineId = useId();
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const cue = demoCues[index];
  return (
    <section
      className="border-border-default flex h-100 flex-col gap-2 rounded-sm border px-4 py-3"
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
          {index + 1}/{demoCues.length}
        </span>
      </div>
      <div
        className={`bg-layer-surface-disabled rounded-xs px-2 pt-3 pb-1 ${collapsed ? "flex items-center" : ""}`}
      >
        <ul
          id={outlineId}
          className={`text-body-s list-disc pl-5 ${collapsed ? "min-w-0 flex-1" : ""}`}
        >
          {(collapsed ? cue.outline.slice(0, 1) : cue.outline).map((line) => (
            <li key={line} className={collapsed ? "truncate" : ""}>
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
        className="text-caption-s min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap"
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
          disabled={index === demoCues.length - 1}
          onClick={() => setIndex(index + 1)}
          className={`${styles.secondary} flex h-7 items-center px-6!`}
        >
          <Icon name="next" className="inline-block size-3 shrink-0" />
        </button>
      </div>
    </section>
  );
}

export function LiveConsole({
  liveId = "demo-live",
  initialView = "ready",
}: {
  liveId?: string;
  initialView?: ConsolePreview;
}) {
  const phase =
    initialView === "ready"
      ? "ready"
      : ["ended", "check", "check-detail"].includes(initialView)
        ? "ended"
        : "live";
  const [state, dispatch] = useReducer(consoleDemoReducer, phase, createConsoleDemo);
  const [view, setView] = useState<ManagerView>(() => {
    if (initialView === "originals") return { kind: "originals", questionId: "vacuum" };
    if (initialView === "answer" || initialView === "unavailable")
      return { kind: "answer", questionId: initialView === "answer" ? "vacuum" : "models" };
    return { kind: "summary" };
  });
  const [dialog, setDialog] = useState<CheckDialog | null>(() =>
    initialView === "ended"
      ? { kind: "ended" }
      : initialView === "check"
        ? { kind: "check" }
        : initialView === "check-detail"
          ? { kind: "detail", questionId: "vacuum" }
          : null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chat, setChat] = useState("");
  const [notice, setNotice] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const chatListRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLButtonElement>(null);
  const answered = demoQuestions.filter((q) => state.answers[q.id]);
  const detail =
    dialog && "questionId" in dialog
      ? demoQuestions.find((q) => q.id === dialog.questionId)
      : undefined;

  useEffect(() => {
    if (state.phase !== "live") return;
    const started = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    const list = chatListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [state.messages]);

  function closeDialog() {
    setDialog(null);
    actionRef.current?.focus();
  }

  function sendAnswer(questionId: string, text: string) {
    dispatch({ type: "answer", questionId, text });
    setView({ kind: "summary" });
    setNotice("답변을 목업 채팅에 보냈습니다.");
  }

  return (
    <div className={styles.console}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link
            href="/seller/live"
            className="bg-border-default text-label-l flex h-[54px] w-[102px] shrink-0 items-center justify-center"
          >
            로고
          </Link>
          <h1 className="text-heading-s min-w-0 flex-1">프로젝트 제목(라이브 명)</h1>
          <button
            type="button"
            disabled
            title="라이브 설정은 별도 구현 예정입니다."
            className={`${styles.link} text-body-s text-text-disabled`}
          >
            라이브 설정
          </button>
          <button
            type="button"
            disabled
            title="실제 리허설은 연동 범위에 포함되지 않습니다."
            className={`${styles.secondary} text-body-strong h-10 w-[102px]`}
          >
            리허설 하기
          </button>
          <Button
            ref={actionRef}
            size="sm"
            className="h-10! w-[102px]"
            onClick={() => {
              if (state.phase === "ready") {
                dispatch({ type: "start" });
                setNotice("목업 라이브를 시작했습니다. 실제 송출은 하지 않습니다.");
              } else if (state.phase === "live") {
                dispatch({ type: "end" });
                setDialog({ kind: "ended" });
              } else setDialog({ kind: "check" });
            }}
          >
            {state.phase === "ready"
              ? "라이브 시작"
              : state.phase === "live"
                ? "라이브 종료"
                : "LIVE 체크"}
          </Button>
        </div>
      </header>
      <main className={styles.grid}>
        <QuestionManager state={state} view={view} onView={setView} onAnswer={sendAnswer} />
        <section className={`${styles.panel} flex flex-col`} aria-label="송출 모니터링">
          <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 px-4 py-1.5">
            <h2 className="text-title-s">송출 모니터링</h2>
            <button
              type="button"
              className={`${styles.link} text-caption-s flex items-center gap-2`}
              onClick={() =>
                setNotice("목업 미리보기입니다. 스트리밍 서버에 연결되어 있지 않습니다.")
              }
            >
              스트림 상태 확인
              <Icon name="stream" className="inline-block size-3.5 shrink-0" />
            </button>
          </div>
          <div className="bg-layer-surface-disabled relative min-h-0 flex-1 p-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="bg-border-default text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                <Icon name="viewers" className="inline-block size-3.5 shrink-0" />
                0명
              </span>
              <span className="bg-border-default text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                <Icon name="funding" className="inline-block size-3.5 shrink-0" />
                펀딩 0건 · 총 0원
              </span>
              <span className="bg-border-default text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                <Icon name="play" className="inline-block size-3.5 shrink-0" />
                {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                {String(elapsed % 60).padStart(2, "0")}
              </span>
            </div>
            <p className="text-caption-s absolute inset-x-3 bottom-3 text-center">
              {state.phase === "ready"
                ? "방송 시작 전"
                : state.phase === "live"
                  ? "목업 방송 진행 중"
                  : "방송 종료"}{" "}
              · 실제 송출 없음
            </p>
          </div>
        </section>
        <div className="flex min-w-0 flex-col gap-4">
          <CuePanel collapsed={initialView === "cue-collapsed"} />
          <section
            className="border-border-default flex h-[310px] flex-col overflow-hidden rounded-sm border"
            aria-label="판매자 채팅"
          >
            <div className="bg-layer-surface-disabled relative min-h-0 flex-1">
              <span
                aria-label={`채팅 ${state.messages.length}개`}
                className="bg-border-default text-caption-s absolute top-3 right-3 z-10 flex items-center gap-1 rounded-xs px-2 py-1"
              >
                <Icon name="chat" className="inline-block size-3.5 shrink-0" />
                {state.messages.length}
              </span>
              <div
                ref={chatListRef}
                role="log"
                aria-label="채팅 내역"
                aria-live="polite"
                tabIndex={0}
                className="h-full overflow-y-auto px-3 pt-12 pb-1"
              >
                {state.messages.length ? (
                  <ul className="space-y-1">
                    {state.messages.map((message) => (
                      <li key={message.id} className="flex items-start gap-2 py-1">
                        <span className="text-caption-strong shrink-0 pt-0.5">
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
                if (state.phase !== "live" || !chat.trim()) return;
                dispatch({ type: "chat", text: chat });
                setChat("");
              }}
            >
              <input
                aria-label="판매자 채팅 입력"
                value={chat}
                onChange={(event) => setChat(event.target.value)}
                disabled={state.phase !== "live"}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && event.nativeEvent.isComposing)
                    event.preventDefault();
                }}
                placeholder="판매자 계정입니다. 채팅에 주의해주세요."
                className="bg-layer-surface-disabled text-body-s h-9 min-w-0 flex-1 rounded-xs px-2"
              />
              <button
                type="submit"
                aria-label="채팅 전송"
                disabled={state.phase !== "live" || !chat.trim()}
                className="disabled:text-text-disabled flex size-9 shrink-0 items-center justify-center"
              >
                <Icon name="send" className="inline-block size-5 shrink-0" />
              </button>
            </form>
          </section>
        </div>
      </main>
      <footer className="text-caption-s mx-auto max-w-[1200px] px-5 py-4 xl:px-0">
        <p>와이어프레임 목업 · {liveId} · 예시 질문·답변과 큐시트이며 새로고침 시 초기화됩니다.</p>
        <p role="status" className="mt-1 min-h-5">
          {notice}
        </p>
        {state.publishedIds.length > 0 && (
          <p>목업 LIVE 체크 {state.publishedIds.length}건 생성됨 · 실제 게시되지 않습니다.</p>
        )}
      </footer>
      {dialog && (
        <ConsoleDialog
          key={dialog.kind}
          title={dialog.kind === "ended" ? "라이브 종료" : "LIVE 체크 생성"}
          compact={dialog.kind === "ended"}
          onClose={closeDialog}
          footer={
            dialog.kind === "ended" ? (
              <>
                <Link
                  href="/seller/live"
                  className={`${styles.secondary} text-body-m flex h-10 flex-1 items-center justify-center`}
                >
                  나가기
                </Link>
                <Button
                  size="sm"
                  className="h-10! flex-1"
                  onClick={() => setDialog({ kind: "check" })}
                >
                  LIVE 체크 생성
                </Button>
              </>
            ) : dialog.kind === "check" ? (
              <Button
                size="sm"
                className="h-10! w-66"
                disabled={!selectedIds.length}
                onClick={() => {
                  dispatch({ type: "publish", ids: selectedIds });
                  setSelectedIds([]);
                  closeDialog();
                  setNotice(
                    `목업 LIVE 체크 ${selectedIds.length}건을 생성했습니다. 실제 게시되지 않습니다.`,
                  );
                }}
              >
                LIVE 체크 생성({selectedIds.length})
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-10! w-66"
                onClick={() =>
                  setDialog(
                    dialog.kind === "originals" && detail
                      ? { kind: "detail", questionId: detail.id }
                      : { kind: "check" },
                  )
                }
              >
                뒤로
              </Button>
            )
          }
        >
          {dialog.kind === "ended" ? (
            <p className="text-body-m pt-4 text-center">
              라이브가 종료되었습니다.
              <br />
              LIVE 체크를 생성하시겠습니까?
            </p>
          ) : dialog.kind === "check" ? (
            <div className="flex min-h-full flex-col gap-3">
              <h3 className="text-body-strong">답변한 질문({answered.length})</h3>
              {!answered.length && <p className="text-body-s">아직 답변한 질문이 없습니다.</p>}
              <ul className="space-y-2">
                {answered.map((q) => (
                  <li
                    key={q.id}
                    className="border-border-default flex overflow-hidden rounded-xs border"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                      <Checkbox
                        aria-label={`${q.title} 게시 선택`}
                        checked={selectedIds.includes(q.id)}
                        onChange={(event) =>
                          setSelectedIds(
                            event.target.checked
                              ? [...selectedIds, q.id]
                              : selectedIds.filter((id) => id !== q.id),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="text-body-s min-w-0 flex-1 text-left"
                        onClick={() => setDialog({ kind: "detail", questionId: q.id })}
                      >
                        {q.title}
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`${q.title} 보낸 답변 보기`}
                      className="bg-layer-surface-disabled text-caption-s w-15 shrink-0 underline"
                      onClick={() => setDialog({ kind: "detail", questionId: q.id })}
                    >
                      {q.originals.length}건
                    </button>
                  </li>
                ))}
              </ul>
              <Checkbox
                className="mt-auto pt-4"
                disabled={!answered.length}
                checked={answered.length > 0 && selectedIds.length === answered.length}
                indeterminate={selectedIds.length > 0 && selectedIds.length < answered.length}
                onChange={(event) =>
                  setSelectedIds(event.target.checked ? answered.map((q) => q.id) : [])
                }
              >
                답변 질문 전체 게시
              </Checkbox>
            </div>
          ) : (
            detail &&
            (dialog.kind === "originals" ? (
              <>
                <h3 className="text-body-strong mb-3">질문 전체 보기</h3>
                <OriginalQuestions question={detail} />
              </>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-body-strong">대표 질문</h3>
                    <button
                      type="button"
                      className={`${styles.link} text-caption-s`}
                      onClick={() => setDialog({ kind: "originals", questionId: detail.id })}
                    >
                      전체 보기
                    </button>
                  </div>
                  <p className="border-border-default text-body-s rounded-xs border px-4 py-3">
                    {detail.title}
                  </p>
                </div>
                <div>
                  <h3 className="text-body-strong mb-3">보낸 답변</h3>
                  <p className="border-border-default text-body-s rounded-xs border px-4 py-3 whitespace-pre-wrap">
                    {state.answers[detail.id]}
                  </p>
                </div>
              </div>
            ))
          )}
        </ConsoleDialog>
      )}
    </div>
  );
}
