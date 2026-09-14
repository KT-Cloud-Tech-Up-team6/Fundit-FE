import assert from "node:assert/strict";
import test from "node:test";
import {
  addMedia,
  canSubmit,
  completeStage,
  daysSinceLastRecord,
  demoBuyerFulfillmentState,
  demoFulfillmentState,
  formatRecordDate,
  formatShippingDate,
  initialStage,
  isStale,
  latestRecordId,
  maxImages,
  mediaCounts,
  mediaKindOf,
  removeMedia,
  sortRecordsByDateDesc,
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

test("완료 처리는 진행 중 단계만, 그리고 앞 단계를 되돌리지 않는다", () => {
  const base = demoFulfillmentState("2026-08-30"); // prep=active, 나머지 todo

  // 진행 전 단계는 완료할 수 없다 — 상태를 그대로(같은 참조로) 돌려준다.
  assert.equal(completeStage(base, "production"), base);

  // 진행 중 단계를 완료하면 다음 단계만 진행 중이 된다.
  const afterPrep = completeStage(base, "prep");
  assert.equal(afterPrep.prep.status, "done");
  assert.equal(afterPrep.production.status, "active");
  assert.equal(afterPrep.inspection.status, "todo");

  // 이어서 production을 완료해도 앞 단계(prep)의 완료 상태는 유지된다.
  const afterProduction = completeStage(afterPrep, "production");
  assert.equal(afterProduction.prep.status, "done");
  assert.equal(afterProduction.production.status, "done");
  assert.equal(afterProduction.inspection.status, "active");

  // 다음 단계가 이미 완료면 그 상태를 덮어쓰지 않는다.
  const inspectionDone = {
    ...afterPrep,
    inspection: { ...afterPrep.inspection, status: "done" },
  };
  assert.equal(completeStage(inspectionDone, "production").inspection.status, "done");

  // 마지막 단계 완료는 뒤 단계 없이 자기 상태만 바꾼다.
  const allButLast = {
    ...base,
    prep: { ...base.prep, status: "done" },
    production: { ...base.production, status: "done" },
    inspection: { ...base.inspection, status: "done" },
    release: { ...base.release, status: "done" },
    delivery: { ...base.delivery, status: "active" },
  };
  assert.equal(completeStage(allButLast, "delivery").delivery.status, "done");
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

test("발송일은 yyyy.mm.dd로 표시하고 형식이 다르면 원문을 유지한다", () => {
  assert.equal(formatShippingDate("2026-09-18"), "2026.09.18");
  assert.equal(formatShippingDate("2026-9-8"), "2026-9-8");
  assert.equal(formatShippingDate("미정"), "미정");
});

test("기록을 최신순으로 정렬하고 원본은 건드리지 않는다", () => {
  const records = [
    { id: "a", date: "2026-08-20", text: "", media: [] },
    { id: "b", date: "2026-08-27", text: "", media: [] },
    { id: "c", date: "2026-08-27", text: "", media: [] },
    { id: "d", date: "2026-08-10", text: "", media: [] },
  ];
  const sorted = sortRecordsByDateDesc(records);

  assert.deepEqual(
    sorted.map((record) => record.id),
    ["b", "c", "a", "d"],
  );
  // 같은 날짜(b, c)는 원래 순서를 유지한다.
  assert.notEqual(sorted, records);
  assert.equal(records[0].id, "a");
  assert.deepEqual(sortRecordsByDateDesc([]), []);
});

test("최신 기록 id는 가장 나중 날짜, 기록이 없으면 null", () => {
  const records = [
    { id: "old", date: "2026-08-01", text: "", media: [] },
    { id: "new", date: "2026-08-09", text: "", media: [] },
  ];
  assert.equal(latestRecordId(records), "new");
  assert.equal(latestRecordId([]), null);
});

test("구매자 목업 상태는 생산 진행 중이고 지연 기록을 포함한다", () => {
  const state = demoBuyerFulfillmentState("2026-08-30");

  assert.equal(state.stages.prep.status, "done");
  assert.equal(state.stages.production.status, "active");
  assert.equal(initialStage(state.stages), "production");
  assert.equal(state.stages.production.records.length, 4);
  assert.equal(state.stages.production.records.filter((record) => record.delayed).length, 1);
  assert.equal(state.stages.production.startDate, "2026-08-18");
  assert.match(formatShippingDate(state.expectedShippingDate), /^\d{4}\.\d{2}\.\d{2}$/);
  // 미래 단계는 기록 없이 예상 시작일만 갖는다.
  assert.equal(state.stages.inspection.records.length, 0);
  assert.ok(state.stages.inspection.startDate);
});
