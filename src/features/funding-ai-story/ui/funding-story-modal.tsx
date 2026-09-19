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
import { generateFundingStory, type FundingStorySession } from "@/entities/project/api/story-api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import { applyStory } from "../model/apply-story";
import { storySummary } from "../model/story-demo";

type FundingStoryModalProps = {
  projectTitle: string;
  onClose: () => void;
  onImport: (body: string) => void;
  initialState?: StoryDemoState;
  pauseDemo?: boolean;
  projectId?: string;
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
  const [apiError, setApiError] = useState("");
  const [apiBusy, setApiBusy] = useState(false);
  const apiBusyRef = useRef(false);
  const generatedBody = projectId
    ? (session?.result?.sections.map((section) => section.body).join("\n\n") ?? "")
    : storyBody(state);
  async function generate() {
    if (apiBusyRef.current) return;
    if (!projectId) {
      dispatch({ type: "generate" });
      return;
    }
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      const next = await generateFundingStory(projectId, storySummary(state));
      if (next.status !== "COMPLETED" || !next.result)
        throw new Error("생성이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      if (next.result.sections.some((section) => section.images.length))
        throw new Error("이미지를 포함한 AI 결과는 아직 불러올 수 없습니다.");
      setSession(next);
      dispatch({ type: "generate" });
      dispatch({ type: "ready" });
      dispatch({ type: "result" });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "생성 요청에 실패했습니다.");
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
    if (!session) return;
    apiBusyRef.current = true;
    setApiBusy(true);
    setApiError("");
    try {
      if (!auth.user?.memberId) throw new Error("로그인이 필요합니다.");
      await applyStory(cache, auth.user.memberId, projectId, session);
      onImport(generatedBody);
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
  const stageRef = useRef(state.stage);
  const busy = apiBusy || ["summarizing", "generating", "ready"].includes(state.stage);
  const result = state.stage === "result";
  const loading = state.stage === "generating" || state.stage === "ready";

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, []);

  useEffect(() => {
    if (pauseDemo || (projectId && state.stage !== "summarizing")) return;
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
    if (stageRef.current !== state.stage && !busy && !result) textarea?.focus();
    stageRef.current = state.stage;
    return () => window.removeEventListener("resize", resizeInput);
  }, [input, state.messages, state.stage, busy, result]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    followBottom.current = true;
    dispatch({ type: "send", text });
    setInput("");
    textareaRef.current?.focus();
  }

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
          BE 목업 생성입니다. 불러오기는 저장된 스토리 전체를 덮어씁니다. 실제 AI 연동은 준비
          중입니다.
        </p>
      )}
      {apiBusy && <p role="status">서버 요청을 처리하고 있습니다.</p>}
      {apiError && <p role="alert">{apiError}</p>}
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
            <p className="text-caption-s mb-2 break-words">{projectTitle} · 목업 결과</p>
            <StoryPreview body={generatedBody} />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="xs"
              className="h-10! w-36 leading-[1.42] font-medium"
              disabled={apiBusy}
              onClick={() => dispatch({ type: "back" })}
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
              {state.messages.map((message, index) => {
                const latest = index === state.messages.length - 1;
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
                      message.question ? (
                        <Chip
                          appearance="outline"
                          className="text-text-secondary border-border-default! bg-layer-surface-default! text-label-m h-[26px] font-semibold"
                          disabled={state.stage !== "questions" || !latest}
                          onClick={() => send("해당 사항 없음")}
                        >
                          해당 사항 없음
                        </Chip>
                      ) : state.stage === "summary" && latest ? (
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
              state.stage === "summarizing"
                ? "text-caption-s text-text-secondary mb-2 pl-10"
                : "sr-only"
            }
          >
            {state.stage === "summarizing" ? "요약 중 …" : ""}
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
