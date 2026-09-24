import assert from "node:assert/strict";
import test from "node:test";
import {
  answeredByName,
  formatElapsed,
  formatOrderStats,
  formatUpdatedAgo,
  formatViewers,
  orderStatsLabel,
  publishLiveChecks,
  questionSummaryState,
  toCheckQuestions,
  toConsoleCues,
} from "./seller-console.ts";
import { ApiError } from "../../../shared/api/api-error.ts";

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

test("주문 칸은 갱신이 잠깐 실패하면 마지막 값을 두고, 오래 실패하면 -로 바꾼다", () => {
  const data = { paidCount: 3, paidAmount: 45000 };
  const ok = { data, isError: false, dataUpdatedAt: 10_000, errorUpdatedAt: 0 };
  assert.equal(orderStatsLabel(ok, 15_000), "3건 · 45,000원");
  // 마지막 성공 뒤 10초 동안 실패: 깜빡이지 않게 마지막 값을 둔다.
  assert.equal(
    orderStatsLabel({ ...ok, isError: true, errorUpdatedAt: 20_000 }, 15_000),
    "3건 · 45,000원",
  );
  // 15초 넘게 실패가 이어지면 멈춘 값을 지금 값처럼 보이지 않는다.
  assert.equal(orderStatsLabel({ ...ok, isError: true, errorUpdatedAt: 25_000 }, 15_000), "-");
  // 한 번도 받지 못한 채 실패해도 -다.
  assert.equal(
    orderStatsLabel(
      { data: undefined, isError: true, dataUpdatedAt: 0, errorUpdatedAt: 5_000 },
      15_000,
    ),
    "-",
  );
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

test("LIVE 체크는 한 건씩 올리고 이미 올린 질문은 추가된 것으로, 요약 전 질문은 따로 돌려준다", async () => {
  const apiError = (code, status) => new ApiError({ code, status, message: code });
  const errors = {
    b: new Error("500"),
    c: apiError("LIVE_VERIFICATION_ALREADY_EXISTS", 409),
    d: apiError("LIVE_QUESTION_SUMMARY_NOT_FOUND", 404),
    e: apiError("NOT_FOUND", 404),
  };
  const sent = [];
  const result = await publishLiveChecks(
    ["a", "b", "c", "d", "e", "missing"],
    ["a", "b", "c", "d", "e"].map((id) => ({ id, answer: `답변 ${id}` })),
    async (body) => {
      sent.push(body);
      const error = errors[body.questionSummaryId];
      if (error) throw error;
    },
  );
  assert.deepEqual(
    sent,
    ["a", "b", "c", "d", "e"].map((id) => ({ questionSummaryId: id, answer: `답변 ${id}` })),
  );
  assert.deepEqual(result, { failed: ["b", "e", "missing"], notReady: ["d"] });
});
