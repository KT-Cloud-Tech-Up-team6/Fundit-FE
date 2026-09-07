import assert from "node:assert/strict";
import test from "node:test";
import { consoleDemoReducer, createConsoleDemo } from "./console-demo.ts";

test("only a ready console starts and a live console ends", () => {
  const ready = createConsoleDemo("ready");
  assert.equal(consoleDemoReducer(ready, { type: "end" }), ready);
  const live = consoleDemoReducer(ready, { type: "start" });
  assert.equal(live.phase, "live");
  assert.equal(consoleDemoReducer(live, { type: "start" }), live);
  const ended = consoleDemoReducer(live, { type: "end" });
  assert.equal(ended.phase, "ended");
  assert.equal(consoleDemoReducer(ended, { type: "start" }), ended);
});

test("chat rejects whitespace and messages outside a live session", () => {
  for (const phase of ["ready", "ended"]) {
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
