import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/shared/components/ui/icon";
import { PendingDestination } from "@/shared/components/ui/pending-destination";

export function BuyerAccountScreen({
  title,
  backHref = "/my",
  children,
  className = "",
}: {
  title: string;
  backHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`bg-layer-surface-default text-text-default [&_a:focus-visible]:outline-border-primary [&_button:focus-visible]:outline-border-primary [&_summary:focus-visible]:outline-border-primary mx-auto min-h-dvh w-full max-w-[390px] overflow-x-clip [&_a:focus-visible]:outline-2 [&_button:focus-visible]:outline-2 [&_summary:focus-visible]:outline-2 ${className}`}
    >
      <header className="bg-layer-surface-default sticky top-0 z-10 grid h-[52px] grid-cols-[40px_1fr_40px] items-center px-3">
        <Link
          href={backHref}
          aria-label={backHref === "/my" ? "마이페이지로 돌아가기" : "홈으로 돌아가기"}
          className="flex size-10 items-center justify-center"
        >
          <Icon name="arrowLeft" className="size-5" />
        </Link>
        <h1 className="text-title-s text-center">{title}</h1>
        <PendingDestination label="알림함" className="flex size-10 items-center justify-center">
          <Icon name="bell" className="size-6" />
        </PendingDestination>
      </header>
      {children}
    </main>
  );
}
