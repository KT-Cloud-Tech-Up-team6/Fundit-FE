import assert from "node:assert/strict";
import test from "node:test";
import { aiSummaryState, isAiSummaryGenerating } from "./ai-summary";

const section = (role: string, headline: string, description: string) => ({
  role,
  headline,
  description,
});

test("완료된 요약은 WHAT → WHY 순서로 제목·본문을 채운다", () => {
  assert.deepEqual(
    aiSummaryState({
      status: "SUCCEEDED",
      sections: [
        section(
          "WHY",
          " 매일 청소가 번거로운 1인 가구 ",
          "무거운 청소기를 꺼내기 싫은 순간을 줄입니다.",
        ),
        section(
          "WHAT",
          "꺼내는 순간 쓱, 무선 청소기",
          "1.2kg 무게에 35,000Pa 흡입력을 담았습니다.",
        ),
      ],
    }),
    {
      status: "ready",
      items: [
        {
          title: "꺼내는 순간 쓱, 무선 청소기",
          body: "1.2kg 무게에 35,000Pa 흡입력을 담았습니다.",
        },
        {
          title: "매일 청소가 번거로운 1인 가구",
          body: "무거운 청소기를 꺼내기 싫은 순간을 줄입니다.",
        },
      ],
    },
  );
});

test("생성 중이면 자리만 잡고, 요약이 없거나 비었으면 카드를 그리지 않는다", () => {
  assert.deepEqual(aiSummaryState({ status: "GENERATING" }), { status: "generating" });
  assert.equal(isAiSummaryGenerating({ status: "GENERATING", sections: null }), true);
  assert.equal(aiSummaryState(undefined), null);
  assert.equal(aiSummaryState(null), null);
  assert.equal(aiSummaryState({ status: "FAILED" }), null);
  assert.equal(aiSummaryState({ status: "SUCCEEDED", sections: [] }), null);
  // WHAT·WHY 중 하나라도 제목이나 본문이 비면 완료로 보지 않고, 모르는 role로 채우지 않는다.
  assert.equal(
    aiSummaryState({
      status: "SUCCEEDED",
      sections: [
        section("WHAT", "제목", " "),
        section("HOW", "제목", "본문"),
        section("WHY", "왜", "이유"),
      ],
    }),
    null,
  );
});
