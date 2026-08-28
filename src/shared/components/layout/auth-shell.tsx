import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-heading-s text-text-default mb-8 inline-block">
          Fundit
        </Link>
        <div className="border-border-default bg-layer-surface-default shadow-light-s rounded-md border p-5 sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
