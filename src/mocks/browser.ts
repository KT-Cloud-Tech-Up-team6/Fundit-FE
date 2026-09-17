import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

let workerStart: Promise<unknown> | null = null;

export function startMockWorker() {
  workerStart ??= worker.start({ onUnhandledRequest: "bypass" }).catch((error: unknown) => {
    workerStart = null;
    throw error;
  });
  return workerStart;
}
