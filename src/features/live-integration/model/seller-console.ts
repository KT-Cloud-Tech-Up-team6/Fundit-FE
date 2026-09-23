import type { CueSheetSegment } from "@/entities/live/model/live-cue-sheet";
import type { AiStatus, AnsweredQuestion } from "../api/live-api";
import { formatClock, formatPlaybackTime } from "./vod-chapters";

/* 실제 판매자 콘솔이 서버 응답을 Figma 콘솔 패널 모양으로 바꾸는 순수 함수들이다. */

/** 큐시트 구간 → 콘솔 큐 패널. 끝 시각은 앞 구간 길이를 누적한 값이고, 개요는 줄마다 한 항목이다. */
export function toConsoleCues(segments: CueSheetSegment[]) {
  let totalSec = 0;
  return segments.map((segment) => {
    totalSec += segment.duration;
    return {
      title: segment.title,
      until: formatClock(totalSec),
      outline: segment.outline
        .split("\n")
        .map((line) => line.replace(/^\s*[-•·*]\s*/, "").trim())
        .filter(Boolean),
      script: segment.script,
    };
  });
}

/** 방송 경과 시간. 서버가 주지 않으면(방송 중이 아님) 가짜 값 대신 `-`다. */
export function formatElapsed(totalSec: number | null | undefined) {
  if (totalSec == null || !Number.isFinite(totalSec)) return "-";
  return formatPlaybackTime(totalSec);
}

export function formatViewers(count: number | null | undefined) {
  return count == null ? "-" : `${count.toLocaleString("ko-KR")}명`;
}

/** Figma "2분 전" 자리. 아직 받은 적이 없으면 빈 문자열이다. */
export function formatUpdatedAgo(updatedAt: number, now: number) {
  if (!updatedAt) return "";
  const minutes = Math.floor(Math.max(0, now - updatedAt) / 60_000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  return `${Math.floor(minutes / 60)}시간 전`;
}

export function answeredByName(value: string) {
  return value === "AI" ? "AI 자동답변" : value === "SELLER" ? "판매자" : "답변자 미확인";
}

/**
 * 질문 요약 영역에 무엇을 그릴지. AI가 상품정보를 색인하기 전(`PREPARING`)과 색인은 끝났는데
 * 모인 질문이 없는 경우를 다른 문구로 안내한다(요구사항 6.4.4.4).
 */
export function questionSummaryState(aiStatus: AiStatus | undefined, total: number) {
  if (total > 0) return "list" as const;
  return aiStatus === "PREPARING" ? ("preparing" as const) : ("empty" as const);
}

/** 답변된 질문 → LIVE 체크 후보. 답변 본문이 없으면 올릴 내용이 없어 뺀다. */
export function toCheckQuestions(answered: AnsweredQuestion[]) {
  return answered
    .filter((item) => item.answerText?.trim())
    .map((item) => ({
      id: item.questionId,
      title: item.summaryText,
      count: item.questionCount,
      answer: item.answerText,
    }));
}

/**
 * 고른 질문을 한 건씩 LIVE 체크로 올리고 실패한 id를 돌려준다. BE가 한 번에 한 건만 받는다.
 * 순서대로 보내 같은 요청이 한꺼번에 몰리지 않게 한다.
 */
export async function publishLiveChecks(
  ids: string[],
  questions: { id: string; answer: string }[],
  create: (body: { questionSummaryId: string; answer: string }) => Promise<unknown>,
) {
  const failed: string[] = [];
  for (const id of ids) {
    const question = questions.find((item) => item.id === id);
    if (!question) {
      failed.push(id);
      continue;
    }
    try {
      await create({ questionSummaryId: id, answer: question.answer });
    } catch {
      failed.push(id);
    }
  }
  return failed;
}
