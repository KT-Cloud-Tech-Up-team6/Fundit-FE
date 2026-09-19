import type { Fulfillment, Stage } from "../../../entities/fulfillment/api/fulfillment-api";
import type { FulfillmentState, FulfillmentStage } from "./fulfillment-demo";

export const viewStage: Record<Stage, FulfillmentStage> = {
  PRODUCTION_START: "prep",
  MANUFACTURING: "production",
  INSPECTION: "inspection",
  SHIPPING_OUT: "release",
  DELIVERY: "delivery",
};
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
        ? [{ id: item.stage, date: dateInKorea(item.updatedAt), text: item.detailText, media: [] }]
        : [],
    };
  return result;
}
