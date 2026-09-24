import assert from "node:assert/strict";
import test from "node:test";
import {
  answeredByName,
  formatElapsed,
  formatOrderStats,
  formatUpdatedAgo,
  formatViewers,
  publishLiveChecks,
  questionSummaryState,
  toCheckQuestions,
  toConsoleCues,
} from "./seller-console.ts";

test("큐시트 구간은 누적 끝 시각과 줄 단위 개요로 바꾼다", () => {
  const cues = toConsoleCues([
    {
      id: "1",
      title: "오프닝",
      duration: 60,
      outline: "- 인사\n\n• 제품 한 줄 소개",
      script: "대사",
    },
    { id: "2", title: "시연", duration: 150, outline: "시연 순서", script: "" },
  ]);
  assert.deepEqual(
    cues.map((cue) => [cue.title, cue.until, cue.outline]),
    [
      ["오프닝", "01:00", ["인사", "제품 한 줄 소개"]],
      ["시연", "03:30", ["시연 순서"]],
    ],
  );
});

test("경과 시간·시청자 수는 모르면 가짜 값 대신 -로 적는다", () => {
  assert.equal(formatElapsed(3725), "01:02:05");
  assert.equal(formatElapsed(null), "-");
  assert.equal(formatViewers(1234), "1,234명");
  assert.equal(formatViewers(null), "-");
});

test("방송 주문은 결제 완료 건수·금액만 적고, 받기 전에는 -로 적는다", () => {
  assert.equal(
    formatOrderStats({
      paidCount: 1234,
      paidAmount: 3400000,
      pendingCount: 9,
      pendingAmount: 90000,
    }),
    "1,234건 · 3,400,000원",
  );
  assert.equal(formatOrderStats({ paidCount: 0, paidAmount: 0 }), "0건 · 0원");
  assert.equal(formatOrderStats(undefined), "-");
});

test("갱신 시각은 방금 전·분·시간 단위로 적는다", () => {
  const now = 10 * 60 * 60_000;
  assert.equal(formatUpdatedAgo(0, now), "");
  assert.equal(formatUpdatedAgo(now - 30_000, now), "방금 전");
  assert.equal(formatUpdatedAgo(now - 2 * 60_000, now), "2분 전");
  assert.equal(formatUpdatedAgo(now - 125 * 60_000, now), "2시간 전");
});

test("답변 주체는 AI 자동답변·판매자로 적는다", () => {
  assert.equal(answeredByName("AI"), "AI 자동답변");
  assert.equal(answeredByName("SELLER"), "판매자");
  assert.equal(answeredByName("NONE"), "답변자 미확인");
});

test("질문이 없을 때 AI 준비 중과 모인 질문 없음을 나눈다", () => {
  assert.equal(questionSummaryState("PREPARING", 0), "preparing");
  assert.equal(questionSummaryState("READY", 0), "empty");
  assert.equal(questionSummaryState(undefined, 0), "empty");
  assert.equal(questionSummaryState("PREPARING", 2), "list");
});

test("LIVE 체크 후보는 답변 본문이 있는 질문만이다", () => {
  const item = (questionId, answerText) => ({
    questionId,
    summaryText: `${questionId} 질문`,
    questionCount: 3,
    answerText,
    answeredBy: "SELLER",
    answeredAt: null,
  });
  assert.deepEqual(toCheckQuestions([item("a", "답변"), item("b", "  ")]), [
    { id: "a", title: "a 질문", count: 3, answer: "답변" },
  ]);
});

test("LIVE 체크는 한 건씩 올리고 실패·알 수 없는 id만 돌려준다", async () => {
  const sent = [];
  const failed = await publishLiveChecks(
    ["a", "b", "missing"],
    [
      { id: "a", answer: "답변 A" },
      { id: "b", answer: "답변 B" },
    ],
    async (body) => {
      sent.push(body);
      if (body.questionSummaryId === "b") throw new Error("500");
    },
  );
  assert.deepEqual(sent, [
    { questionSummaryId: "a", answer: "답변 A" },
    { questionSummaryId: "b", answer: "답변 B" },
  ]);
  assert.deepEqual(failed, ["b", "missing"]);
});
