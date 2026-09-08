import assert from "node:assert/strict";
import test from "node:test";
import {
  addMedia,
  canSubmit,
  daysSinceLastRecord,
  demoFulfillmentState,
  formatRecordDate,
  initialStage,
  isStale,
  maxImages,
  mediaCounts,
  mediaKindOf,
  removeMedia,
  staleAfterDays,
  todayValue,
} from "./fulfillment-demo.ts";

test("등록 버튼은 공백만 입력하면 비활성이다", () => {
  assert.equal(canSubmit(""), false);
  assert.equal(canSubmit("   \n"), false);
  assert.equal(canSubmit(" 생산 시작 "), true);
});

test("진입 단계는 진행중 → 첫 미완료 → 마지막 순으로 정해진다", () => {
  const state = demoFulfillmentState("2026-08-30");
  assert.equal(initialStage(state), "prep");

  state.prep.status = "done";
  assert.equal(initialStage(state), "production");

  state.production.status = "inspection" in state ? "done" : "done";
  state.inspection.status = "active";
  assert.equal(initialStage(state), "inspection");

  for (const stage of Object.keys(state)) state[stage].status = "done";
  assert.equal(initialStage(state), "delivery");
});

test("날짜는 00월 00일로 표시하고 형식이 다르면 원문을 유지한다", () => {
  assert.equal(formatRecordDate("2026-09-03"), "09월 03일");
  assert.equal(formatRecordDate("미정"), "미정");
  assert.match(todayValue(new Date(2026, 8, 3)), /^2026-09-03$/);
});

test("정체 경고는 마지막 기록 기준이고 완료 단계는 제외한다", () => {
  // 목업 날짜는 오늘 기준 상대값이라 기준일을 고정해서 만든다(-10일, -3일).
  const stage = demoFulfillmentState("2026-08-30").prep;
  assert.deepEqual(
    stage.records.map((record) => record.date),
    ["2026-08-20", "2026-08-27"],
  );
  assert.equal(daysSinceLastRecord(stage.records, "2026-09-04"), 8);
  assert.equal(daysSinceLastRecord([], "2026-09-04"), null);

  assert.equal(isStale(stage, "2026-09-04"), true);
  assert.equal(isStale(stage, "2026-08-30"), false);
  assert.equal(isStale({ ...stage, status: "done" }, "2026-09-04"), false);
  assert.equal(isStale({ status: "active", records: [] }, "2026-09-04"), false);
  assert.equal(isStale(stage, "2026-08-30", staleAfterDays - 4), true);
});

test("첨부는 사진 10장·동영상 1개까지만 받고 넘친 건 돌려준다", () => {
  const photo = (index) => ({ id: `p${index}`, kind: "image", name: `${index}.jpg`, url: null });
  const clip = (index) => ({ id: `v${index}`, kind: "video", name: `${index}.mp4`, url: null });

  const filled = addMedia(
    [],
    Array.from({ length: maxImages + 2 }, (_, i) => photo(i)),
  );
  assert.equal(filled.media.length, maxImages);
  assert.equal(filled.rejected.length, 2);

  const withClip = addMedia(filled.media, [clip(0), clip(1)]);
  assert.deepEqual(mediaCounts(withClip.media), { image: maxImages, video: 1 });
  assert.equal(withClip.rejected.length, 1);

  // 전부 거절되면 배열 정체성을 유지해 불필요한 리렌더를 만들지 않는다.
  assert.equal(addMedia(withClip.media, [photo(99)]).media, withClip.media);
  assert.equal(removeMedia(withClip.media, "p0").length, maxImages);
});

test("MIME 타입으로 첨부 종류를 가르고 그 외는 거른다", () => {
  assert.equal(mediaKindOf("image/png"), "image");
  assert.equal(mediaKindOf("video/mp4"), "video");
  assert.equal(mediaKindOf("application/pdf"), null);
});
