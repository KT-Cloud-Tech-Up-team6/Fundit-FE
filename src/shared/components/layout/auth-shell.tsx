import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="bg-layer-surface-default min-h-dvh w-full">
      <div className="mx-auto min-h-dvh w-full max-w-[390px] sm:max-w-none">{children}</div>
    </main>
  );
}
