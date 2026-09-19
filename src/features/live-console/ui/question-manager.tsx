"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { demoQuestions, type ConsoleDemoState, type DemoQuestion } from "../model/console-demo";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./console.module.css";

export type ManagerView =
  { kind: "summary" | "aggregated" } | { kind: "originals" | "answer"; questionId: string };

const authors = [
  "초코송이",
  "youn",
  "레블리",
  "abcd",
  "kimm",
  "박정민",
  "love",
  "뽀로로",
  "하늘바라",
  "최원우",
];

function QuestionTitle({ question }: { question: DemoQuestion }) {
  if (!question.keyword) return question.title;
  const start = question.title.indexOf(question.keyword);
  return (
    <>
      {question.title.slice(0, start)}
      <strong className="font-medium">{question.keyword}</strong>
      {question.title.slice(start + question.keyword.length)}
    </>
  );
}

export function OriginalQuestions({ question }: { question: DemoQuestion }) {
  const list = useRef<HTMLUListElement>(null);
  return (
    <div className="relative min-h-0 flex-1">
      <ul
        ref={list}
        aria-label="질문 원문 목록"
        tabIndex={0}
        className="h-full space-y-2 overflow-y-auto pb-12"
      >
        {question.originals.map((text, index) => (
          <li key={index} className="bg-layer-bg rounded-xs px-3 py-2">
            <p className="text-label-m text-text-secondary">{authors[index % authors.length]}</p>
            <p className="text-body-s break-words">{text}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="마지막 질문으로 이동"
        className="bg-layer-surface-primary text-text-inverse absolute bottom-2 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full"
        onClick={() =>
          list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" })
        }
      >
        <Icon name="arrowDown" className="size-4" />
      </button>
    </div>
  );
}

function AnswerForm({
  question,
  sentAnswer,
  disabled,
  onSend,
  onComplete,
}: {
  question: DemoQuestion;
  sentAnswer?: string;
  disabled: boolean;
  onSend: (text: string) => void;
  onComplete: () => void;
}) {
  const [draft, setDraft] = useState(sentAnswer ?? question.answer);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-body-emphasis">
          {question.suggestion === null ? "추천 답변" : "답변 초안"}
        </h3>
        {question.suggestion !== null && (
          <button
            type="button"
            disabled={disabled}
            className={`${styles.link} text-caption-s text-text-secondary`}
            onClick={() => setDraft(question.answer)}
          >
            재생성 하기
          </button>
        )}
      </div>
      {question.suggestion === null ? (
        <div className="bg-status-warning text-text-warning flex flex-col items-center gap-4 rounded-xs px-4 py-6 text-center">
          <Icon name="warning" className="size-8" />
          <p className="text-body-s">
            상품 정보가 부족해 추천 답변을 생성할 수 없어요
            <br />
            상세 페이지 업데이트가 필요해요
          </p>
        </div>
      ) : (
        <div className="min-h-0 space-y-2 overflow-y-auto">
          <div className="bg-layer-bg rounded-xs p-4">
            {question.id === "vacuum" && (
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/seller-live/answer-source.png"
                  alt="제품 설명에서 참고한 정보"
                  width={436}
                  height={1347}
                  className="absolute top-[-400%] left-[-18.5%] w-[137%] max-w-none"
                />
              </div>
            )}
            <p className="text-body-s mt-3">{question.suggestion}</p>
          </div>
          <textarea
            aria-label="답변 내용"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            readOnly={disabled}
            className="border-border-default text-body-s min-h-28 w-full resize-y rounded-xs border p-4"
          />
        </div>
      )}
      <div className="mt-auto flex gap-3 pt-3">
        <Button
          variant="secondary"
          size="sm"
          className="text-body-s h-10 flex-1"
          disabled={disabled}
          onClick={onComplete}
        >
          답변 완료 처리
        </Button>
        {question.suggestion !== null && (
          <Button
            variant="primaryLive"
            size="sm"
            className="text-body-s h-10 flex-1"
            disabled={disabled || !draft.trim()}
            onClick={() => onSend(draft)}
          >
            채팅 보내기
          </Button>
        )}
      </div>
    </div>
  );
}

export function QuestionManager({
  state,
  view,
  onView,
  onAnswer,
  onComplete,
}: {
  state: ConsoleDemoState;
  view: ManagerView;
  onView: (view: ManagerView) => void;
  onAnswer: (questionId: string, text: string) => void;
  onComplete: (questionId: string) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current !== view) headingRef.current?.focus();
    previousView.current = view;
  }, [view]);
  const question =
    "questionId" in view ? demoQuestions.find((q) => q.id === view.questionId) : undefined;
  const answered = demoQuestions.filter((q) => state.answers[q.id]);
  return (
    <section
      className={`${styles.panel} flex flex-col gap-6 px-4 py-3`}
      aria-label="AI 라이브 매니저"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="text-title-s">
          AI 라이브 매니저
        </h2>
        {state.phase !== "ready" && (
          <span className="text-caption-s text-text-secondary flex items-center gap-1">
            2분 전 <Icon name="swap" className="size-3.5" />
          </span>
        )}
      </div>
      {question ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-body-emphasis">
              {view.kind === "originals"
                ? `질문 전체 보기 (${question.originals.length})`
                : "선택한 요약 질문"}
            </h3>
            <button
              type="button"
              className={`${styles.link} text-caption-s text-text-secondary`}
              onClick={() => onView({ kind: "summary" })}
            >
              돌아가기
            </button>
          </div>
          {view.kind === "originals" ? (
            <OriginalQuestions question={question} />
          ) : (
            <>
              <p className="bg-layer-bg text-body-s mb-3 rounded-xs px-4 py-3">{question.title}</p>
              <AnswerForm
                key={question.id}
                question={question}
                sentAnswer={state.answers[question.id]}
                disabled={state.phase !== "live"}
                onSend={(text) => onAnswer(question.id, text)}
                onComplete={() => onComplete(question.id)}
              />
            </>
          )}
        </div>
      ) : view.kind === "aggregated" ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex justify-between gap-2">
            <h3 className="text-body-emphasis">집계된 Q&amp;A ({answered.length})</h3>
            <button
              type="button"
              className={`${styles.link} text-caption-s text-text-secondary`}
              onClick={() => onView({ kind: "summary" })}
            >
              돌아가기
            </button>
          </div>
          <ul className="min-h-0 space-y-4 overflow-y-auto">
            {answered.map((q) => (
              <li key={q.id}>
                <span className="bg-layer-surface-primary-live/5 text-text-primary-live text-label-m rounded-xs px-2 py-1">
                  질문 {q.originals.length}건
                </span>
                <p className="text-body-emphasis mt-2">{q.title}</p>
                <div className="border-border-default text-body-s mt-2 rounded-xs border px-3 py-2">
                  <p>{state.answers[q.id]}</p>
                  <p className="text-caption-s text-text-secondary mt-1">판매자</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <h3 className="text-body-emphasis">질문 요약</h3>
            {state.phase === "ready" ? (
              <div className="bg-layer-surface-disabled text-caption-s text-text-secondary flex flex-1 items-center justify-center rounded-xs">
                요약할 질문이 부족합니다
              </div>
            ) : (
              <>
                <p className="text-caption-s text-text-secondary -mt-2">
                  AI가 자동 답변하지 않은 질문 중 상위 누적된 질문들입니다
                </p>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  {[false, true].map((complete) => {
                    const questions = demoQuestions
                      .filter((q) => state.completedIds.includes(q.id) === complete)
                      .sort((a, b) => b.originals.length - a.originals.length);
                    return (
                      <div key={String(complete)}>
                        <h4 className="text-caption-s mb-1">
                          {complete ? "답변 완료" : "미 답변 질문"}({questions.length})
                        </h4>
                        <ul className="space-y-2">
                          {questions.map((q) => {
                            const unavailable = !complete && q.suggestion === null;
                            return (
                              <li
                                key={q.id}
                                className={`flex overflow-hidden rounded-xs border ${unavailable ? "border-border-accent-warning text-text-warning" : "border-border-default"} ${complete ? "bg-layer-surface-disabled" : ""}`}
                              >
                                <button
                                  type="button"
                                  className="text-body-s flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left"
                                  onClick={() => onView({ kind: "answer", questionId: q.id })}
                                >
                                  <span className="min-w-0 flex-1">
                                    <QuestionTitle question={q} />
                                  </span>
                                  {unavailable && (
                                    <>
                                      <Icon name="warning" className="h-3.5 w-5 shrink-0" />
                                      <span className="sr-only">추천 답변 생성 불가</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  aria-label={`${q.title} 질문 전체 보기 ${q.originals.length}건`}
                                  className={`${complete ? "bg-layer-surface-primary-disabled" : unavailable ? "bg-status-warning text-text-warning" : "bg-layer-surface-primary text-text-inverse"} text-caption-s w-13 shrink-0 underline`}
                                  onClick={() => onView({ kind: "originals", questionId: q.id })}
                                >
                                  {q.originals.length}건
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {state.phase !== "ready" && (
            <Button
              variant="primaryLive"
              size="sm"
              className="text-body-s ml-auto h-10 px-6"
              onClick={() => onView({ kind: "aggregated" })}
            >
              집계된 Q&amp;A 보기 ({answered.length})
            </Button>
          )}
        </>
      )}
    </section>
  );
}
