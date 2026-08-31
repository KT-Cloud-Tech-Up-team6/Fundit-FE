import type { ComponentPropsWithRef } from "react";

type CardProps = ComponentPropsWithRef<"div"> & {
  size?: "sm" | "md" | "lg";
};

const cardSizeClasses: Record<NonNullable<CardProps["size"]>, string> = {
  sm: "h-[130px] w-[108.667px] rounded-sm",
  md: "h-[200px] w-[169px] rounded-md",
  lg: "h-[240px] w-[350px] rounded-md",
};

export function Card({ className, size = "lg", ...props }: CardProps) {
  return (
    <div
      className={["bg-layer-surface-default overflow-hidden", cardSizeClasses[size], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

type CardGridProps = ComponentPropsWithRef<"div"> & {
  columns?: 2 | 3;
};

export function CardGrid({ className, columns = 2, ...props }: CardGridProps) {
  return (
    <div
      className={["grid w-[350px] gap-3", columns === 2 ? "grid-cols-2" : "grid-cols-3", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

type CardHorizontalProps = ComponentPropsWithRef<"div">;

export function CardHorizontal({ className, ...props }: CardHorizontalProps) {
  return (
    <div
      className={[
        "bg-layer-surface-default h-[90px] w-[350px] overflow-hidden rounded-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

type CardListProps = ComponentPropsWithRef<"div">;

export function CardList({ className, ...props }: CardListProps) {
  return (
    <div
      className={["flex w-[350px] flex-col items-start gap-3", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

type ListItemProps = ComponentPropsWithRef<"div">;

export function ListItem({ className, ...props }: ListItemProps) {
  return (
    <div
      className={[
        "bg-layer-surface-default border-border-default h-[78px] w-[350px] overflow-hidden border-b",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

type DividerListProps = ComponentPropsWithRef<"div">;

export function DividerList({ className, ...props }: DividerListProps) {
  return (
    <div
      className={["flex w-[350px] flex-col items-start", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
