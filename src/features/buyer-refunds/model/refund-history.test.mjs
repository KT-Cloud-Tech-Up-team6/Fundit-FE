import assert from "node:assert/strict";
import test from "node:test";
import { refundSummariesDemo } from "./refunds-demo.ts";
import {
  parseRefundFilterType,
  refundTypeOfFilter,
  refundTypeOptions,
  toRefundEntry,
} from "./refund-history.ts";

const entries = refundSummariesDemo.map(toRefundEntry);
const [delayed, cancelled, defect, exchange, returned, rejected, degraded] = entries;

test("트리거와 상태를 원본의 유형·진행상태 문구로 옮긴다", () => {
  assert.deepEqual(
    entries.map((entry) => entry.status),
    [
      "취소 진행 중",
      "취소 완료",
      "환불 완료",
      "교환 완료",
      "환불 진행 중",
      "환불 반려",
      "환불 진행 중",
    ],
  );
});

test("실 환불 금액은 환불이 끝난 취소·환불 건에만 고지한다", () => {
  assert.equal(cancelled.cash, 199000);
  assert.equal(defect.cash, 23000);
  assert.equal(delayed.cash, null);
  assert.equal(returned.cash, null);
  assert.equal(rejected.cash, null);
});

test("교환은 완료돼도 결제 원금인 amount를 실 환불 금액으로 보이지 않는다", () => {
  assert.equal(exchange.stage, "완료");
  assert.equal(exchange.cash, null);
});

test("사유 유형은 신청 화면의 사유 문구로 옮기고 상세를 잇는다", () => {
  assert.equal(defect.reason, "상품 파손 · 배송 중 뚜껑이 깨졌습니다");
  assert.equal(exchange.reason, "불량·하자 · 펌프가 눌리지 않습니다");
  assert.equal(rejected.reason, "불량·하자 · 향이 나지 않습니다");
  assert.equal(returned.reason, "옵션 선택 오류");
});

test("취소·반품·교환의 사유 enum을 모두 한국어 문구로 옮긴다", () => {
  const labels = {
    SIMPLE_CHANGE_OF_MIND: "단순 변심",
    PAYMENT_INFO_ERROR: "결제 정보 오류",
    OPTION_SELECTION_ERROR: "옵션 선택 오류",
    ETC: "기타",
    CHANGE_OF_MIND: "단순 변심",
    WRONG_OPTION: "옵션 선택 오류",
    DEFECTIVE: "불량·하자",
    DAMAGED: "상품 파손",
    WRONG_DELIVERY: "상품이 잘못 배송됨",
    MISSING_COMPONENTS: "구성품 누락",
    DIFFERENT_FROM_DESCRIPTION: "상품 설명과 다름",
    OTHER: "기타",
  };
  for (const [reasonType, label] of Object.entries(labels)) {
    assert.equal(
      toRefundEntry({ ...refundSummariesDemo[5], reasonType }).reason,
      `${label} · 향이 나지 않습니다`,
    );
  }
  assert.equal(
    toRefundEntry({ ...refundSummariesDemo[5], reasonType: "NEW_REASON" }).reason,
    "NEW_REASON · 향이 나지 않습니다",
  );
});

test("사유 유형이 없으면 상세 원문을, 둘 다 없으면 트리거 문구를 쓴다", () => {
  assert.equal(delayed.reason, "발송 지연");
  assert.equal(cancelled.reason, "참여 취소");
  assert.equal(degraded.reason, "목표 미달 자동 환불");
  /* 태그 없이 저장된 옛 교환 신청은 서버가 원문을 그대로 reasonDetail로 준다. */
  const legacy = toRefundEntry({
    ...refundSummariesDemo[3],
    reasonType: undefined,
    reasonDetail: "상품 파손: 모서리가 깨졌습니다",
  });
  assert.equal(legacy.reason, "상품 파손: 모서리가 깨졌습니다");
  assert.equal(toRefundEntry({ ...refundSummariesDemo[4], reasonType: undefined }).reason, "반품");
});

test("반품 트리거는 환불 유형이다", () => {
  assert.equal(returned.type, "환불");
});

test("반려 사유는 반려된 건에만 담긴다", () => {
  assert.equal(rejected.rejectedReason, "제품 하자가 확인되지 않았습니다");
  assert.equal(defect.rejectedReason, "");
});

test("order-service degrade 응답도 항목 자리를 유지한다", () => {
  assert.equal(degraded.title, "");
  assert.deepEqual(degraded.items, [{ product: "", option: "", price: null, quantity: null }]);
});

test("날짜는 서버 시각(UTC)을 한국 날짜로 옮긴다", () => {
  assert.equal(cancelled.requestedAt, "2026.09.01");
  assert.equal(cancelled.completedAt, "2026.09.13");
  assert.equal(delayed.completedAt, "");
});

test("한국 시간 새벽(UTC 전날 15시 이후) 신청·완료는 한국 날짜로 보인다", () => {
  const [base] = refundSummariesDemo;
  const entry = toRefundEntry({
    ...base,
    requestedAt: "2026-09-27T18:00:00Z",
    completedAt: "2026-09-27T14:59:59Z",
  });
  assert.equal(entry.requestedAt, "2026.09.28");
  assert.equal(entry.completedAt, "2026.09.27");
});

test("상품 옵션은 그룹과 값을 이어 옵션 행에 담는다", () => {
  assert.equal(exchange.items[0].option, "용량 50ml · 향 우디");
  assert.equal(cancelled.items[0].option, "");
});

test("유형 드롭다운은 원본 순서이고 URL 값을 서버 유형으로 옮긴다", () => {
  assert.deepEqual(
    refundTypeOptions.map((option) => option.label),
    ["전체", "취소", "교환", "환불"],
  );
  assert.deepEqual(
    refundTypeOptions.map((option) => refundTypeOfFilter(option.value)),
    [undefined, "취소", "교환", "환불"],
  );
  assert.equal(parseRefundFilterType("exchange"), "exchange");
  assert.equal(parseRefundFilterType(null), "all");
  assert.equal(parseRefundFilterType("반품"), "all");
});
