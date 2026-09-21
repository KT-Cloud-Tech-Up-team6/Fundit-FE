import assert from "node:assert/strict";
import test from "node:test";
import { partialSuccessMessage } from "./run-feedback.ts";

test("부분 성공 안내에 실패 슬롯과 실패 단계를 표시한다", () => {
  const message = partialSuccessMessage([
    { slot_id: "benefit-2", stage: "generation", error: {} },
    { slot_id: "cover", stage: "upload", error: {} },
  ]);

  assert.equal(
    message,
    "일부 이미지를 만들지 못해 나머지 결과만 표시합니다. 누락된 이미지: benefit-2(생성), cover(업로드)",
  );
});

test("실패 슬롯 목록이 비어 있어도 부분 성공을 안내한다", () => {
  assert.equal(
    partialSuccessMessage([]),
    "일부 이미지를 만들지 못해 생성된 나머지 결과만 표시합니다.",
  );
});
