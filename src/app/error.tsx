"use client";

import { ErrorState, toErrorStatus } from "@/shared/components/ui/error-state";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <ErrorState status={toErrorStatus(error)} action={{ onClick: reset }} />
    </main>
  );
}
