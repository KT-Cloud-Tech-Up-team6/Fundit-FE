import type { Fulfillment, Stage } from "../../../entities/fulfillment/api/fulfillment-api";
import type { FulfillmentState, FulfillmentStage } from "./fulfillment-demo";

export const viewStage: Record<Stage, FulfillmentStage> = {
  PRODUCTION_START: "prep",
  MANUFACTURING: "production",
  INSPECTION: "inspection",
  SHIPPING_OUT: "release",
  DELIVERY: "delivery",
};
/** 트래커가 없는(404) 판매자 제작·배송 탭 안내(#389). 트래커는 펀딩이 성립될 때 만들어진다. */
export function sellerNotEstablishedMessage(projectStatus: string | undefined) {
  return projectStatus === "FAILED"
    ? "펀딩이 성립되지 않아 제작·배송을 진행하지 않아요."
    : "펀딩이 성립되면 제작·배송 현황을 기록할 수 있어요.";
}

export function dateInKorea(value?: string) {
  return value
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value))
    : "";
}
export function fulfillmentState(data: Fulfillment): FulfillmentState {
  const result: FulfillmentState = {
    prep: { status: "todo", records: [] },
    production: { status: "todo", records: [] },
    inspection: { status: "todo", records: [] },
    release: { status: "todo", records: [] },
    delivery: { status: "todo", records: [] },
  };
  for (const item of data.stages)
    result[viewStage[item.stage]] = {
      status: ({ COMPLETED: "done", IN_PROGRESS: "active", NOT_STARTED: "todo" } as const)[
        item.status
      ],
      startDate: dateInKorea(item.plannedStartAt),
      expectedEndDate: dateInKorea(item.plannedEndAt),
      records: item.detailText
        ? [
            {
              id: item.stage,
              date: dateInKorea(item.updatedAt),
              text: item.detailText,
              media: (item.photoUrls ?? []).map((url, index) => ({
                id: `${item.stage}-${index}`,
                kind: "image" as const,
                name: `진행 사진 ${index + 1}`,
                url,
              })),
            },
          ]
        : [],
    };
  return result;
}
