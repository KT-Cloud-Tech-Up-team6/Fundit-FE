"use client";

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { createStoryState, storyBody, storyQuestions, storyReducer } from "../model/story-demo";
import type { StoryDemoState } from "../model/story-demo";
import { StoryIcon } from "./story-icon";
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
    if (textarea) {
      textarea.style.height = "24px";
      if (input) textarea.style.height = `${Math.max(24, Math.min(textarea.scrollHeight, 160))}px`;
    }
    const history = historyRef.current;
    if (history && followBottom.current) history.scrollTop = history.scrollHeight;
    if (stageRef.current !== state.stage && !busy && !result) textarea?.focus();
    stageRef.current = state.stage;
  }, [input, state.messages, state.stage, busy, result]);

  function send(text: string) {
    if (!text.trim() || busy) return;
    dispatch({ type: "send", text });
    setInput("");
    textareaRef.current?.focus();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={
        loading ? "AI가 스토리를 만들고 있어요" : result ? "AI 스토리 결과" : "펀딩 AI 스토리 작성"
      }
      className={`h-168 ${result ? "w-249!" : ""}`}
    >
      {loading ? (
        <div
          className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center"
          role="status"
        >
          <p className="text-body-m">
            입력하신 정보를 바탕으로 페이지 구성과 콘텐츠를 준비하고 있어요.
          </p>
          <div
            aria-hidden
            className="bg-layer-surface-disabled grid h-74.5 w-63.5 max-w-full grid-cols-3 gap-2 rounded-sm p-3 motion-safe:animate-pulse"
          >
            <div className="bg-border-default col-span-3 rounded-sm" />
            <div className="bg-border-default rounded-sm" />
            <div className="bg-border-default col-span-2 rounded-sm" />
            <div className="bg-border-default col-span-3 rounded-sm" />
            <div className="bg-border-default col-span-3 rounded-sm" />
          </div>
          <div className="text-body-m space-y-2">
            <p>제품 특징 {state.stage === "ready" ? "파악 완료" : "파악 중"}</p>
            <p>핵심 메시지 {state.stage === "ready" ? "정리 완료" : "정리 중"}</p>
            <p>상세페이지 레이아웃 {state.stage === "ready" ? "생성 완료" : "생성 중"}</p>
            <p>{state.stage === "ready" ? "결과를 준비했어요" : "한 번 더 검토하는 중"}</p>
          </div>
          <p className="text-caption-s">목업 생성입니다. 실제 AI를 호출하지 않습니다.</p>
        </div>
      ) : result ? (
        <div className="mx-auto flex h-full max-w-203 flex-col gap-6 pt-6">
          <div
            className="min-h-0 flex-1 overflow-y-auto"
            aria-label="AI 스토리 결과 본문"
            tabIndex={0}
          >
            <p className="text-caption-s mb-2 break-words">{projectTitle} · 목업 결과</p>
            <StoryPreview body={storyBody(state)} />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <button
              type="button"
              className="bg-layer-surface-disabled text-body-strong h-10 rounded-xs px-6"
              onClick={() => dispatch({ type: "back" })}
            >
              이전으로
            </button>
            <button
              type="button"
              className="text-body-strong ml-auto h-10 px-2 underline"
              onClick={() => dispatch({ type: "generate" })}
            >
              재생성
            </button>
            <Button
              size="md"
              className="text-body-strong! h-10! w-36 font-semibold!"
              onClick={() => onImport(storyBody(state))}
            >
              불러오기
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-layer-surface-disabled mt-6 flex h-[calc(100%-24px)] min-h-0 flex-col gap-6 rounded-xs p-2">
          <div
            ref={historyRef}
            role="log"
            aria-label="스토리 작성 대화"
            aria-live="polite"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
            onScroll={() => {
              const el = historyRef.current;
              if (el) followBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
            }}
          >
            <div className="flex min-h-full flex-col justify-end gap-6">
              {state.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${message.role === "user" ? "justify-end pl-10" : "pr-2"}`}
                >
                  {message.role === "assistant" && (
                    <span aria-hidden className="bg-border-default size-8 shrink-0 rounded-full" />
                  )}
                  <div className={message.role === "assistant" ? "min-w-0" : "max-w-full"}>
                    <div
                      className={`text-body-m rounded-md px-4 py-3 break-words whitespace-pre-wrap ${message.role === "assistant" ? "bg-layer-surface-primary-hover text-text-inverse rounded-tl-none" : "bg-layer-surface-default border-border-primary rounded-br-none border"}`}
                    >
                      <span className="sr-only">
                        {message.role === "assistant" ? "AI 도우미. " : "나. "}
                      </span>
                      {message.text}
                      {message.question && (
                        <p className="text-caption-strong mt-1 text-right">
                          {message.question}/{storyQuestions.length}
                        </p>
                      )}
                    </div>
                    {state.stage === "questions" && index === state.messages.length - 1 && (
                      <button
                        type="button"
                        className="bg-layer-surface-default border-border-default text-body-strong mt-2 rounded-full border px-4 py-2"
                        onClick={() => send("해당 사항 없음")}
                      >
                        해당 사항 없음
                      </button>
                    )}
                    {state.stage === "summary" && index === state.messages.length - 1 && (
                      <Button
                        size="sm"
                        className="text-body-strong! mt-2 h-9! rounded-full! px-4 font-semibold!"
                        onClick={() => dispatch({ type: "generate" })}
                      >
                        그대로 생성하기
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {state.stage === "summarizing" && (
                <p role="status" className="text-body-s pl-10">
                  요약 중 …
                </p>
              )}
            </div>
          </div>
          <form
            className="bg-layer-surface-default border-border-default focus-within:border-border-primary flex shrink-0 items-end gap-2 rounded-xs border p-2"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <button
              disabled
              type="button"
              aria-label="파일 첨부 (목업에서 지원하지 않음)"
              title="파일 업로드는 연동 예정입니다."
              className="flex size-7 shrink-0 items-center justify-center opacity-50"
            >
              <StoryIcon name="attach" className="size-3.5" />
            </button>
            <textarea
              ref={textareaRef}
              aria-label="스토리 메시지"
              rows={1}
              value={input}
              disabled={busy}
              className="text-body-s text-text-default placeholder:text-text-default min-w-0 flex-1 resize-none bg-transparent py-0 outline-none"
              placeholder="상세페이지 스토리에 대해 무엇이든 말씀해주세요"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229
                ) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <button
              type="submit"
              aria-label="메시지 보내기"
              disabled={busy || !input.trim()}
              className="bg-layer-surface-primary text-text-inverse flex size-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
            >
              <StoryIcon name="send" />
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}
