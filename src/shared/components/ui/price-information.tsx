import type { ComponentPropsWithoutRef } from "react";

type PriceInformationProps = ComponentPropsWithoutRef<"div"> & {
  price: string;
  originalPrice?: string;
  caption?: string;
};

export function PriceInformation({
  price,
  originalPrice,
  caption,
  className,
  ...props
}: PriceInformationProps) {
  return (
    <div
      className={["text-text-default flex flex-col items-end", className].filter(Boolean).join(" ")}
      {...props}
    >
      {originalPrice && (
        <p className="text-body-s text-text-secondary leading-[1.42]">{originalPrice}</p>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {caption && <span className="text-caption-m">{caption}</span>}
        <strong className="text-title-s leading-[1.42]">{price}</strong>
      </div>
    </div>
  );
}
