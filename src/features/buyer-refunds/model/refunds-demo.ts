import type { RefundSummary } from "@/entities/refund/api/refund-api";

/** Storybook·테스트에서만 쓰는 `GET /api/v2/refunds` 응답 예시다. 화면은 실제 응답만 그린다.
    서버는 null인 필드를 빼고 보내므로 값이 없는 필드는 키 자체를 두지 않는다. */
export const refundSummariesDemo: RefundSummary[] = [
  {
    refundId: 1041,
    fundingId: "6f1a0d6e-2c2b-4d0a-9a62-9f3a1b5c7d01",
    triggerType: "SHIPPING_DELAY",
    status: "REQUESTED",
    amount: 199000,
    requestedAt: "2026-09-01T05:40:00Z",
    projectTitle: "키친모먼트 스테인리스 전기주전자",
    lineItems: [
      { rewardName: "얼리버드 스타터 세트", quantity: 1, unitPrice: 199000, options: [] },
    ],
  },
  /* 참여 취소는 BE가 취소 사유를 환불 행에 저장하지 않아 사유 필드가 오지 않는다(BE 협의 대기). */
  {
    refundId: 1042,
    fundingId: "0b7c8a91-3f45-4e7a-8d21-5c9e6a4b2f10",
    triggerType: "SIMPLE_CHANGE_OF_MIND",
    status: "COMPLETED",
    amount: 199000,
    requestedAt: "2026-09-01T02:13:00Z",
    completedAt: "2026-09-13T01:02:00Z",
    projectTitle: "[진짜싹싹] 35,000Pa 초강력 흡입, 가볍게 끝내는 무선청소기",
    lineItems: [
      { rewardName: "얼리버드 스타터 세트", quantity: 1, unitPrice: 199000, options: [] },
    ],
  },
  {
    refundId: 1043,
    fundingId: "c4d5e6f7-8a9b-4c1d-9e2f-3a4b5c6d7e80",
    triggerType: "DEFECT",
    status: "COMPLETED",
    amount: 23000,
    requestedAt: "2026-08-28T07:22:00Z",
    reasonType: "DAMAGED",
    reasonDetail: "배송 중 뚜껑이 깨졌습니다",
    completedAt: "2026-09-05T08:30:00Z",
    projectTitle: "벨라포뮬라 데일리 콜라겐 크림",
    lineItems: [{ rewardName: "데일리 콜라겐 크림", quantity: 1, unitPrice: 23000, options: [] }],
  },
  /* 교환은 환불이 없어 amount가 결제 원금으로 온다. 판매자 귀책 사유라 추가 결제액은 0원이다. */
  {
    refundId: 1046,
    fundingId: "5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a80",
    triggerType: "EXCHANGE",
    status: "COMPLETED",
    amount: 24000,
    additionalPaymentAmount: 0,
    requestedAt: "2026-08-27T03:00:00Z",
    reasonType: "DEFECTIVE",
    reasonDetail: "펌프가 눌리지 않습니다",
    completedAt: "2026-09-05T02:00:00Z",
    projectTitle: "센트모먼트 바디미스트",
    lineItems: [
      {
        rewardName: "바디미스트 단품",
        quantity: 2,
        unitPrice: 12000,
        options: [
          { optionGroupName: "용량", optionValue: "50ml" },
          { optionGroupName: "향", optionValue: "우디" },
        ],
      },
    ],
  },
  /* 발송 후 옵션 선택 오류 반품. 상세를 쓰지 않아 reasonDetail이 없다. */
  {
    refundId: 1047,
    fundingId: "7a8b9c0d-1e2f-4a3b-9c4d-5e6f7a8b9c01",
    triggerType: "RETURN_CHANGE_OF_MIND",
    status: "UNDER_REVIEW",
    amount: 32000,
    returnShippingFee: 5000,
    requestedAt: "2026-08-26T09:10:00Z",
    reasonType: "WRONG_OPTION",
    projectTitle: "벨라포뮬라 데일리 선크림",
    lineItems: [
      {
        rewardName: "데일리 선크림",
        quantity: 1,
        unitPrice: 32000,
        options: [{ optionGroupName: "용량", optionValue: "50ml" }],
      },
    ],
  },
  {
    refundId: 1044,
    fundingId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c60",
    triggerType: "DEFECT",
    status: "REJECTED",
    amount: 24000,
    requestedAt: "2026-08-25T04:10:00Z",
    reasonType: "DEFECTIVE",
    reasonDetail: "향이 나지 않습니다",
    rejectedReason: "제품 하자가 확인되지 않았습니다",
    completedAt: "2026-09-06T02:00:00Z",
    projectTitle: "센트모먼트 룸스프레이",
    lineItems: [{ rewardName: "룸스프레이 200ml", quantity: 2, unitPrice: 12000, options: [] }],
  },
  /* order-service 배치 조회가 실패해 프로젝트명·상품이 빠진 응답. */
  {
    refundId: 1045,
    fundingId: "2b3c4d5e-6f70-4812-9a3b-4c5d6e7f8090",
    triggerType: "GOAL_FAILED_AUTO",
    status: "PROCESSING",
    amount: 45000,
    requestedAt: "2026-08-24T09:00:00Z",
  },
];
