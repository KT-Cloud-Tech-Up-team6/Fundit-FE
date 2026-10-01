import { authHandlers } from "./auth-handlers";
import { discoveryHandlers } from "./discovery-handlers";
import { fulfillmentHandlers } from "./fulfillment-handlers";
import { liveHandlers } from "./live-handlers";
import { orderHandlers } from "./order-handlers";
import { projectHandlers } from "./project-handlers";
import { aiStoryHandlers } from "./ai-story-handlers";
import { refundHandlers } from "./refund-handlers";

export const handlers = [
  ...aiStoryHandlers,
  ...authHandlers,
  ...discoveryHandlers,
  ...fulfillmentHandlers,
  ...liveHandlers,
  ...projectHandlers,
  ...orderHandlers,
  ...refundHandlers,
];
