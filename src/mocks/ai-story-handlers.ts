import { http, HttpResponse } from "msw";
const sessionId = "88888888-8888-4888-8888-888888888888";
const runId = "99999999-9999-4999-8999-999999999999";
let runStatus: "running" | "discarded" = "running";

/** QA-189 Playwright가 실제 FE 요청·모달 흐름을 AI 서버 없이 검증하는 고정 run이다. */
export const aiStoryHandlers = [
  http.get("*/api/v1/ai/sessions/latest", () => {
    return HttpResponse.json({
      session: {
        session_id: sessionId,
        revision: 1,
        messages: [{ role: "assistant", text: "요약을 확인해주세요." }],
        missing: [],
        summary: {
          product: "QA-189 테스트 제품",
          story: "생성 중 닫기 검증",
          strengths: [{ title: "강점", description: "폐기 흐름" }],
        },
        active_chat_id: null,
      },
    });
  }),
  http.post(`*/api/v1/ai/sessions/${sessionId}/confirm`, () => {
    return HttpResponse.json({ session_id: sessionId, confirmed_revision: 1 });
  }),
  http.post("*/api/v1/ai/runs", () => {
    runStatus = "running";
    return HttpResponse.json({ run_id: runId, status: "queued" }, { status: 202 });
  }),
  http.get(`*/api/v1/ai/runs/${runId}`, () => {
    return HttpResponse.json({
      run_id: runId,
      status: runStatus,
      result: null,
      failed_slots: [],
      error: null,
    });
  }),
  http.post("*/api/v1/ai/runs/discard", async ({ request }) => {
    const body = (await request.json()) as { run_id?: string };
    if (body.run_id !== runId) {
      return HttpResponse.json(
        { code: "INVALID_RUN", message: "잘못된 run입니다." },
        { status: 400 },
      );
    }
    runStatus = "discarded";
    return new HttpResponse(null, { status: 204 });
  }),
];
