"use client";

import { ErrorState } from "@/shared/components/ui/error-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <ErrorState status="server" action={{ onClick: reset }} />
    </main>
  );
}
