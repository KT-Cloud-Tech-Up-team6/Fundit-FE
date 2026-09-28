import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "@/shared/api/api-error";
import { isUnavailableLive, LIVE_ALREADY_STARTED, liveFailureReason } from "./live-error";

const apiError = (status: number, message = "내부 문구") =>
  new ApiError({ code: "E", message, status });

test("BE message 대신 상태별 문구를 쓴다", () => {
  const reason = liveFailureReason(apiError(503, "AI 호출 실패: http://ai.internal"));
  assert.equal(reason, "잠시 후 다시 시도해 주세요.");
  assert.equal(liveFailureReason(apiError(400)), "입력한 내용을 확인해 주세요.");
  assert.match(liveFailureReason(apiError(404)), /LIVE를 찾을 수 없거나 권한이 없습니다/);
  assert.equal(liveFailureReason(apiError(403)), liveFailureReason(apiError(404)));
  assert.match(liveFailureReason(apiError(429)), /요청이 많습니다/);
});

test("409는 부르는 쪽 문구를 쓰고, 없으면 시작·종료한 LIVE로 안내한다", () => {
  assert.equal(liveFailureReason(apiError(409)), LIVE_ALREADY_STARTED);
  assert.equal(liveFailureReason(apiError(409), "생성 중입니다."), "생성 중입니다.");
});

test("네트워크 오류와 알 수 없는 오류를 나눈다", () => {
  assert.equal(liveFailureReason(new TypeError("Failed to fetch")), "인터넷 연결을 확인해 주세요.");
  assert.equal(
    liveFailureReason(new Error("LIVE 식별자를 받지 못했습니다.")),
    "잠시 후 다시 시도해 주세요.",
  );
});

test("LIVE 자체를 볼 수 없는 경우만 골라낸다", () => {
  assert.equal(isUnavailableLive(apiError(404)), true);
  assert.equal(isUnavailableLive(apiError(403)), true);
  assert.equal(isUnavailableLive(apiError(500)), false);
  assert.equal(isUnavailableLive(new TypeError("Failed to fetch")), false);
});
