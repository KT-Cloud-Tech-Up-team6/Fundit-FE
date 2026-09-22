import assert from "node:assert/strict";
import test from "node:test";
import {
  getAnsweredQuestions,
  getInsights,
  getOriginals,
  getPlayback,
  getUnanswered,
  requestAnswer,
} from "./live-api.ts";
import { authTokenStore } from "@/shared/api/auth-token-store";

function response(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("live API keeps UUID paths, tokens, answer payloads, and abort signals", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    calls.push([String(input), init]);
    if (String(input).endsWith("/playback"))
      return response({
        liveId: "live",
        type: "LIVE",
        playbackUrl: "https://example.test/live.m3u8",
        projectId: "project",
        likeCount: 3,
        vodReadyAt: null,
      });
    if (String(input).includes("answered-questions")) return response([]);
    if (String(input).includes("insights")) return response({ qna: [] });
    if (String(input).includes("unanswered")) return response({ pending: [], answered: [] });
    if (String(input).includes("/ai-answer"))
      return response({ draftAnswer: null, referenceChunks: [], sent: false });
    return response([]);
  };
  try {
    authTokenStore.set("live-token");
    const controller = new AbortController();
    await getPlayback("7b3f0d3e-4bdf-4f7a-8e05-3046ec739d87", controller.signal);
    await getAnsweredQuestions("live");
    await getInsights("live");
    await getUnanswered("live");
    await getOriginals("live", "question");
    await requestAnswer("live", "question", { action: "GENERATE" });
    await requestAnswer(
      "live",
      "question",
      { action: "SEND", finalAnswer: "edited" },
      controller.signal,
    );
    assert.match(calls[0][0], /\/api\/v1\/lives\/7b3f0d3e-4bdf-4f7a-8e05-3046ec739d87\/playback$/);
    assert.equal(calls[0][1].signal, controller.signal);
    assert.equal(calls[2][1].headers.get("Authorization"), "Bearer live-token");
    assert.equal(calls[5][1].method, "POST");
    assert.deepEqual(JSON.parse(calls[5][1].body), { action: "GENERATE" });
    assert.equal(calls[6][1].signal, controller.signal);
    assert.deepEqual(JSON.parse(calls[6][1].body), { action: "SEND", finalAnswer: "edited" });
  } finally {
    globalThis.fetch = originalFetch;
    authTokenStore.clear();
  }
});
