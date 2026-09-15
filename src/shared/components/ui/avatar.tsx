import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Icon } from "./icon";

type AvatarSize = 20 | 24 | 28 | 32 | 36 | 40 | 46;

type AvatarProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children?: ReactNode;
  size?: AvatarSize;
};

export function Avatar({ children, className, size = 40, ...props }: AvatarProps) {
  return (
    <div
      className={["bg-layer-bg relative shrink-0 overflow-hidden rounded-full", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
      {...props}
    >
      {children ?? (
        <Icon className="text-text-secondary absolute inset-0 size-full" name="avatar" />
      )}
    </div>
  );
}
