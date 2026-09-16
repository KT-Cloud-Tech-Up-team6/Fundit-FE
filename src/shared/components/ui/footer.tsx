import type { ComponentPropsWithoutRef, ReactNode } from "react";

type FooterProps = ComponentPropsWithoutRef<"div"> & {
  leading?: ReactNode;
};

export function Footer({ leading, children, className, ...props }: FooterProps) {
  return (
    <div
      className={[
        "bg-layer-surface-default flex min-h-15 w-full items-center gap-2 px-5 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {leading && <div className="flex w-11 shrink-0 items-center justify-center">{leading}</div>}
      <div className="flex min-w-0 flex-1 items-center gap-2 [&>*]:min-w-0 [&>*]:flex-1">
        {children}
      </div>
    </div>
  );
}
