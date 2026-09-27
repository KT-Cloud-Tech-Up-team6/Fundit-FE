import assert from "node:assert/strict";
import test from "node:test";
import {
  demoFundingDetail,
  formatKoreanDate,
  formatWon,
  fundingActions,
  toFundingCard,
  toFundingDetailView,
} from "./funding-history.ts";
import { demoOrderSummaries } from "./funding-orders-demo.ts";

const returnActions = ["RETURN_REQUEST", "EXCHANGE_REQUEST", "DEFECT_REFUND_REQUEST"];

function order(progressStage, availableActions = [], refundRequests = []) {
  return { orderId: "o1", progressStage, availableActions, refundRequests };
}

function request(triggerType, status = "REQUESTED") {
  return { refundId: 1, triggerType, status, requestedAt: "2026-09-20T01:00:00Z" };
}

function buttons(actions) {
  return actions.map(({ label, href }) => (href ? `${label} ${href}` : `${label} (비활성)`));
}

test("진행 중·발송 지연은 서버가 허락할 때만 참여 취소를 두고 제작·배송 현황을 함께 둔다", () => {
  assert.deepEqual(buttons(fundingActions(order("FUNDING_IN_PROGRESS", ["CANCEL"]))), [
    "참여 취소 /my/fundings/o1/cancel",
    "제작·배송 현황 /my/fundings/o1/fulfillment",
  ]);
  assert.deepEqual(buttons(fundingActions(order("FUNDING_IN_PROGRESS"))), [
    "제작·배송 현황 /my/fundings/o1/fulfillment",
  ]);
  /* 발송 지연 취소(CL_1-1)도 같은 취소 경로에서 연다. */
  assert.deepEqual(
    buttons(fundingActions(order("SHIPPING_DELAYED", ["SHIPPING_DELAY_REFUND_REQUEST"]))),
    ["참여 취소 /my/fundings/o1/cancel", "제작·배송 현황 /my/fundings/o1/fulfillment"],
  );
});

test("신청한 뒤에는 신청 버튼 대신 가장 최근 신청 유형의 내역 버튼을 둔다", () => {
  assert.deepEqual(
    buttons(
      fundingActions(
        order("SHIPPING_DELAYED", ["SHIPPING_DELAY_REFUND_REQUEST"], [request("SHIPPING_DELAY")]),
      ),
    ),
    ["취소 내역 /my/refunds?type=cancel"],
  );
  assert.deepEqual(
    buttons(fundingActions(order("DELIVERED", returnActions, [request("EXCHANGE")]))),
    ["반품·교환 내역 /my/refunds?type=exchange", "제작·배송 현황 /my/fundings/o1/fulfillment"],
  );
  assert.deepEqual(
    buttons(
      fundingActions(
        order("DELIVERED", returnActions, [request("DEFECT"), request("EXCHANGE", "REJECTED")]),
      ),
    ),
    ["반품·교환 내역 /my/refunds?type=refund", "제작·배송 현황 /my/fundings/o1/fulfillment"],
  );
});

test("배송 완료는 기간 안이면 반품·교환 신청, 지나면 비활성 안내 하나다", () => {
  assert.deepEqual(buttons(fundingActions(order("DELIVERED", returnActions))), [
    "반품·교환 신청 /my/fundings/o1/refund/new",
    "제작·배송 현황 /my/fundings/o1/fulfillment",
  ]);
  assert.deepEqual(buttons(fundingActions(order("DELIVERED"))), [
    "반품·교환 가능 기간이 지났어요 (비활성)",
  ]);
  /* 기간이 지나도 이미 낸 신청이 있으면 내역을 먼저 보여 준다. */
  assert.deepEqual(
    buttons(fundingActions(order("DELIVERED", [], [request("RETURN_CHANGE_OF_MIND")]))),
    ["반품·교환 내역 /my/refunds?type=refund", "제작·배송 현황 /my/fundings/o1/fulfillment"],
  );
});

test("성공·배송 중은 제작·배송 현황, 목표 미달은 환불 내역만 둔다", () => {
  for (const stage of ["FUNDING_SUCCEEDED", "SHIPPING"]) {
    assert.deepEqual(buttons(fundingActions(order(stage))), [
      "제작·배송 현황 /my/fundings/o1/fulfillment",
    ]);
  }
  assert.deepEqual(buttons(fundingActions(order("GOAL_FAILED"))), [
    "환불 내역 /my/refunds?type=refund",
  ]);
});

test("정리표에 없는 단계는 신청 이력이 있을 때만 내역 버튼 하나를 둔다", () => {
  assert.deepEqual(
    buttons(fundingActions(order("CANCELLED", [], [request("SIMPLE_CHANGE_OF_MIND")]))),
    ["취소 내역 /my/refunds?type=cancel"],
  );
  assert.deepEqual(buttons(fundingActions(order("CANCELLED"))), []);
  assert.deepEqual(buttons(fundingActions(order("PAYMENT_EXPIRED"))), []);
  assert.deepEqual(
    buttons(fundingActions(order("REFUNDED", [], [request("SHIPPING_DELAY", "COMPLETED")]))),
    ["취소 내역 /my/refunds?type=cancel"],
  );
  assert.deepEqual(
    buttons(fundingActions(order("REFUNDED", [], [request("DEFECT", "COMPLETED")]))),
    ["반품·교환 내역 /my/refunds?type=refund"],
  );
});

test("목록 카드는 단계 문구·한국 결제일·BE 리워드 요약을 쓰고 없는 값은 비운다", () => {
  const card = toFundingCard({
    orderId: "o1",
    projectId: "p1",
    projectTitle: "콜라겐 크림",
    status: "GOAL_ACHIEVED",
    progressStage: "FUNDING_SUCCEEDED",
    discountAmount: 0,
    finalAmount: 23_000,
    createdAt: "2026-09-14T23:10:00Z",
    paidAt: "2026-09-14T23:30:00Z",
    sellerDisplayName: "벨라포뮬라",
    thumbnailUrl: "https://cdn.example.com/a.png",
    rewardSummary: "크림 외 1건",
    totalQuantity: 3,
    lineItems: [],
    availableActions: [],
    refundRequests: [],
  });
  assert.equal(card.stage, "펀딩 성공");
  /* UTC 23:30은 한국 시간으로 다음 날이다. */
  assert.equal(card.paidAt, "2026.09.15");
  assert.equal(card.reward, "크림 외 1건");
  assert.equal(card.quantity, 3);
  assert.equal(card.creatorName, "벨라포뮬라");

  /* BE는 null 필드를 JSON에서 뺀다. 결제 전 주문·project-service 조회 실패가 그 경우다. */
  const bare = toFundingCard({
    orderId: "o2",
    projectId: "p1",
    status: "PENDING",
    progressStage: "UNKNOWN_STAGE",
    discountAmount: 0,
    finalAmount: 0,
    createdAt: "2026-09-14T23:10:00Z",
    rewardSummary: "",
    totalQuantity: 0,
    lineItems: [],
    availableActions: [],
    refundRequests: [],
  });
  assert.equal(bare.stage, "UNKNOWN_STAGE");
  assert.equal(bare.paidAt, "");
  assert.equal(bare.creatorName, "");
  assert.equal(bare.projectTitle, "");
  assert.equal(bare.imageSrc, "");
});

test("상세는 리워드마다 옵션·수량 행을 두고 요약은 첫 리워드 외 N건이다", () => {
  const view = toFundingDetailView({
    orderId: "o1",
    projectTitle: null,
    thumbnailUrl: null,
    status: "GOAL_ACHIEVED",
    progressStage: "DELIVERED",
    finalAmount: 45_000,
    shippingFee: 3_000,
    discountAmount: 1_000,
    shippingAddress: {
      recipientName: "홍길동",
      phoneNumber: "01000000000",
      zipcode: "06236",
      addressLine1: "주소",
      addressLine2: "",
    },
    availableActions: [],
    refundRequests: [],
    lineItems: [
      { rewardId: 1, rewardName: "크림", quantity: 1, unitPrice: 20_000, options: [] },
      {
        rewardId: 2,
        rewardName: "세트",
        quantity: 2,
        unitPrice: 11_000,
        options: [
          { optionGroupName: "색상", optionValue: "블랙" },
          { optionGroupName: "사이즈", optionValue: "L" },
        ],
      },
    ],
  });
  assert.equal(view.reward, "크림 외 1건");
  assert.equal(view.quantity, 3);
  assert.equal(view.paidAt, "");
  assert.equal(view.projectTitle, "");
  assert.deepEqual(view.items, [
    { reward: "크림", option: "단일옵션 · 1개" },
    { reward: "세트", option: "색상 블랙 · 사이즈 L · 2개" },
  ]);
  /* 펀딩 금액은 배송비·할인이 반영된 최종 금액이다. */
  assert.equal(view.amount, 45_000);
  assert.deepEqual(buttons(view.actions), ["반품·교환 가능 기간이 지났어요 (비활성)"]);
});

test("목업 목록은 Figma FUND_1의 네 카드와 같은 단계·버튼이다", () => {
  assert.deepEqual(
    demoOrderSummaries()
      .map(toFundingCard)
      .map((card) => [card.stage, card.actions.map((action) => action.label)]),
    [
      ["펀딩 진행 중", ["참여 취소", "제작·배송 현황"]],
      ["펀딩 성공", ["제작·배송 현황"]],
      ["배송 중", ["제작·배송 현황"]],
      ["배송 완료", ["반품·교환 신청", "제작·배송 현황"]],
    ],
  );
});

test("날짜·금액 표기와 목업 상품 id 규칙", () => {
  assert.equal(formatKoreanDate(undefined), "");
  assert.equal(formatKoreanDate("2026-09-15T01:00:00Z"), "2026.09.15");
  assert.equal(formatWon(599_000), "599,000원");
  assert.equal(demoFundingDetail("shipping").status, "shipping");
  assert.equal(demoFundingDetail("unknown-id").status, "in_progress");
});
