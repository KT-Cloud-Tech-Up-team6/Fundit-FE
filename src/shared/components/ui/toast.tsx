import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ToastProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children: ReactNode;
};

/** Figma Toast: 본문을 한 줄 또는 두 줄로 안내하는 302px 이하의 임시 메시지. */
export function Toast({ children, className, ...props }: ToastProps) {
  return (
    <div
      className={[
        "bg-layer-surface-primary text-text-inverse text-body-s w-[calc(100%_-_48px)] max-w-[302px] rounded-xs px-2 py-2.5 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      {...props}
    >
      {children}
    </div>
  );
}
