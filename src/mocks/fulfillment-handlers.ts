import { http, HttpResponse } from "msw";

import {
  stages,
  type Fulfillment,
  type ScheduleChange,
  type Shipment,
  type Stage,
} from "@/entities/fulfillment/api/fulfillment-api";
import type { SellerOrder } from "@/entities/order/api/seller-order-api";

import { FIXTURE_SELLER_ORDER_IDS, FIXTURE_SELLER_PROJECT_ID } from "./fixtures";

/* 판매자 제작·배송 탭과 발송정보 화면(UCS 판매자 54~62)용 인메모리 상태. 하드 네비게이션(page.goto)
   마다 초기화된다 — 스펙은 로그인 뒤 한 번 진입해 같은 탭 안에서 링크로만 이동한다. */
const now = () => new Date().toISOString();

type SellerOrderRecord = SellerOrder & { carrier?: string; trackingNumber?: string };
type State = { fulfillment: Fulfillment; orders: SellerOrderRecord[] };

function initialState(): State {
  return {
    fulfillment: {
      projectId: FIXTURE_SELLER_PROJECT_ID,
      currentStage: "PRODUCTION_START",
      lastUpdatedAt: now(),
      isUpdateOverdue: false,
      stages: stages.map((stage, index) => ({
        stage,
        status: index === 0 ? "IN_PROGRESS" : "NOT_STARTED",
      })),
      scheduleChanges: [],
    },
    orders: [
      ["김서포터", "서울시 강남구 테헤란로 1"],
      ["이서포터", "부산시 해운대구 센텀로 2"],
    ].map(([recipientName, addressLine1], index) => ({
      orderId: FIXTURE_SELLER_ORDER_IDS[index],
      lineItems: [
        {
          rewardId: 9001,
          rewardName: "기본 무드등 1개",
          quantity: 1,
          unitPrice: 39_000,
          options: [],
        },
      ],
      shippingAddress: {
        recipientName,
        phoneNumber: "01012345678",
        zipcode: "06236",
        addressLine1,
        addressLine2: "101호",
      },
    })),
  };
}

/* 판매자 화면에서 바꾼 진행 상태를 구매자 화면(같은 탭, page.goto)에서도 봐야 해서 sessionStorage에
   미러링한다. 주문 스토어(order-handlers.ts)와 같은 방식이다. */
const STORAGE_KEY = "e2e-mock-fulfillment";

function loadState(): State {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    /* 손상됐거나 저장소가 없으면 초기 상태로 시작한다. */
  }
  return initialState();
}

const state = loadState();
const { fulfillment, orders } = state;

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* 저장소가 없는 환경에서는 조용히 무시한다. */
  }
}

const isFixtureProject = (id: unknown) => String(id) === FIXTURE_SELLER_PROJECT_ID;
const notFound = () =>
  HttpResponse.json({ code: "NOT_FOUND", message: "프로젝트 없음" }, { status: 404 });

function toShipment(order: SellerOrderRecord): Shipment {
  return {
    fundingId: order.orderId,
    status: order.shippedAt ? "SHIPPED" : "PREPARING",
    carrier: order.carrier,
    trackingNumber: order.trackingNumber,
    shippedAt: order.shippedAt,
    canConfirmReceipt: false,
  };
}

async function saveShipment(
  request: Request,
  params: Record<string, string | readonly string[] | undefined>,
  ship: boolean,
) {
  const order = orders.find((item) => item.orderId === String(params.fundingId));
  if (!isFixtureProject(params.id) || !order) return notFound();
  if (order.shippedAt)
    return HttpResponse.json({ code: "ALREADY_SHIPPED", message: "이미 발송됨" }, { status: 409 });
  const body = (await request.json()) as { carrier: string; trackingNumber: string };
  order.carrier = body.carrier;
  order.trackingNumber = body.trackingNumber;
  if (ship) order.shippedAt = now();
  persist();
  return HttpResponse.json(toShipment(order));
}

export const fulfillmentHandlers = [
  /* getOwnedProject. 다른 프로젝트는 project-handlers.ts로 넘긴다(반환값이 없으면 다음 핸들러가 받는다). */
  http.get("*/api/v1/projects/:id/preview", ({ params }) => {
    if (!isFixtureProject(params.id)) return undefined;
    return HttpResponse.json({
      projectId: FIXTURE_SELLER_PROJECT_ID,
      title: "E2E 제작·배송 프로젝트",
      status: "ONGOING",
      goalAmount: 5_000_000,
      coverImageUrl: null,
    });
  }),

  http.get("*/api/v2/projects/:id/fulfillment", ({ params }) =>
    isFixtureProject(params.id) ? HttpResponse.json(fulfillment) : notFound(),
  ),

  http.patch("*/api/v2/projects/:id/fulfillment/stage", async ({ params, request }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const { stage } = (await request.json()) as { stage: Stage };
    if (stages.indexOf(stage) !== stages.indexOf(fulfillment.currentStage) + 1)
      return HttpResponse.json(
        { code: "INVALID_STAGE_TRANSITION", message: "잘못된 단계 전환" },
        { status: 409 },
      );
    for (const item of fulfillment.stages) {
      if (item.stage === fulfillment.currentStage) item.status = "COMPLETED";
      if (item.stage === stage) item.status = "IN_PROGRESS";
    }
    fulfillment.currentStage = stage;
    fulfillment.lastUpdatedAt = now();
    persist();
    return HttpResponse.json({});
  }),

  http.post("*/api/v2/projects/:id/fulfillment/stage-details", async ({ params, request }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const body = (await request.json()) as {
      stage: Stage;
      detailText: string;
      plannedStartAt?: string;
      plannedEndAt?: string;
      photoUrls?: string[];
    };
    const target = fulfillment.stages.find((item) => item.stage === body.stage);
    if (!target) return notFound();
    Object.assign(target, {
      detailText: body.detailText,
      plannedStartAt: body.plannedStartAt,
      plannedEndAt: body.plannedEndAt,
      photoUrls: body.photoUrls,
      updatedAt: now(),
    });
    persist();
    return HttpResponse.json({});
  }),

  http.post("*/api/v2/projects/:id/fulfillment/schedule-changes", async ({ params, request }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const body = (await request.json()) as Omit<ScheduleChange, "scheduleChangeId" | "changedAt">;
    const change: ScheduleChange = {
      ...body,
      scheduleChangeId: fulfillment.scheduleChanges.length + 1,
      changedAt: now(),
    };
    fulfillment.scheduleChanges.push(change);
    const target = fulfillment.stages.find((item) => item.stage === body.stage);
    if (target) target.plannedEndAt = body.newPlannedDate;
    persist();
    return HttpResponse.json(change);
  }),

  http.get("*/api/v1/projects/:id/orders/shipping-status-counts", ({ params }) =>
    isFixtureProject(params.id)
      ? HttpResponse.json({
          waiting: orders.filter((order) => !order.shippedAt).length,
          shipped: orders.filter((order) => order.shippedAt).length,
        })
      : notFound(),
  ),

  http.get("*/api/v1/projects/:id/orders", ({ params, request }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const query = new URL(request.url).searchParams;
    const filter = query.get("shippingFilter");
    const q = query.get("q") ?? "";
    const content = orders.filter(
      (order) =>
        (filter === "WAITING"
          ? !order.shippedAt
          : filter === "SHIPPED"
            ? !!order.shippedAt
            : true) &&
        (!q || order.shippingAddress.recipientName.includes(q) || order.orderId.includes(q)),
    );
    return HttpResponse.json({
      content,
      page: 0,
      size: 20,
      totalElements: content.length,
      totalPages: content.length ? 1 : 0,
      hasNext: false,
    });
  }),

  http.get("*/api/v2/projects/:id/shipments", ({ params, request }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const ids = (new URL(request.url).searchParams.get("fundingIds") ?? "").split(",");
    return HttpResponse.json(orders.filter((order) => ids.includes(order.orderId)).map(toShipment));
  }),

  /* 구매자 배송 현황. 판매자 발송 정보에 없는 주문은 발송 준비 중이다. */
  http.get("*/api/v2/projects/:id/fundings/:fundingId/shipment", ({ params }) => {
    if (!isFixtureProject(params.id)) return notFound();
    const order = orders.find((item) => item.orderId === String(params.fundingId));
    return HttpResponse.json(
      order
        ? toShipment(order)
        : { fundingId: String(params.fundingId), status: "PREPARING", canConfirmReceipt: false },
    );
  }),

  http.post("*/api/v2/projects/:id/fundings/:fundingId/shipment/draft", ({ params, request }) =>
    saveShipment(request, params, false),
  ),
  http.post("*/api/v2/projects/:id/fundings/:fundingId/shipment", ({ params, request }) =>
    saveShipment(request, params, true),
  ),
];
