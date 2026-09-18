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

type FundingStoryModalProps = {
  projectTitle: string;
  onClose: () => void;
  onImport: (body: string) => void;
  initialState?: StoryDemoState;
  pauseDemo?: boolean;
};

export function FundingStoryModal({
  projectTitle,
  onClose,
  onImport,
  initialState,
  pauseDemo = false,
}: FundingStoryModalProps) {
  const [state, dispatch] = useReducer(storyReducer, initialState ?? createStoryState());
  const [input, setInput] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followBottom = useRef(true);
  const stageRef = useRef(state.stage);
  const busy = ["summarizing", "generating", "ready"].includes(state.stage);
  const result = state.stage === "result";
  const loading = state.stage === "generating" || state.stage === "ready";

  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = history.scrollHeight;
  }, []);

  useEffect(() => {
    if (pauseDemo) return;
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
  }, [state.stage, pauseDemo]);

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
      onClose={onClose}
      title="AI 스토리 작성"
      className={`h-168 sm:mt-[clamp(20px,calc((100dvh-672px)/2),114px)] [&>div]:gap-6 ${loading ? styles.loading : ""}`}
      size={result ? "l" : "m"}
    >
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
            <StoryPreview body={storyBody(state)} />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="xs"
              className="h-10! w-36 leading-[1.42] font-medium"
              onClick={() => dispatch({ type: "back" })}
            >
              이전으로
            </Button>
            <TextButton
              className="ml-auto h-10 no-underline!"
              onClick={() => dispatch({ type: "generate" })}
            >
              재생성
            </TextButton>
            <Button
              size="xs"
              className="h-10! w-36 leading-[1.42] font-medium"
              onClick={() => onImport(storyBody(state))}
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
                    status={state.stage === "summarizing" && latest ? "요약 중 …" : undefined}
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
                          onClick={() => dispatch({ type: "generate" })}
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
