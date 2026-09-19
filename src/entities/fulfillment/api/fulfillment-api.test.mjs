import test from "node:test";
import assert from "node:assert/strict";
import {
  findFundingProject,
  transitionStage,
  saveStageDetail,
  changeSchedule,
  registerShipment,
  confirmReceipt,
} from "./fulfillment-api.ts";
import {
  fulfillmentState,
  dateInKorea,
} from "../../../features/fulfillment-tracking/model/fulfillment-api-state.ts";

test("주문 UUID 관계는 서버 목록의 다음 페이지까지 조회해 확인한다", async () => {
  const original = fetch,
    calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return Response.json(
      url.includes("page=0")
        ? { content: [{ orderId: "other", projectId: "other-project" }], hasNext: true }
        : {
            content: [{ orderId: "funding", projectId: "server-project", projectTitle: "제목" }],
            hasNext: false,
          },
    );
  };
  try {
    assert.equal((await findFundingProject("funding")).projectId, "server-project");
    assert.equal(calls.length, 2);
    globalThis.fetch = async () => Response.json({ content: [], hasNext: false });
    await assert.rejects(findFundingProject("missing"), /찾을 수 없습니다/);
  } finally {
    globalThis.fetch = original;
  }
});
test("UUID 배송 경로와 단계 enum을 그대로 보내고 권한 오류를 숨기지 않는다", async () => {
  const original = fetch,
    calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, body: init.body && JSON.parse(init.body) });
    return Response.json({});
  };
  try {
    await transitionStage("project", "MANUFACTURING");
    await saveStageDetail("project", { stage: "MANUFACTURING", detailText: "기록" });
    await changeSchedule("project", {
      stage: "MANUFACTURING",
      reasonType: "OTHER",
      reasonDetail: "상세",
      newPlannedDate: "2026-10-01T00:00:00Z",
    });
    await registerShipment("project", "funding", { carrier: "택배사", trackingNumber: "123" });
    await confirmReceipt("project", "funding");
    assert.equal(calls[0].body.stage, "MANUFACTURING");
    assert.equal(calls[3].url, "/api/v2/projects/project/fundings/funding/shipment");
    assert.equal(
      calls[4].url,
      "/api/v2/projects/project/fundings/funding/shipment/confirm-receipt",
    );
    globalThis.fetch = async () => Response.json({ message: "권한 없음" }, { status: 403 });
    await assert.rejects(transitionStage("project", "INSPECTION"), /권한 없음/);
  } finally {
    globalThis.fetch = original;
  }
});
test("최신 기록만 화면 상태로 변환하며 한국 날짜와 서버 단계 상태를 유지한다", () => {
  const state = fulfillmentState({
    stages: [
      {
        stage: "PRODUCTION_START",
        status: "COMPLETED",
        detailText: "최신 내용",
        updatedAt: "2026-09-18T18:00:00Z",
      },
      { stage: "MANUFACTURING", status: "IN_PROGRESS" },
    ],
  });
  assert.equal(state.prep.records.length, 1);
  assert.equal(state.prep.records[0].date, "2026-09-19");
  assert.equal(state.production.status, "active");
  assert.equal(state.delivery.status, "todo");
  assert.equal(dateInKorea(undefined), "");
});
