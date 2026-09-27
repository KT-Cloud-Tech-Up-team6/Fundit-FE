import assert from "node:assert/strict";
import test from "node:test";
import {
  getRefundEstimate,
  requestDefectRefund,
  requestExchange,
  requestReturn,
} from "./refund-request-api.ts";

const fundingId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32";

function recordFetch(t, response = { refundId: 1, status: "REQUESTED" }) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined });
    return Response.json(response);
  });
  return calls;
}

test("예상 금액은 넘긴 유형·사유만 쿼리에 싣는다", async (t) => {
  const calls = recordFetch(t, { orderId: fundingId, confirmed: true });
  await getRefundEstimate(fundingId);
  await getRefundEstimate(fundingId, { triggerType: "DEFECT", defectType: "WRONG_DELIVERY" });
  await getRefundEstimate(fundingId, { triggerType: "EXCHANGE", exchangeReason: "OTHER" });
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      `/api/v1/refunds/estimate?orderId=${fundingId}`,
      `/api/v1/refunds/estimate?orderId=${fundingId}&triggerType=DEFECT&defectType=WRONG_DELIVERY`,
      `/api/v1/refunds/estimate?orderId=${fundingId}&triggerType=EXCHANGE&exchangeReason=OTHER`,
    ],
  );
});

test("반품·하자·교환은 각자의 v2 계약과 사유 코드로 보낸다", async (t) => {
  const calls = recordFetch(t);
  await requestReturn({ fundingId, returnReason: "WRONG_OPTION", evidenceUrls: [] });
  await requestDefectRefund({
    fundingId,
    defectType: "WRONG_DELIVERY",
    reasonDetail: "다른 상품",
    evidenceUrls: ["https://cdn.example/a.jpg"],
  });
  await requestExchange({
    fundingId,
    exchangeReason: "DAMAGED",
    reasonDetail: "모서리 깨짐",
    evidenceUrls: [],
  });
  assert.deepEqual(calls, [
    {
      url: "/api/v2/refunds/return",
      method: "POST",
      body: { fundingId, returnReason: "WRONG_OPTION", evidenceUrls: [] },
    },
    {
      url: "/api/v2/refunds/defect",
      method: "POST",
      body: {
        fundingId,
        defectType: "WRONG_DELIVERY",
        reasonDetail: "다른 상품",
        evidenceUrls: ["https://cdn.example/a.jpg"],
      },
    },
    {
      url: "/api/v2/refunds/exchange",
      method: "POST",
      body: { fundingId, exchangeReason: "DAMAGED", reasonDetail: "모서리 깨짐", evidenceUrls: [] },
    },
  ]);
});
