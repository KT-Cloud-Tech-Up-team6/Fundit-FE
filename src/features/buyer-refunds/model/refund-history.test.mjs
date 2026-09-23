import assert from "node:assert/strict";
import test from "node:test";
import { refundSummariesDemo } from "./refunds-demo.ts";
import { filterRefundEntries, toRefundEntry } from "./refund-history.ts";

const entries = refundSummariesDemo.map(toRefundEntry);
const [delayed, cancelled, defect, rejected, degraded] = entries;

test("트리거와 상태를 원본의 유형·진행상태 문구로 옮긴다", () => {
  assert.deepEqual(
    [delayed.status, cancelled.status, defect.status, rejected.status, degraded.status],
    ["취소 진행 중", "취소 완료", "환불 완료", "환불 반려", "환불 진행 중"],
  );
});

test("환불이 끝난 건만 실 환불 금액을 고지한다", () => {
  assert.equal(cancelled.cash, 199000);
  assert.equal(defect.cash, 23000);
  assert.equal(delayed.cash, null);
  assert.equal(rejected.cash, null);
});

test("하자 유형 태그는 한국어 문구와 설명으로 나뉜다", () => {
  assert.equal(defect.reason, "상품 파손 · 배송 중 뚜껑이 깨졌습니다");
  assert.equal(rejected.reason, "불량·하자 · 향이 나지 않습니다");
});

test("사유가 비어 오는 자동 환불은 트리거 문구를 쓴다", () => {
  assert.equal(delayed.reason, "발송 지연");
  assert.equal(degraded.reason, "목표 미달 자동 환불");
});

test("반려 사유는 반려된 건에만 담긴다", () => {
  assert.equal(rejected.rejectedReason, "제품 하자가 확인되지 않았습니다");
  assert.equal(defect.rejectedReason, "");
});

test("order-service degrade 응답도 항목 자리를 유지한다", () => {
  assert.equal(degraded.title, "");
  assert.deepEqual(degraded.items, [{ product: "", option: "", price: null, quantity: null }]);
});

test("날짜는 서버 시각의 앞 10자리만 쓴다", () => {
  assert.equal(cancelled.requestedAt, "2026.09.01");
  assert.equal(cancelled.completedAt, "2026.09.13");
  assert.equal(delayed.completedAt, "");
});

const exchange = toRefundEntry({
  ...refundSummariesDemo[0],
  refundId: 99,
  triggerType: "EXCHANGE",
  status: "REQUESTED",
  reasonDetail: "상품 파손: 모서리가 깨졌습니다",
  lineItems: [
    {
      rewardName: "센트모먼트 바디미스트",
      quantity: 1,
      unitPrice: 12000,
      options: [
        { optionGroupName: "용량", optionValue: "50ml" },
        { optionGroupName: "향", optionValue: "우디" },
      ],
    },
  ],
});

test("교환 트리거는 교환 유형이며 REQUESTED에서 진행 중으로 남는다", () => {
  assert.equal(exchange.type, "교환");
  assert.equal(exchange.status, "교환 진행 중");
  assert.equal(exchange.cash, null);
  assert.deepEqual(
    filterRefundEntries([...entries, exchange], "교환", false).map((entry) => entry.id),
    ["99"],
  );
  assert.equal(filterRefundEntries(entries, "교환", false).length, 0);
});

test("교환 사유는 FE가 보낸 라벨과 설명으로 나뉜다", () => {
  assert.equal(exchange.reason, "상품 파손 · 모서리가 깨졌습니다");
});

test("상품 옵션은 그룹과 값을 이어 옵션 행에 담는다", () => {
  assert.equal(exchange.items[0].option, "용량 50ml · 향 우디");
  assert.equal(cancelled.items[0].option, "");
});

test("유형과 진행 중만 보기는 함께 적용된다", () => {
  assert.deepEqual(
    filterRefundEntries(entries, "취소", false).map((entry) => entry.id),
    [delayed.id, cancelled.id],
  );
  assert.deepEqual(
    filterRefundEntries(entries, "전체", true).map((entry) => entry.id),
    [delayed.id, degraded.id],
  );
  assert.deepEqual(
    filterRefundEntries(entries, "취소", true).map((entry) => entry.id),
    [delayed.id],
  );
});
