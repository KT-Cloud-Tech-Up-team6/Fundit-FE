import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Link href="/" className="text-brand-strong mb-8 inline-block text-xl font-black">
          Fundit
        </Link>
        <div className="border-line bg-surface rounded-3xl border p-5 shadow-sm sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
