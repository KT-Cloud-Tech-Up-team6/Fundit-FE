import type { ComponentPropsWithoutRef, ReactNode } from "react";

type EmptyStateProps = Omit<ComponentPropsWithoutRef<"div">, "title"> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  graphic?: ReactNode;
  message: ReactNode;
  description?: ReactNode;
};

export function EmptyState({
  title,
  subtitle,
  graphic,
  message,
  description,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={["text-text-default flex w-full flex-col gap-10", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {(title || subtitle) && (
        <div className="flex flex-col gap-2 px-5">
          {title && <h2 className="text-title-l break-words">{title}</h2>}
          {subtitle && <p className="text-body-emphasis break-words">{subtitle}</p>}
        </div>
      )}
      {graphic && <div className="flex justify-center px-5">{graphic}</div>}
      <p className="text-title-s px-5 text-center leading-[1.42] break-words">{message}</p>
      {description && (
        <p className="text-body-s px-5 text-center leading-[1.42] break-words">{description}</p>
      )}
    </div>
  );
}
