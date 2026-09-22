"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { DialogBase } from "@/shared/components/ui/dialog-base";
import type { roomQuestions } from "../model/room-demo";
import styles from "./buyer-live-room.module.css";

export type LiveQuestion = (typeof roomQuestions)[number] & { id?: string; answeredBy?: string };
export type QuestionSheetState = "closed" | "compact" | "expanded";

/**
 * 시청·다시보기가 함께 쓰는 모바일 Q&A 하단 시트. 열림 상태는 화면이 소유하고
 * 끌어올리기(compact ↔ expanded)에 필요한 높이·드래그 상태만 여기서 갖는다.
 */
export function LiveQuestionsSheet({
  state,
  onStateChange,
  questions,
  questionsState,
  onRefresh,
  demoMode = true,
}: {
  state: QuestionSheetState;
  onStateChange: (next: QuestionSheetState) => void;
  questions: LiveQuestion[];
  questionsState?: ReactNode;
  onRefresh?: () => void;
  demoMode?: boolean;
}) {
  const dragY = useRef<number | null>(null);
  const startHeight = useRef(0);
  const dragged = useRef(false);
  const [height, setHeight] = useState<number>();
  const titleId = useId();

  return (
    <DialogBase
      open={state !== "closed"}
      onClose={() => {
        onStateChange("closed");
        setHeight(undefined);
        dragY.current = null;
      }}
      aria-labelledby={titleId}
      style={{ height }}
      className={`${styles.questions} ${state === "expanded" ? styles.questionsExpanded : ""}`}
    >
      <div className={styles.questionContent}>
        <h2 id={titleId}>
          <button
            type="button"
            aria-label={state === "expanded" ? "Q&A 축소" : "Q&A 확대"}
            aria-expanded={state === "expanded"}
            onClick={() => {
              if (dragged.current) {
                dragged.current = false;
                return;
              }
              onStateChange(state === "expanded" ? "compact" : "expanded");
            }}
            onPointerDown={(event) => {
              if (event.button !== 0 || !event.isPrimary) return;
              dragged.current = false;
              dragY.current = event.clientY;
              startHeight.current = event.currentTarget
                .closest("dialog")!
                .getBoundingClientRect().height;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (dragY.current === null) return;
              const delta = dragY.current - event.clientY;
              if (Math.abs(delta) > 5) dragged.current = true;
              const maximum = window.innerHeight - 64;
              setHeight(
                Math.max(Math.min(329, maximum), Math.min(maximum, startHeight.current + delta)),
              );
            }}
            onPointerUp={(event) => {
              if (dragY.current !== null && Math.abs(event.clientY - dragY.current) > 30) {
                dragged.current = true;
                onStateChange(event.clientY < dragY.current ? "expanded" : "compact");
              }
              dragY.current = null;
              setHeight(undefined);
            }}
            onPointerCancel={() => {
              dragY.current = null;
              dragged.current = false;
              setHeight(undefined);
            }}
          >
            Q&amp;A
          </button>
        </h2>
        {onRefresh && (
          <button type="button" className="text-caption-s underline" onClick={onRefresh}>
            새로고침
          </button>
        )}
        <button
          type="button"
          className="sr-only focus:not-sr-only"
          onClick={() => onStateChange("closed")}
        >
          Q&amp;A 닫기
        </button>
        <div className={styles.questionList} tabIndex={0} role="region" aria-label="Q&A 질문 목록">
          {questionsState ??
            questions.map((question) => (
              <article key={question.id ?? question.title}>
                <div className={styles.questionTitle}>
                  <span
                    aria-hidden
                    className="inline-block size-5 shrink-0 bg-current"
                    style={{
                      maskImage: "url(/icons/buyer-live-room/question-filled.svg)",
                      maskSize: "contain",
                      maskPosition: "center",
                      maskRepeat: "no-repeat",
                    }}
                  />
                  <h3>{question.title}</h3>
                </div>
                <p className={styles.questionCount}>질문 {question.count}건</p>
                <div className={styles.answer}>
                  <p>{question.answer}</p>
                  <p>{demoMode ? "판매자 · 1분 전" : (question.answeredBy ?? "답변자 미확인")}</p>
                </div>
              </article>
            ))}
        </div>
      </div>
    </DialogBase>
  );
}
