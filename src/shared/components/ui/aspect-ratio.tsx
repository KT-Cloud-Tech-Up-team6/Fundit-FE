import type { ComponentPropsWithoutRef, ReactNode } from "react";

type Ratio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

type AspectRatioProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  children?: ReactNode;
  ratio?: Ratio;
};

const ratioClasses: Record<Ratio, string> = {
  "1:1": "aspect-square",
  "3:4": "aspect-[3/4]",
  "4:3": "aspect-[4/3]",
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-[16/9]",
};

export function AspectRatio({ children, className, ratio = "1:1", ...props }: AspectRatioProps) {
  return (
    <div
      className={["bg-layer-bg relative w-full", ratioClasses[ratio], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
