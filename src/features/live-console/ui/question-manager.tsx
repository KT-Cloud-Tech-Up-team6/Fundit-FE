"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { demoQuestions, type ConsoleDemoState, type DemoQuestion } from "../model/console-demo";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./console.module.css";

export type ManagerView =
  { kind: "summary" } | { kind: "originals" | "answer"; questionId: string };

export function OriginalQuestions({ question }: { question: DemoQuestion }) {
  return (
    <ul className="space-y-2">
      {question.originals.map((text, index) => (
        <li
          key={index}
          className="border-border-default flex items-center gap-2 rounded-xs border px-3 py-2"
        >
          <Icon name="avatar" className="text-border-default inline-block size-[30px] shrink-0" />
          <div className="min-w-0">
            <p className="text-caption-strong">아이디</p>
            <p className="text-body-s break-words">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AnswerForm({
  question,
  sentAnswer,
  disabled,
  onSend,
}: {
  question: DemoQuestion;
  sentAnswer?: string;
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState(sentAnswer ?? question.answer);
  const [notice, setNotice] = useState("");
  return (
    <>
      <h3 className="text-body-emphasis">{sentAnswer ? "보낸 답변" : "추천 답변"}</h3>
      {question.suggestion === null ? (
        <div className="bg-layer-surface-disabled text-body-s flex flex-col items-center gap-4 rounded-xs px-4 py-6 text-center">
          <Icon name="warning" className="inline-block size-8 shrink-0" />
          <p>
            상품 정보가 부족해 추천 답변을 생성할 수 없어요
            <br />
            상세 페이지 업데이트가 필요해요
          </p>
        </div>
      ) : (
        <>
          {!sentAnswer && (
            <div className="bg-layer-surface-disabled space-y-2 rounded-xs px-4 py-3">
              <div className="bg-border-default text-body-m flex aspect-[4/3] items-center justify-center text-center">
                정보 이미지
                <br />
                (목업 · 실제 이미지 없음)
              </div>
              <p className="text-caption-s">{question.suggestion}</p>
            </div>
          )}
          <textarea
            aria-label="답변 내용"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            readOnly={disabled}
            className="bg-layer-surface-disabled text-body-s min-h-28 w-full resize-y rounded-xs p-4"
          />
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              disabled={disabled}
              className={`${styles.secondary} text-body-s flex-1`}
              onClick={() => {
                setDraft(question.answer);
                setNotice("목업 추천 답변으로 다시 생성했습니다.");
              }}
            >
              재생성
            </button>
            <Button
              size="sm"
              className="h-10! flex-1"
              disabled={disabled || !draft.trim()}
              onClick={() => onSend(draft)}
            >
              채팅 보내기
            </Button>
          </div>
          <p role="status" className="text-caption-s">
            {notice}
          </p>
        </>
      )}
    </>
  );
}

export function QuestionManager({
  state,
  view,
  onView,
  onAnswer,
}: {
  state: ConsoleDemoState;
  view: ManagerView;
  onView: (view: ManagerView) => void;
  onAnswer: (questionId: string, text: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) headingRef.current?.focus();
    previousView.current = view;
  }, [view]);
  const question =
    view.kind === "summary" ? undefined : demoQuestions.find((q) => q.id === view.questionId);
  return (
    <section
      className={`${styles.panel} flex flex-col gap-6 px-4 py-3`}
      aria-label="AI 라이브 매니저"
    >
      <h2 ref={headingRef} tabIndex={-1} className="text-title-s">
        AI 라이브 매니저
      </h2>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
        {question ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-body-emphasis">
                {view.kind === "originals" ? "질문 전체 보기" : "대표 질문"}
              </h3>
              <button
                type="button"
                className={`${styles.link} text-caption-s`}
                onClick={() => onView({ kind: "summary" })}
              >
                돌아가기
              </button>
            </div>
            {view.kind === "originals" ? (
              <OriginalQuestions question={question} />
            ) : (
              <>
                <p className="bg-layer-surface-disabled text-body-s mb-6 rounded-xs px-4 py-3">
                  {question.title}
                </p>
                <AnswerForm
                  key={question.id}
                  question={question}
                  sentAnswer={state.answers[question.id]}
                  disabled={state.phase !== "live"}
                  onSend={(text) => onAnswer(question.id, text)}
                />
              </>
            )}
          </>
        ) : (
          <>
            <h3 className="text-body-emphasis">질문 요약{state.phase === "ready" ? "(0)" : ""}</h3>
            {state.phase === "ready" ? (
              <div className="bg-layer-surface-disabled text-caption-s flex min-h-[500px] items-center justify-center rounded-xs">
                요약할 질문이 부족합니다
              </div>
            ) : (
              [false, true].map((answered) => {
                const questions = demoQuestions.filter(
                  (q) => Boolean(state.answers[q.id]) === answered,
                );
                return (
                  <div key={String(answered)}>
                    <h4 className="text-caption-s mb-1">
                      {answered ? "답변 완료" : "미 답변 질문"}({questions.length})
                    </h4>
                    <ul className="space-y-2">
                      {questions.map((q) => (
                        <li
                          key={q.id}
                          className={`border-border-default flex overflow-hidden rounded-xs border ${answered || !q.suggestion ? "bg-layer-surface-disabled" : ""}`}
                        >
                          <button
                            type="button"
                            className="text-body-s flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                            onClick={() => onView({ kind: "answer", questionId: q.id })}
                          >
                            <span className="flex-1">{q.title}</span>
                            {!q.suggestion && (
                              <Icon name="warning" className="inline-block size-3.5 shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`${q.title} 질문 전체 보기 ${q.originals.length}건`}
                            className="bg-border-default text-caption-s w-15 shrink-0 underline"
                            onClick={() => onView({ kind: "originals", questionId: q.id })}
                          >
                            {q.originals.length}건
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </section>
  );
}
