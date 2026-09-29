import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { authTokenStore } from "@/shared/api/auth-token-store";
import { CouponApiSheet } from "./coupon-api-sheet";

const coupons = [
  {
    couponCode: "PLATFORM-3000",
    couponName: "3,000원 할인 쿠폰",
    discountType: "AMOUNT",
    discountValue: 3000,
    status: "AVAILABLE",
    expiresAt: "2026-09-30T14:59:59Z",
    minFundingAmount: 500_000,
    perMemberLimit: 1,
    targetScope: "ALL",
    targetRefId: null,
    issuerType: "PLATFORM" as const,
    maxDiscountAmount: null,
  },
  {
    couponCode: "PLATFORM-5000",
    couponName: "5,000원 할인 쿠폰",
    discountType: "AMOUNT",
    discountValue: 5000,
    status: "AVAILABLE",
    expiresAt: "2026-09-30T14:59:59Z",
    minFundingAmount: 0,
    perMemberLimit: 1,
    targetScope: "ALL",
    targetRefId: null,
    issuerType: "PLATFORM" as const,
    maxDiscountAmount: null,
  },
  {
    couponCode: "MAKER-5000",
    couponName: "메이커 5,000원 할인 쿠폰",
    discountType: "AMOUNT",
    discountValue: 5000,
    status: "AVAILABLE",
    expiresAt: "2026-09-30T14:59:59Z",
    minFundingAmount: 0,
    perMemberLimit: 1,
    targetScope: "MAKER",
    targetRefId: "maker-1",
    issuerType: "MAKER" as const,
    maxDiscountAmount: null,
  },
];

function requestedCouponCodes(init?: RequestInit) {
  if (typeof init?.body !== "string") return [];
  const body = JSON.parse(init.body) as { couponCodes?: string[] };
  return body.couponCodes ?? [];
}

function appliedCoupons(couponCodes: string[]) {
  return couponCodes.flatMap((couponCode) => {
    const coupon = coupons.find((item) => item.couponCode === couponCode);
    return coupon
      ? [{ couponCode, issuerType: coupon.issuerType, discountType: coupon.discountType }]
      : [];
  });
}

const meta = {
  title: "Features/Order Checkout/Coupon API Sheet",
  component: CouponApiSheet,
  parameters: {
    layout: "fullscreen",
    viewport: {
      options: {
        figma390: { name: "Figma 390 × 844", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "figma390" } },
  args: {
    memberId: "storybook-member",
    body: {
      projectId: "storybook-project",
      lineItems: [{ rewardId: 1, quantity: 1, optionValueIds: [] }],
      shippingAddress: {
        recipientName: "홍길동",
        phoneNumber: "01012345678",
        zipcode: "12345",
        addressLine1: "서울시",
        addressLine2: "1층",
      },
      couponCodes: ["PLATFORM-3000"],
    },
    selected: [{ couponCode: "PLATFORM-3000", issuerType: "PLATFORM" }],
    onApply: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof CouponApiSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 다른 플랫폼 쿠폰을 누르면 선택은 유지되고 ORD_22 문구가 나타난다. */
export const DuplicateIssuer: Story = {
  beforeEach: () => {
    const originalFetch = window.fetch;
    authTokenStore.set("storybook-token");
    window.fetch = async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.origin,
      );
      if (url.pathname === "/api/v1/coupons/me") {
        return Response.json({ content: coupons, hasNext: false });
      }
      if (url.pathname === "/api/v1/orders/preview" && init?.method === "POST") {
        const couponCodes = requestedCouponCodes(init);
        return Response.json({
          rewardAmount: 20_000,
          shippingFee: 3_000,
          discountAmount: couponCodes.length * 3_000,
          finalAmount: 23_000 - couponCodes.length * 3_000,
          appliedCoupons: appliedCoupons(couponCodes),
          unavailableCoupons: [],
        });
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
      authTokenStore.clear();
    };
  },
};

/** 쿠폰 조합으로 최종 결제금액이 0원 이하가 되면 ORD_21 문구를 표시한다. */
export const ExceedsOrderAmount: Story = {
  args: {
    body: {
      ...meta.args.body,
      couponCodes: ["PLATFORM-3000", "MAKER-5000"],
    },
    selected: [
      { couponCode: "PLATFORM-3000", issuerType: "PLATFORM" },
      { couponCode: "MAKER-5000", issuerType: "MAKER" },
    ],
  },
  beforeEach: () => {
    const originalFetch = window.fetch;
    authTokenStore.set("storybook-token");
    window.fetch = async (input, init) => {
      const url = new URL(
        input instanceof Request ? input.url : String(input),
        window.location.origin,
      );
      if (url.pathname === "/api/v1/coupons/me") {
        return Response.json({ content: coupons, hasNext: false });
      }
      if (url.pathname === "/api/v1/orders/preview" && init?.method === "POST") {
        const couponCodes = requestedCouponCodes(init);
        const exceedsOrderAmount =
          couponCodes.includes("PLATFORM-3000") && couponCodes.includes("MAKER-5000");
        return Response.json({
          rewardAmount: 5_000,
          shippingFee: 0,
          discountAmount: exceedsOrderAmount ? 3_000 : couponCodes.length * 3_000,
          finalAmount: exceedsOrderAmount ? 2_000 : 5_000 - couponCodes.length * 3_000,
          appliedCoupons: appliedCoupons(
            exceedsOrderAmount ? couponCodes.filter((code) => code !== "MAKER-5000") : couponCodes,
          ),
          unavailableCoupons: exceedsOrderAmount
            ? [{ couponCode: "MAKER-5000", reason: "EXCEEDS_ORDER_AMOUNT" }]
            : [],
        });
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
      authTokenStore.clear();
    };
  },
};
