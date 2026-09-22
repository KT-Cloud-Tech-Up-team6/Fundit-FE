import assert from "node:assert/strict";
import test from "node:test";
import { consoleDemoReducer, createConsoleDemo } from "./console-demo.ts";

test("loading completes on data arrival and an ended console cannot resume", () => {
  const loading = createConsoleDemo("loading");
  const live = consoleDemoReducer(loading, { type: "loaded" });
  assert.equal(live.phase, "live");
  assert.equal(consoleDemoReducer(live, { type: "loaded" }), live);
  const ended = consoleDemoReducer(live, { type: "end" });
  assert.equal(ended.phase, "ended");
  assert.equal(consoleDemoReducer(ended, { type: "loaded" }), ended);
});

test("ending during loading preserves empty data and rejects late loading completion", () => {
  const loading = createConsoleDemo("loading");
  const ended = consoleDemoReducer(loading, { type: "end" });
  assert.equal(ended.phase, "ended");
  assert.deepEqual(ended.messages, []);
  assert.deepEqual(ended.answers, {});
  assert.equal(consoleDemoReducer(ended, { type: "loaded" }), ended);
  assert.equal(consoleDemoReducer(ended, { type: "end" }), ended);
});

test("chat rejects whitespace and messages outside a live session", () => {
  for (const phase of ["loading", "ended"]) {
    const state = createConsoleDemo(phase);
    assert.equal(consoleDemoReducer(state, { type: "chat", text: "hello" }), state);
  }
  const live = createConsoleDemo("live");
  assert.equal(consoleDemoReducer(live, { type: "chat", text: " \n " }), live);
  const next = consoleDemoReducer(live, { type: "chat", text: " hello " });
  assert.equal(next.messages.at(-1).text, "hello");
  assert.equal(next.messages.length, live.messages.length + 1);
  assert.equal(new Set(next.messages.map((message) => message.id)).size, next.messages.length);
});

test("sending an edited answer updates one question and appends seller chat", () => {
  const live = createConsoleDemo("live");
  const next = consoleDemoReducer(live, {
    type: "answer",
    questionId: "vacuum",
    text: " edited answer ",
  });
  assert.equal(next.answers.vacuum, "edited answer");
  assert.equal(next.messages.at(-1).text, "edited answer");
  assert.equal(next.messages.at(-1).author, "판매자");
  assert.equal(live.answers.vacuum, undefined);
  assert.equal(next.answers.gap, live.answers.gap);
  for (const questionId of ["models", "unknown"]) {
    assert.equal(consoleDemoReducer(live, { type: "answer", questionId, text: "answer" }), live);
  }
});

test("ended sessions reject replies and publish only answered unique questions", () => {
  const live = createConsoleDemo("live");
  assert.equal(consoleDemoReducer(live, { type: "publish", ids: ["gap"] }), live);
  const ended = consoleDemoReducer(live, { type: "end" });
  assert.equal(
    consoleDemoReducer(ended, { type: "answer", questionId: "vacuum", text: "late" }),
    ended,
  );
  const published = consoleDemoReducer(ended, {
    type: "publish",
    ids: ["gap", "gap", "models", "unknown"],
  });
  assert.deepEqual(published.publishedIds, ["gap"]);
  assert.deepEqual(ended.publishedIds, []);
});

test("manual completion never invents an answer or sends a chat", () => {
  const live = createConsoleDemo("live");
  const completed = consoleDemoReducer(live, { type: "complete", questionId: "models" });
  assert.ok(completed.completedIds.includes("models"));
  assert.equal(completed.answers.models, undefined);
  assert.equal(completed.messages, live.messages);
  const repeated = consoleDemoReducer(completed, { type: "complete", questionId: "models" });
  assert.equal(repeated.completedIds.filter((id) => id === "models").length, 1);
  const ended = consoleDemoReducer(completed, { type: "end" });
  assert.deepEqual(
    consoleDemoReducer(ended, { type: "publish", ids: ["models"] }).publishedIds,
    [],
  );
  for (const phase of ["loading", "ended"]) {
    const state = createConsoleDemo(phase);
    assert.equal(consoleDemoReducer(state, { type: "complete", questionId: "models" }), state);
  }
  assert.equal(consoleDemoReducer(live, { type: "complete", questionId: "unknown" }), live);
});
