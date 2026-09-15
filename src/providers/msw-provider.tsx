"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

type MswProviderProps = {
  children: ReactNode;
  /* Storybook의 build-storybook은 NODE_ENV가 production이라 기본 조건으로는 MSW가
     안 켜진다. Storybook은 항상 목업이어야 하므로 preview.tsx가 이 값을 명시한다. */
  forceEnabled?: boolean;
};

export function MswProvider({ children, forceEnabled = false }: MswProviderProps) {
  const shouldStart = forceEnabled || process.env.NODE_ENV === "development";
  const [ready, setReady] = useState(!shouldStart);

  useEffect(() => {
    if (!shouldStart) return;

    void import("@/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(() => setReady(true));
  }, [shouldStart]);

  return ready ? children : null;
}
