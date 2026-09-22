"use client";

import Link from "next/link";
import Image from "next/image";
import { SellerShell } from "@/shared/components/layout/seller-shell";
import { useEffect, useId, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
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
  | "loading"
  | "live"
  | "aggregated"
  | "originals"
  | "answer"
  | "unavailable"
  | "cue-collapsed"
  | "ended"
  | "check"
  | "check-detail"
  | "added";
type CheckDialog =
  | { kind: "ended" | "check" | "added" }
  | { kind: "detail"; questionId: string }
  | { kind: "originals"; questionId: string; returnTo: "check" | "detail" };

function CuePanel({ collapsed: initialCollapsed }: { collapsed: boolean }) {
  const outlineId = useId();
  const [index, setIndex] = useState(0);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const cue = demoCues[index];
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
          {index + 1}/{demoCues.length}
        </span>
      </div>
      <div
        className={`bg-layer-bg rounded-xs px-2 pt-3 pb-1 ${collapsed ? "flex items-center" : ""}`}
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
  initialView = "loading",
}: {
  liveId?: string;
  initialView?: ConsolePreview;
}) {
  const phase =
    initialView === "loading"
      ? "loading"
      : ["ended", "check", "check-detail", "added"].includes(initialView)
        ? "ended"
        : "live";
  const [state, dispatch] = useReducer(consoleDemoReducer, phase, createConsoleDemo);
  const [view, setView] = useState<ManagerView>(() => {
    if (initialView === "originals") return { kind: "originals", questionId: "vacuum" };
    if (initialView === "answer" || initialView === "unavailable")
      return { kind: "answer", questionId: initialView === "answer" ? "vacuum" : "models" };
    return { kind: initialView === "aggregated" ? "aggregated" : "summary" };
  });
  const [dialog, setDialog] = useState<CheckDialog | null>(() =>
    initialView === "ended"
      ? { kind: "ended" }
      : initialView === "check"
        ? { kind: "check" }
        : initialView === "check-detail"
          ? { kind: "detail", questionId: "vacuum" }
          : initialView === "added"
            ? { kind: "added" }
            : null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [chat, setChat] = useState("");
  const [notice, setNotice] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const chatListRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const answered = demoQuestions.filter((q) => state.answers[q.id]);
  /* 목업 화면이라 실제 프로젝트가 없다 — 구매자 쪽 데모 매핑을 그대로 빌려 상세페이지 링크를 만든다.
     ponytail: 매핑이 실패하는 demo-* id(실제 진입 경로인 "demo-live" 외)는 무관한
     "demo-project"로 조용히 대체된다. 콘솔 라우트가 demo-live 하나만 쓰는 동안은 괜찮지만,
     다른 demo-* id도 실제로 열리게 하려면 매핑을 넓히거나 여기서 명시적으로 경고해야 한다. */
  const projectId = getLiveDemoConnection(liveId)?.projectId ?? "demo-project";
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
    consoleRef.current?.focus();
  }

  function sendAnswer(questionId: string, text: string) {
    dispatch({ type: "answer", questionId, text });
    setNotice("답변을 목업 채팅에 보냈습니다.");
  }

  return (
    <SellerShell
      headerAction={
        <Button
          variant="secondary"
          size="md"
          className="text-body-s h-10! gap-2 px-3!"
          disabled={state.phase === "ended"}
          onClick={() => {
            dispatch({ type: "end" });
            setDialog({ kind: "ended" });
          }}
        >
          LIVE 종료
          <Icon name="close" className="size-4" />
        </Button>
      }
    >
      <div
        className={styles.console}
        ref={consoleRef}
        tabIndex={-1}
        aria-label={`LIVE 콘솔 ${liveId}`}
      >
        <p role="status" className={notice ? "text-body-s mx-auto max-w-300 pt-4" : "sr-only"}>
          {notice}
        </p>
        <div className={styles.grid}>
          <QuestionManager
            state={state}
            view={view}
            onView={setView}
            onAnswer={sendAnswer}
            onComplete={(questionId) => {
              dispatch({ type: "complete", questionId });
              setView({ kind: "summary" });
            }}
          />
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
              {state.phase !== "loading" && (
                <Image
                  src="/images/seller-live/broadcast.png"
                  alt="LIVE 송출 예시"
                  fill
                  sizes="(min-width: 1024px) 384px, 100vw"
                  className="object-cover object-left"
                />
              )}

              <div className="relative flex flex-wrap items-center justify-between gap-1">
                <span className="bg-layer-surface-primary-live/5 text-text-primary-live text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                  <Icon name="people" className="inline-block size-3.5 shrink-0" />
                  0명
                </span>
                <span className="bg-layer-surface-primary-live/5 text-text-primary-live text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                  <Icon name="funding" className="inline-block size-3.5 shrink-0" />
                  0건 · 0원
                </span>
                <span className="bg-layer-surface-primary-live/5 text-text-primary-live text-caption-s flex items-center gap-1 rounded-xs px-2 py-1">
                  <Icon name="play" className="inline-block size-3.5 shrink-0" />
                  00:{String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")}
                </span>
              </div>
            </div>
          </section>
          <div className="flex min-w-0 flex-col gap-4">
            <CuePanel collapsed={initialView === "cue-collapsed"} />
            <section
              className="border-border-default flex h-[310px] flex-col overflow-hidden rounded-sm border"
              aria-label="판매자 채팅"
            >
              <div
                className={`${state.phase === "loading" ? "bg-layer-surface-disabled" : "bg-layer-surface-default"} relative min-h-0 flex-1`}
              >
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
                  className="h-full overflow-y-auto px-3 pt-3 pb-1"
                >
                  {state.messages.length ? (
                    <ul className="space-y-1">
                      {state.messages.map((message) => (
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
        </div>
        <footer className="sr-only">
          <p>LIVE 화면 목업 · {liveId} · 예시 질문·답변과 큐시트이며 새로고침 시 초기화됩니다.</p>
          {state.publishedIds.length > 0 && (
            <p>목업 LIVE 체크 {state.publishedIds.length}건 생성됨 · 실제 게시되지 않습니다.</p>
          )}
        </footer>
        {dialog && (
          <ConsoleDialog
            key={dialog.kind}
            title={
              dialog.kind === "ended"
                ? "라이브 종료"
                : dialog.kind === "added"
                  ? "LIVE 체크 추가 완료"
                  : "LIVE 체크 추가"
            }
            compact={dialog.kind === "ended" || dialog.kind === "added"}
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
                    variant="primaryLive"
                    className="h-10! flex-1"
                    onClick={() => setDialog({ kind: "check" })}
                  >
                    LIVE 체크 추가
                  </Button>
                </>
              ) : dialog.kind === "added" ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-10! flex-1"
                    onClick={closeDialog}
                  >
                    나가기
                  </Button>
                  <Button
                    href={`/projects/${projectId}?tab=live-proof`}
                    size="sm"
                    variant="primaryLive"
                    className="h-10! flex-1"
                  >
                    상세페이지로
                  </Button>
                </>
              ) : dialog.kind === "check" || dialog.kind === "originals" ? (
                <Button
                  size="sm"
                  variant="primaryLive"
                  className="h-10! w-66"
                  disabled={!selectedIds.length}
                  onClick={() => {
                    dispatch({ type: "publish", ids: selectedIds });
                    setSelectedIds([]);
                    setDialog({ kind: "added" });
                  }}
                >
                  LIVE 체크 추가({selectedIds.length})
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="h-10! w-66"
                  onClick={() => setDialog({ kind: "check" })}
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
                LIVE 체크에 추가하시겠습니까?
              </p>
            ) : dialog.kind === "added" ? (
              <p className="text-body-m pt-4 text-center">
                선택하신 Q&amp;A 추가가 완료되었습니다.
                <br />
                상세페이지의 LIVE 체크 탭으로 이동하시겠습니까?
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
                          shape="circle"
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
                        aria-label={`${q.title} 질문 전체 보기`}
                        className="bg-layer-surface-disabled text-caption-s w-15 shrink-0 underline"
                        onClick={() =>
                          setDialog({ kind: "originals", questionId: q.id, returnTo: "check" })
                        }
                      >
                        {q.originals.length}건
                      </button>
                    </li>
                  ))}
                </ul>
                <Checkbox
                  className="mt-auto pt-4"
                  shape="circle"
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
                <div className="flex h-full flex-col">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-body-emphasis">
                      질문 전체 보기 ({detail.originals.length})
                    </h3>
                    <button
                      type="button"
                      className={`${styles.link} text-caption-s text-text-secondary`}
                      onClick={() =>
                        setDialog(
                          dialog.returnTo === "check"
                            ? { kind: "check" }
                            : { kind: "detail", questionId: detail.id },
                        )
                      }
                    >
                      돌아가기
                    </button>
                  </div>
                  <OriginalQuestions question={detail} />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-body-strong">대표 질문</h3>
                      <button
                        type="button"
                        className={`${styles.link} text-caption-s`}
                        onClick={() =>
                          setDialog({
                            kind: "originals",
                            questionId: detail.id,
                            returnTo: "detail",
                          })
                        }
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
    </SellerShell>
  );
}
