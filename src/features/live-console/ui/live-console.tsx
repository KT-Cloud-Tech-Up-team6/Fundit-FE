"use client";

import Image from "next/image";
import { SellerShell } from "@/shared/components/layout/seller-shell";
import { useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { getLiveDemoConnection } from "@/features/buyer-live/model/live-demo";
import {
  consoleDemoReducer,
  createConsoleDemo,
  demoCues,
  demoQuestions,
} from "../model/console-demo";
import { Icon } from "@/shared/components/ui/icon";
import { CuePanel, MonitoringPanel, SellerChatPanel } from "./console-panels";
import { LiveCheckFlow, type CheckDialog } from "./live-check-flow";
import {
  demoOriginals,
  OriginalQuestions,
  QuestionManager,
  type ManagerView,
} from "./question-manager";
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
  const [notice, setNotice] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);
  const answered = demoQuestions
    .filter((q) => state.answers[q.id])
    .map((q) => ({
      id: q.id,
      title: q.title,
      count: q.originals.length,
      answer: state.answers[q.id],
    }));
  /* 목업 화면이라 실제 프로젝트가 없다 — 구매자 쪽 데모 매핑을 그대로 빌려 상세페이지 링크를 만든다.
     콘솔 라우트는 "demo" 접두만 검사해 매핑 없는 demo-* id도 들어올 수 있으므로, 매핑이
     실패하면 무관한 프로젝트로 보내는 대신 링크 자체를 비활성화한다. */
  const projectId = getLiveDemoConnection(liveId)?.projectId;

  useEffect(() => {
    if (state.phase !== "live") return;
    const started = Date.now();
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [state.phase]);

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
          <MonitoringPanel
            media={
              state.phase !== "loading" && (
                <Image
                  src="/images/seller-live/broadcast.png"
                  alt="LIVE 송출 예시"
                  fill
                  sizes="(min-width: 1024px) 384px, 100vw"
                  className="object-cover object-left"
                />
              )
            }
            viewers="0명"
            funding="0건 · 0원"
            elapsed={`00:${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`}
            onCheckStream={() =>
              setNotice("목업 미리보기입니다. 스트리밍 서버에 연결되어 있지 않습니다.")
            }
          />
          <div className="flex min-w-0 flex-col gap-4">
            <CuePanel cues={demoCues} collapsed={initialView === "cue-collapsed"} />
            <SellerChatPanel
              messages={state.messages}
              inactive={state.phase === "loading"}
              disabled={state.phase !== "live"}
              onSend={(text) => dispatch({ type: "chat", text })}
            />
          </div>
        </div>
        <footer className="sr-only">
          <p>LIVE 화면 목업 · {liveId} · 예시 질문·답변과 큐시트이며 새로고침 시 초기화됩니다.</p>
          {state.publishedIds.length > 0 && (
            <p>목업 LIVE 체크 {state.publishedIds.length}건 생성됨 · 실제 게시되지 않습니다.</p>
          )}
        </footer>
        {dialog && (
          <LiveCheckFlow
            dialog={dialog}
            onDialog={setDialog}
            questions={answered}
            renderOriginals={(questionId) => {
              const question = demoQuestions.find((q) => q.id === questionId);
              return question && <OriginalQuestions messages={demoOriginals(question)} />;
            }}
            onPublish={async (ids) => {
              dispatch({ type: "publish", ids });
              return { failed: [], notReady: [] };
            }}
            projectHref={projectId ? `/projects/${projectId}?tab=live-proof` : undefined}
            onClose={closeDialog}
          />
        )}
      </div>
    </SellerShell>
  );
}
