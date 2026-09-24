import test from "node:test";
import assert from "node:assert/strict";
import {
  findFundingProject,
  transitionStage,
  saveStageDetail,
  changeSchedule,
  registerShipment,
  confirmReceipt,
  getSellerShipments,
  saveShipmentDraft,
} from "./fulfillment-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";
import {
  fulfillmentState,
  dateInKorea,
} from "../../../features/fulfillment-tracking/model/fulfillment-api-state.ts";

test("주문 UUID 관계는 v1 목록의 다음 페이지까지 조회해 확인한다", async () => {
  const original = fetch,
    calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (!url.startsWith("/api/v1/orders?")) {
      return Response.json({ message: "없는 API 경로" }, { status: 404 });
    }
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
    assert.deepEqual(calls, ["/api/v1/orders?page=0&size=100", "/api/v1/orders?page=1&size=100"]);
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
test("판매자 송장은 한 페이지 fundingIds를 쉼표로 묶어 조회하고 저장은 발송과 다른 draft 경로로 보낸다", async (t) => {
  authTokenStore.set("seller-token");
  t.after(() => authTokenStore.clear());
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json(url.includes("/shipments?") ? [] : { status: "PREPARING" });
  });

  await getSellerShipments("project", ["a", "b"]);
  await saveShipmentDraft("project", "funding", { carrier: "CJ대한통운", trackingNumber: "123" });
  const list = new URL(calls[0].url, "https://example.com");
  assert.equal(list.pathname, "/api/v2/projects/project/shipments");
  assert.equal(list.searchParams.get("fundingIds"), "a,b");
  assert.equal(calls[1].url, "/api/v2/projects/project/fundings/funding/shipment/draft");
  assert.equal(calls[1].init.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    carrier: "CJ대한통운",
    trackingNumber: "123",
  });
  for (const { init } of calls)
    assert.equal(new Headers(init.headers).get("Authorization"), "Bearer seller-token");
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
