import assert from "node:assert/strict";
import test from "node:test";
import { authTokenStore } from "@/shared/api/auth-token-store";
import { getProjectClips } from "./project-clips-api.ts";

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const live = (liveId) => ({
  liveId,
  introText: null,
  status: "ENDED",
  projectId: "project",
  thumbnailUrl: null,
  scheduledStartAt: "2026-09-15T01:00:00Z",
  likeCount: 0,
  createdAt: "2026-09-01T00:00:00Z",
});

const clip = (highlightId, startSec, generationStatus = "COMPLETED") => ({
  highlightId,
  sceneLabel: "SPEC",
  title: highlightId,
  startSec,
  endSec: startSec + 30,
  clipUrl: null,
  caption: null,
  isPublic: false,
  generationStatus,
  createdAt: "2026-09-15T03:00:00Z",
});

test("종료된 LIVE를 끝 페이지까지 받고 LIVE마다 판매자 하이라이트를 받아 합친다", async () => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/lives/mine") && url.includes("page=0"))
      return response({ content: [live("l1")], page: 0, size: 20, hasNext: true });
    if (url.includes("/lives/mine"))
      return response({ content: [live("l2")], page: 1, size: 20, hasNext: false });
    if (url.endsWith("/lives/l1/highlights"))
      return response({ markers: [clip("marker", 0)], clips: [clip("b", 90), clip("a", 10)] });
    return response({ markers: [], clips: [clip("c", 5), clip("x", 1, "FAILED")] });
  };
  try {
    authTokenStore.set("token");
    const clips = await getProjectClips("project");
    assert.deepEqual(
      clips.map((item) => [item.liveId, item.highlightId]),
      [
        ["l1", "a"],
        ["l1", "b"],
        ["l2", "c"],
      ],
    );
    const mine = calls.filter((url) => url.includes("/lives/mine"));
    assert.equal(mine.length, 2);
    assert.match(mine[0], /page=0&size=20&status=ENDED&projectId=project$/);
    assert.match(mine[1], /page=1&size=20/);
    assert.equal(calls.filter((url) => url.endsWith("/highlights")).length, 2);
  } finally {
    globalThis.fetch = originalFetch;
    authTokenStore.clear();
  }
});

test("LIVE 하나의 하이라이트 조회가 실패하면 목록 전체를 실패로 둔다", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/lives/mine"))
      return response({ content: [live("l1"), live("l2")], page: 0, size: 20, hasNext: false });
    if (url.endsWith("/lives/l2/highlights")) return response({ message: "서버 오류" }, 500);
    return response({ markers: [], clips: [clip("a", 1)] });
  };
  try {
    authTokenStore.set("token");
    await assert.rejects(getProjectClips("project"), { status: 500 });
  } finally {
    globalThis.fetch = originalFetch;
    authTokenStore.clear();
  }
});
