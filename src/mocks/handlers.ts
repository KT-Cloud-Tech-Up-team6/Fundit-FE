import { authHandlers } from "./auth-handlers";
import { discoveryHandlers } from "./discovery-handlers";
import { fulfillmentHandlers } from "./fulfillment-handlers";
import { orderHandlers } from "./order-handlers";
import { projectHandlers } from "./project-handlers";
import { refundHandlers } from "./refund-handlers";

export const handlers = [
  ...authHandlers,
  ...discoveryHandlers,
  ...fulfillmentHandlers,
  ...projectHandlers,
  ...orderHandlers,
  ...refundHandlers,
];
