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
    <div className="bg-layer-surface-default min-h-dvh">
      {withHeader ? (
        <header className="bg-layer-surface-disabled relative flex h-13 items-center px-3">
          <button
            aria-label="뒤로가기"
            className="flex size-10 items-center justify-center"
            onClick={onBack}
            type="button"
          >
            <Image
              alt=""
              className="h-5 w-3 -rotate-90"
              height={20}
              src="/icons/arrow-up.svg"
              width={12}
            />
          </button>
          {headerTitle ? (
            <p className="text-body-m text-text-primary-live absolute left-1/2 -translate-x-1/2">
              {headerTitle}
            </p>
          ) : null}
        </header>
      ) : null}
      <div
        className={[
          "mx-auto w-[calc(100%-40px)] max-w-[350px]",
          withHeader ? "pt-[84px]" : "pt-[136px]",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export function AuthTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-heading-l text-text-title whitespace-pre-line">{children}</h1>;
}

export function AuthBottomAction({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-5 bottom-[34px] mx-auto w-[calc(100%-40px)] max-w-[350px]">
      {children}
    </div>
  );
}
