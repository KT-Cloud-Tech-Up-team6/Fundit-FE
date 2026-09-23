"use client";

import { ErrorState } from "@/shared/components/ui/error-state";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <ErrorState status="server" action={{ onClick: reset }} />
    </main>
  );
}
