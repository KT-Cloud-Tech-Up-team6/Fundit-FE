import assert from "node:assert/strict";
import test from "node:test";
import { getMyRefunds } from "./refund-api.ts";
import { requestExchange } from "./refund-request-api.ts";

const fundingId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32";

test("진행 중만 보기와 유형은 서버 inProgress·triggerType 필터로 요청한다", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json({ content: [], totalElements: 0, hasNext: false });
  });
  await getMyRefunds(0, { inProgress: false });
  await getMyRefunds(2, { inProgress: true });
  await getMyRefunds(0, { inProgress: false, type: "취소" });
  await getMyRefunds(0, { inProgress: false, type: "교환" });
  await getMyRefunds(1, { inProgress: true, type: "환불" });
  assert.deepEqual(urls, [
    "/api/v2/refunds?page=0&size=20",
    "/api/v2/refunds?page=2&size=20&inProgress=true",
    "/api/v2/refunds?page=0&size=20&triggerType=SIMPLE_CHANGE_OF_MIND&triggerType=SHIPPING_DELAY",
    "/api/v2/refunds?page=0&size=20&triggerType=EXCHANGE",
    "/api/v2/refunds?page=1&size=20&inProgress=true&triggerType=DEFECT&triggerType=RETURN_CHANGE_OF_MIND&triggerType=GOAL_FAILED_AUTO&triggerType=SYSTEM_RECONCILIATION",
  ]);
});

test("교환 신청은 v2 전용 계약으로 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, method: init.method, body: JSON.parse(init.body) });
    return Response.json({ refundId: 1, status: "REQUESTED" }, { status: 201 });
  });
  await requestExchange({
    fundingId,
    reasonDetail: "상품 파손: 모서리 깨짐",
    evidenceUrls: ["https://cdn.example/evidence.jpg"],
  });
  assert.deepEqual(calls, [
    {
      url: "/api/v2/refunds/exchange",
      method: "POST",
      body: {
        fundingId,
        reasonDetail: "상품 파손: 모서리 깨짐",
        evidenceUrls: ["https://cdn.example/evidence.jpg"],
      },
    },
  ]);
});
