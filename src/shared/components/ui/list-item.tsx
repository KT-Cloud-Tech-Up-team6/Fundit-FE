import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ListItemProps = ComponentPropsWithoutRef<"div"> & {
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ListItem({ leading, trailing, children, className, ...props }: ListItemProps) {
  return (
    <div
      className={["text-text-default flex w-full items-center gap-2 px-1", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center py-1">
        {leading && (
          <div className="flex shrink-0 items-center [&>*]:flex [&>*]:size-7 [&>*]:items-center [&>*]:justify-center">
            {leading}
          </div>
        )}
        <div className="text-body-s min-w-0 flex-1 px-2 leading-[1.42] break-words">{children}</div>
      </div>
      {trailing && (
        <div className="flex size-9 shrink-0 items-center justify-center">{trailing}</div>
      )}
    </div>
  );
}
