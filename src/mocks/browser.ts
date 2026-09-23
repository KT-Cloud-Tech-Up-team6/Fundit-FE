import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";
import { markMockWorkerStarted } from "./worker-state";

export const worker = setupWorker(...handlers);

let workerStart: Promise<unknown> | null = null;

export function startMockWorker() {
  workerStart ??= worker.start({ onUnhandledRequest: "bypass" }).then(
    (registration) => {
      markMockWorkerStarted();
      return registration;
    },
    (error: unknown) => {
      workerStart = null;
      throw error;
    },
  );
  return workerStart;
}
