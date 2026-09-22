import Image from "next/image";
import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
  headerTitle?: string;
  onBack?: () => void;
  withHeader?: boolean;
};

export function AuthScreen({ children, headerTitle, onBack, withHeader = true }: AuthScreenProps) {
  return (
    <div className="bg-layer-surface-default min-h-dvh overflow-x-hidden">
      {withHeader ? (
        <header className="bg-layer-surface-default relative z-10 flex h-13 items-center px-3">
          <button
            aria-label="뒤로가기"
            className="flex size-10 items-center justify-center"
            onClick={onBack}
            type="button"
          >
            <Image alt="" className="size-3" height={12} src="/icons/arrow_left.svg" width={12} />
          </button>
          {headerTitle ? (
            <p className="text-title-s text-text-title absolute left-1/2 -translate-x-1/2">
              {headerTitle}
            </p>
          ) : null}
        </header>
      ) : null}
      <main
        className={[
          "mx-auto flex w-[calc(100%-40px)] max-w-[350px] flex-col pb-8",
          withHeader ? "min-h-[calc(100dvh-52px)] pt-21" : "min-h-dvh pt-32",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}

export function AuthTitle({ children }: { children: ReactNode }) {
  /* break-keep: 한글은 어절 단위로 끊어야 "…없어\n요"처럼 갈라지지 않는다. */
  return (
    <h1 className="text-heading-l text-text-title break-keep whitespace-pre-line">{children}</h1>
  );
}

export function AuthBottomAction({ children }: { children: ReactNode }) {
  return <div className="mt-auto pt-16">{children}</div>;
}
