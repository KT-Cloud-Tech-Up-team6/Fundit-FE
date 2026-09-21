"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { ChatDialogue } from "@/shared/components/ui/chat-dialogue";
import { Chip } from "@/shared/components/ui/chip";
import { InputChat } from "@/shared/components/ui/input-chat";
import { TextButton } from "@/shared/components/ui/text-button";
import { Modal } from "@/shared/components/ui/modal";
import { createStoryState, storyBody, storyQuestions, storyReducer } from "../model/story-demo";
import type { StoryDemoState } from "../model/story-demo";
import styles from "./funding-story-modal.module.css";
import { StoryPreview } from "./story-preview";
import {
  confirmFundingStorySession,
  createFundingStoryRun,
  createFundingStorySession,
  getFundingStorySession,
  getLatestFundingStorySession,
  isFundingStorySessionSynchronized,
  sendFundingStoryMessage,
  startFundingStorySession,
  streamFundingStoryChat,
  waitForFundingStoryRun,
  type FundingStoryMessage,
  type FundingStoryRun,
  type FundingStorySession,
  type IntroBlock,
} from "@/entities/project/api/story-api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { applyStory } from "../model/apply-story";

type FundingStoryModalProps = {
  projectTitle: string;
  onClose: () => void;
  onImport: (body: string, introContent?: IntroBlock[], coverImageUrl?: string | null) => void;
  initialState?: StoryDemoState;
  pauseDemo?: boolean;
  projectId?: string;
};

type PendingSessionSync = {
  sessionId: string;
  minimumRevision: number;
};

const nextRemoteStage = (session: FundingStorySession) =>
  session.missing.length === 0 && session.summary ? "summary" : "collecting";

const summaryText = (session: FundingStorySession) => {
  if (!session.summary) return "";
  return [
    `제품\n${session.summary.product}`,
    `스토리\n${session.summary.story}`,
    `핵심 강점\n${session.summary.strengths
      .map((strength) => `${strength.title}: ${strength.description}`)
      .join("\n")}`,
  ].join("\n\n");
};

export function FundingStoryModal({
  projectTitle,
  onClose,
  onImport,
  initialState,
  pauseDemo = false,
  projectId,
}: FundingStoryModalProps) {
  const cache = useQueryClient();
  const { state: auth } = useAuth();
  const [state, dispatch] = useReducer(storyReducer, initialState ?? createStoryState());
  const [input, setInput] = useState("");
  const [session, setSession] = useState<FundingStorySession | null>(null);
  const [run, setRun] = useState<FundingStoryRun | null>(null);
  const [remoteStage, setRemoteStage] = useState<
    "connecting" | "collecting" | "summary" | "generating" | "result"
  >("connecting");
  const [streamingText, setStreamingText] = useState("");
  const [optimisticMessage, setOptimisticMessage] = useState<FundingStoryMessage | null>(null);
  const [apiError, setApiError] = useState("");
  const [apiBusy, setApiBusy] = useState(false);
  const [pendingSessionSync, setPendingSessionSync] = useState<PendingSessionSync | null>(null);
  const apiBusyRef = useRef(false);
  const lifecycleRef = useRef<AbortController | null>(null);
  const remoteBlocks = run?.result?.intro_content;
  const generatedBody = projectId
    ? (remoteBlocks
        ?.filter((block) => block.type === "TEXT")
        .map((block) => block.value)
        .join("\n\n") ?? "")
    : storyBody(state);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    lifecycleRef.current = controller;
    const refreshAfterChat = async (current: FundingStorySession, chatId: string) => {
      setApiBusy(true);
      setStreamingText("");
      const done = await streamFundingStoryChat(
        projectId,
        chatId,
        setStreamingText,
        controller.signal,
      );
      const pending = {
        sessionId: current.session_id,
        minimumRevision: done.revision,
      };
      setPendingSessionSync(pending);
      const refreshed = await getFundingStorySession(
        projectId,
        current.session_id,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pending.minimumRevision)) {
        throw new Error("완료된 AI 응답을 세션과 동기화하지 못했습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setStreamingText("");
      setOptimisticMessage(null);
      setRemoteStage(nextRemoteStage(refreshed));
    };
    const bootstrap = async () => {
      setApiError("");
      setApiBusy(true);
      try {
        const latest = await getLatestFundingStorySession(projectId, controller.signal);
        const current =
          latest.session ?? (await createFundingStorySession(projectId, controller.signal));
        setSession(current);
        if (current.active_chat_id) {
          setRemoteStage("collecting");
          await refreshAfterChat(current, current.active_chat_id);
        } else if (current.messages.length === 0) {
          setRemoteStage("collecting");
          const accepted = await startFundingStorySession(
            projectId,
            current.session_id,
            controller.signal,
          );
          await refreshAfterChat(current, accepted.chat_id);
        } else {
          setRemoteStage(nextRemoteStage(current));
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setApiError(error instanceof Error ? error.message : "AI 세션을 불러오지 못했습니다.");
        }
      } finally {
        setApiBusy(false);
      }
    };
    // 개발 Strict Mode의 effect 재실행 전에 첫 호출이 서버 세션을 중복 생성하지 않게 다음 tick에 시작한다.
    const bootstrapTimer = window.setTimeout(() => void bootstrap(), 0);
    return () => {
      window.clearTimeout(bootstrapTimer);
      controller.abort();
      if (lifecycleRef.current === controller) lifecycleRef.current = null;
    };
  }, [projectId]);

  async function generate() {
    if (apiBusyRef.current || pendingSessionSync) return;
    if (!projectId) {
      dispatch({ type: "generate" });
      return;
    }
    if (!session || !session.summary || session.missing.length) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      const controller = lifecycleRef.current ?? new AbortController();
      const confirmed = await confirmFundingStorySession(
        projectId,
        session.session_id,
        session.revision,
        controller.signal,
      );
      setRemoteStage("generating");
      const accepted = await createFundingStoryRun(
        projectId,
        session.session_id,
        confirmed.confirmed_revision,
        crypto.randomUUID(),
        controller.signal,
      );
      const completed = await waitForFundingStoryRun(projectId, accepted.run_id, controller.signal);
      if (completed.status === "failed" || !completed.result) {
        throw new Error(completed.error?.message ?? "상세페이지 생성에 실패했습니다.");
      }
      setRun(completed);
      setRemoteStage("result");
      if (completed.status === "partially_succeeded") {
        setApiError("일부 이미지를 만들지 못해 생성된 나머지 결과만 표시합니다.");
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "생성 요청에 실패했습니다.");
      setRemoteStage("summary");
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }
  async function importResult() {
    if (apiBusyRef.current) return;
    if (!projectId) {
      onImport(generatedBody);
      return;
    }
    if (!run?.result) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      if (!auth.user?.memberId) throw new Error("로그인이 필요합니다.");
      await applyStory(cache, auth.user.memberId, projectId, run);
      onImport(generatedBody, run.result.intro_content, run.result.cover_image_url);
    } catch {
      setApiError("스토리에 반영하지 못했습니다. 다시 시도해주세요.");
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followBottom = useRef(true);
  const displayStage = projectId ? remoteStage : state.stage;
  const stageRef = useRef(displayStage);
  const busy = projectId
    ? apiBusy || pendingSessionSync !== null || ["connecting", "generating"].includes(remoteStage)
    : apiBusy || ["summarizing", "generating", "ready"].includes(state.stage);
  const result = displayStage === "result";
  const loading = displayStage === "generating" || displayStage === "ready";

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, []);

  useEffect(() => {
    if (pauseDemo || projectId) return;
    const action =
      state.stage === "summarizing"
        ? "summary-ready"
        : state.stage === "generating"
          ? "ready"
          : state.stage === "ready"
            ? "result"
            : null;
    if (!action) return;
    const timer = window.setTimeout(
      () => dispatch({ type: action }),
      state.stage === "generating" ? 1800 : 800,
    );
    return () => window.clearTimeout(timer);
  }, [state.stage, pauseDemo, projectId]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    function resizeInput() {
      if (!textarea) return;
      textarea.style.height = "28px";
      textarea.style.height = `${Math.max(28, Math.min(textarea.scrollHeight, 160))}px`;
    }
    resizeInput();
    window.addEventListener("resize", resizeInput);
    const history = historyRef.current;
    if (history && followBottom.current) history.scrollTop = history.scrollHeight;
    if (stageRef.current !== displayStage && !busy && !result) textarea?.focus();
    stageRef.current = displayStage;
    return () => window.removeEventListener("resize", resizeInput);
  }, [input, state.messages, displayStage, busy, result]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    if (projectId) {
      void sendRemote(text.trim());
      return;
    }
    followBottom.current = true;
    dispatch({ type: "send", text });
    setInput("");
    textareaRef.current?.focus();
  }

  async function sendRemote(text: string) {
    if (!projectId || !session || apiBusyRef.current) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    setOptimisticMessage({ role: "user", text });
    setRemoteStage("collecting");
    setInput("");
    setStreamingText("");
    try {
      const controller = lifecycleRef.current ?? new AbortController();
      const accepted = await sendFundingStoryMessage(
        projectId,
        session.session_id,
        session.revision,
        text,
        controller.signal,
      );
      const done = await streamFundingStoryChat(
        projectId,
        accepted.chat_id,
        setStreamingText,
        controller.signal,
      );
      const pending = {
        sessionId: session.session_id,
        minimumRevision: done.revision,
      };
      setPendingSessionSync(pending);
      const refreshed = await getFundingStorySession(
        projectId,
        session.session_id,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pending.minimumRevision)) {
        throw new Error("완료된 AI 응답을 세션과 동기화하지 못했습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setRemoteStage(nextRemoteStage(refreshed));
      setOptimisticMessage(null);
      setStreamingText("");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setApiError(error instanceof Error ? error.message : "메시지를 보내지 못했습니다.");
      }
      setOptimisticMessage(null);
      setStreamingText("");
      setRemoteStage(nextRemoteStage(session));
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }

  async function synchronizeSession() {
    if (!projectId || !pendingSessionSync || apiBusyRef.current) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      const controller = lifecycleRef.current ?? new AbortController();
      const refreshed = await getFundingStorySession(
        projectId,
        pendingSessionSync.sessionId,
        controller.signal,
      );
      if (!isFundingStorySessionSynchronized(refreshed, pendingSessionSync.minimumRevision)) {
        throw new Error("완료된 AI 응답이 아직 세션에 반영되지 않았습니다.");
      }
      setSession(refreshed);
      setPendingSessionSync(null);
      setOptimisticMessage(null);
      setStreamingText("");
      setRemoteStage(nextRemoteStage(refreshed));
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "AI 세션을 다시 동기화하지 못했습니다.");
    } finally {
      apiBusyRef.current = false;
      setApiBusy(false);
    }
  }

  const displayedMessages: (FundingStoryMessage & { question?: number; isSummary?: boolean })[] =
    projectId
      ? [
          ...(session?.messages ?? []),
          ...(optimisticMessage ? [optimisticMessage] : []),
          ...(streamingText ? [{ role: "assistant" as const, text: streamingText }] : []),
          ...(remoteStage === "summary" && session?.summary
            ? [
                {
                  role: "assistant" as const,
                  text: `요약본이 준비됐어요!\n\n${summaryText(session)}\n\n확인해보시고, 그대로 진행하시거나 수정해주세요.`,
                  isSummary: true,
                },
              ]
            : []),
        ]
      : state.messages;

  return (
    <Modal
      open
      onClose={() => {
        if (!apiBusyRef.current) onClose();
      }}
      title="AI 스토리 작성"
      className={`h-168 sm:mt-[clamp(20px,calc((100dvh-672px)/2),114px)] [&>div]:gap-6 ${loading ? styles.loading : ""}`}
      size={result ? "l" : "m"}
    >
      {projectId && (
        <p className="text-caption-s">
          전체 생성만 지원합니다. 생성이 끝나면 BE가 검증한 결과를 현재 스토리에 불러옵니다.
        </p>
      )}
      {apiBusy && <p role="status">서버 요청을 처리하고 있습니다.</p>}
      {apiError && <p role="alert">{apiError}</p>}
      {pendingSessionSync && !apiBusy && (
        <Button size="xs" className="self-start" onClick={() => void synchronizeSession()}>
          세션 다시 동기화
        </Button>
      )}
      {loading ? (
        <div className="flex h-full flex-col items-center pt-[139px] text-center" role="status">
          <p className="text-title-s leading-[1.42] font-semibold">AI가 스토리를 생성중이에요...</p>
          <div
            className="mt-6 flex size-40 shrink-0 items-center justify-center rounded-full bg-[var(--grey-white)]"
            aria-hidden
          >
            <Image
              src="/icons/funding-story/loading-logo.svg"
              alt=""
              width={144}
              height={121}
              className={styles.loadingLogo}
            />
          </div>
        </div>
      ) : result ? (
        <div className="mx-auto flex h-full max-w-203 flex-col gap-6">
          <div
            className="bg-layer-surface-disabled min-h-0 flex-1 overflow-y-auto"
            aria-label="AI 스토리 결과 본문"
            tabIndex={0}
          >
            <p className="text-caption-s mb-2 break-words">{projectTitle} · AI 생성 결과</p>
            {projectId && remoteBlocks ? (
              <article className="border-border-default bg-layer-surface-default space-y-6 rounded-xs border p-6 sm:p-10">
                {remoteBlocks.map((block, index) =>
                  block.type === "IMAGE" ? (
                    <Image
                      key={`${block.value}-${index}`}
                      src={block.value}
                      alt="AI가 생성한 상세페이지 이미지"
                      width={1200}
                      height={800}
                      unoptimized
                      className="h-auto w-full rounded-xs"
                    />
                  ) : (
                    <p key={index} className="text-body-m break-words whitespace-pre-wrap">
                      {block.value}
                    </p>
                  ),
                )}
              </article>
            ) : (
              <StoryPreview body={generatedBody} />
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="xs"
              className="h-10! w-36 leading-[1.42] font-medium"
              disabled={apiBusy}
              onClick={() => {
                if (projectId) {
                  setRemoteStage("summary");
                  setRun(null);
                } else {
                  dispatch({ type: "back" });
                }
              }}
            >
              이전으로
            </Button>
            <TextButton
              className="ml-auto h-10 no-underline!"
              disabled={apiBusy}
              onClick={() => void generate()}
            >
              재생성
            </TextButton>
            <Button
              size="xs"
              className="h-10! w-36 leading-[1.42] font-medium"
              disabled={apiBusy}
              onClick={() => void importResult()}
            >
              불러오기
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-layer-bg border-border-default flex h-full min-h-0 flex-col rounded-xs border px-4 pb-4">
          <div
            ref={historyRef}
            role="log"
            aria-label="스토리 작성 대화"
            aria-live="polite"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4"
            onScroll={() => {
              const el = historyRef.current;
              if (el) followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
            }}
          >
            <div className="flex min-h-full flex-col gap-2">
              {displayedMessages.map((message, index) => {
                const latest = index === displayedMessages.length - 1;
                return (
                  <ChatDialogue
                    key={index}
                    appearance="story"
                    sender={message.role === "assistant" ? "ai" : "user"}
                    avatar={
                      state.messages[index - 1]?.role === "assistant" ? (
                        <span />
                      ) : (
                        <Image
                          src="/icons/funding-story/avatar.svg"
                          alt=""
                          width={32}
                          height={32}
                        />
                      )
                    }
                    progress={
                      message.question ? `${message.question}/${storyQuestions.length}` : undefined
                    }
                    actions={
                      projectId &&
                      latest &&
                      message.role === "assistant" &&
                      remoteStage === "collecting" &&
                      !streamingText ? (
                        <Chip
                          appearance="outline"
                          className="text-text-secondary border-border-default! bg-layer-surface-default! text-label-m h-[26px] font-semibold"
                          disabled={busy}
                          onClick={() => send("해당 사항 없음")}
                        >
                          해당 사항 없음
                        </Chip>
                      ) : projectId && message.isSummary ? (
                        <Chip
                          appearance="outline"
                          className="text-text-secondary bg-layer-surface-default text-label-m h-[26px] font-semibold"
                          disabled={apiBusy || pendingSessionSync !== null}
                          onClick={() => void generate()}
                        >
                          그대로 생성하기
                        </Chip>
                      ) : message.question ? (
                        <Chip
                          appearance="outline"
                          className="text-text-secondary border-border-default! bg-layer-surface-default! text-label-m h-[26px] font-semibold"
                          disabled={state.stage !== "questions" || !latest}
                          onClick={() => send("해당 사항 없음")}
                        >
                          해당 사항 없음
                        </Chip>
                      ) : displayStage === "summary" && latest ? (
                        <Chip
                          appearance="outline"
                          className="text-text-secondary bg-layer-surface-default text-label-m h-[26px] font-semibold"
                          disabled={apiBusy}
                          onClick={() => void generate()}
                        >
                          그대로 생성하기
                        </Chip>
                      ) : undefined
                    }
                  >
                    {message.text}
                  </ChatDialogue>
                );
              })}
            </div>
          </div>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={
              displayStage === "summarizing" || (projectId && apiBusy)
                ? "text-caption-s text-text-secondary mb-2 pl-10"
                : "sr-only"
            }
          >
            {displayStage === "summarizing"
              ? "요약 중 …"
              : projectId && remoteStage === "connecting"
                ? "AI 세션 연결 중 …"
                : projectId && apiBusy
                  ? "AI 응답 생성 중 …"
                  : ""}
          </p>
          <InputChat
            ref={textareaRef}
            appearance="story"
            className="shrink-0"
            aria-label="스토리 메시지"
            value={input}
            disabled={busy}
            attachDisabled
            attachLabel="파일 첨부 (준비 중)"
            placeholder="답변을 작성해주세요"
            onChange={(event) => setInput(event.target.value)}
            onSend={send}
          />
        </div>
      )}
    </Modal>
  );
}
