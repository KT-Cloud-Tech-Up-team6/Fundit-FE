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
  const shouldStart =
    forceEnabled ||
    (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_MSW_ENABLED === "true");
  const [ready, setReady] = useState(!shouldStart);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    let active = true;

    void import("@/mocks/browser")
      .then(({ startMockWorker }) => startMockWorker())
      .then(
        () => {
          if (active) setReady(true);
        },
        (error: unknown) => {
          console.error("[MSW] failed to start", error);
          if (active) setFailed(true);
        },
      );
    return () => {
      active = false;
    };
  }, [shouldStart, attempt]);

  if (failed) {
    return (
      <div className="text-body-s p-6" role="alert">
        <p>테스트 환경을 시작하지 못했습니다. 다시 시도해 주세요.</p>
        <button
          className="mt-3 underline"
          onClick={() => {
            setFailed(false);
            setAttempt((value) => value + 1);
          }}
          type="button"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return ready ? children : null;
}
