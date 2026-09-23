"use client";

import { ErrorState, toErrorStatus } from "@/shared/components/ui/error-state";

export default function BuyerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState status={toErrorStatus(error)} action={{ onClick: reset }} />;
}
