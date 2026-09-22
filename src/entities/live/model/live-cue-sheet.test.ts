import assert from "node:assert/strict";
import test from "node:test";
import {
  CUE_SHEET_MAX_MINUTES,
  parseCueSheetSegments,
  toCueSheetMinutes,
  toCueSheetMode,
  toCueSheetSegmentBody,
  toCueSheetState,
  toCueSheetType,
  toTargetDurationSec,
} from "./live-cue-sheet";
import type { CueSheetResponse } from "../api/live-cue-sheet-api";

const segments = JSON.stringify([
  { id: "s-1", title: "오프닝", duration: 30, outline: "인사", script: "안녕하세요." },
  { id: "s-2", title: "시연", duration: 90, outline: "사용 시연", script: "보여드릴게요." },
]);

const response = (overrides: Partial<CueSheetResponse> = {}): CueSheetResponse => ({
  status: "COMPLETED",
  mode: "SCRIPT",
  totalDurationSec: 300,
  segments,
  failureReason: null,
  ...overrides,
});

test("구간 JSON을 화면이 쓰는 모양으로 읽는다", () => {
  const parsed = parseCueSheetSegments(segments);
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    id: "s-1",
    title: "오프닝",
    duration: 30,
    outline: "인사",
    script: "안녕하세요.",
  });
});

test("깨진 JSON·배열이 아닌 응답은 빈 목록이다", () => {
  assert.deepEqual(parseCueSheetSegments("{not json"), []);
  assert.deepEqual(parseCueSheetSegments('{"segments":[]}'), []);
  assert.deepEqual(parseCueSheetSegments(null), []);
  assert.deepEqual(parseCueSheetSegments(""), []);
});

test("빠진 필드는 지어내지 않고 빈 값으로 둔다", () => {
  const parsed = parseCueSheetSegments('[{"title":"오프닝"},"문자열",null,{"duration":-5}]');
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], {
    id: "segment-1",
    title: "오프닝",
    duration: 0,
    outline: "",
    script: "",
  });
  /* 배열 인덱스가 아니라 걸러진 뒤 순번으로 id를 채운다 — 화면 key 충돌만 막으면 된다. */
  assert.equal(parsed[1].duration, 0);
});

test("생성 중·성공·실패·미요청을 구분한다", () => {
  assert.equal(
    toCueSheetState(response({ status: "GENERATING", segments: null })).phase,
    "generating",
  );
  assert.equal(toCueSheetState(response()).phase, "completed");
  assert.equal(
    toCueSheetState(response({ status: "FAILED", segments: null, failureReason: "AI 오류" })).phase,
    "failed",
  );
  assert.equal(toCueSheetState(undefined).phase, "idle");
  assert.equal(toCueSheetState(null).phase, "idle");
});

test("실패 사유를 그대로 전달한다", () => {
  const state = toCueSheetState(
    response({ status: "FAILED", segments: null, failureReason: "AI가 응답하지 않았습니다." }),
  );
  assert.equal(state.failureReason, "AI가 응답하지 않았습니다.");
  assert.deepEqual(state.segments, []);
});

test("COMPLETED인데 구간이 비어 있으면 성공으로 그리지 않는다", () => {
  const state = toCueSheetState(response({ segments: "[]" }));
  assert.equal(state.phase, "failed");
  assert.equal(state.failureReason, "AI가 큐시트 구간을 비워 보냈습니다.");
});

test("생성 중에는 이전 구간을 성공처럼 들고 있지 않는다", () => {
  const state = toCueSheetState(response({ status: "GENERATING" }));
  assert.equal(state.phase, "generating");
  assert.deepEqual(state.segments, []);
});

test("방송 시간은 분과 초를 오간다", () => {
  assert.equal(toTargetDurationSec(5), 300);
  assert.equal(toTargetDurationSec(0), 60);
  assert.equal(toTargetDurationSec(99), CUE_SHEET_MAX_MINUTES * 60);
  assert.equal(toCueSheetMinutes(300), 5);
  assert.equal(toCueSheetMinutes(301), 6);
  assert.equal(toCueSheetMinutes(0), null);
  assert.equal(toCueSheetMinutes(null), null);
});

test("유형과 mode를 옮긴다", () => {
  assert.equal(toCueSheetMode("scenario"), "SCENARIO");
  assert.equal(toCueSheetMode("script"), "SCRIPT");
  assert.equal(toCueSheetType("SCENARIO"), "scenario");
  assert.equal(toCueSheetType(null), null);
});

test("저장 본문은 다섯 필드만 담는다", () => {
  const body = toCueSheetSegmentBody([
    { id: "s-1", title: "오프닝", duration: 30, outline: "인사", script: "안녕하세요." },
  ]);
  assert.deepEqual(Object.keys(body[0]), ["id", "title", "duration", "outline", "script"]);
});
