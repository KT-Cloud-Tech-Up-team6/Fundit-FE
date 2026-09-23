import assert from "node:assert/strict";
import test from "node:test";
import { getMyRefunds } from "./refund-api.ts";
import { requestExchange, requestSimpleChangeOfMindRefund } from "./refund-request-api.ts";

const fundingId = "0198f2b1-2c3d-7a1e-9c4f-6a2b1e0d8f32";

test("진행 중만 보기는 서버 inProgress 필터로 요청한다", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json({ content: [], totalElements: 0, hasNext: false });
  });
  await getMyRefunds(0, false);
  await getMyRefunds(2, true);
  assert.deepEqual(urls, [
    "/api/v2/refunds?page=0&size=20",
    "/api/v2/refunds?page=2&size=20&inProgress=true",
  ]);
});

test("단순변심·교환 신청은 v2 전용 계약으로 보낸다", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, method: init.method, body: JSON.parse(init.body) });
    return Response.json({ refundId: 1, status: "REQUESTED" }, { status: 201 });
  });
  await requestSimpleChangeOfMindRefund(fundingId);
  await requestExchange({
    fundingId,
    reasonDetail: "상품 파손: 모서리 깨짐",
    evidenceUrls: ["https://cdn.example/evidence.jpg"],
  });
  assert.deepEqual(calls, [
    {
      url: "/api/v2/refunds/simple-change-of-mind",
      method: "POST",
      body: { fundingId },
    },
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
