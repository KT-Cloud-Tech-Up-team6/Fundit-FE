import type { ComponentPropsWithoutRef, ReactNode } from "react";

type FormFieldProps = ComponentPropsWithoutRef<"div"> & {
  htmlFor: string;
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  action?: ReactNode;
};

export function FormField({
  htmlFor,
  label,
  description,
  errorMessage,
  action,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div
      className={["text-text-default flex w-full flex-col gap-2", className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-title-s leading-[1.42] break-words">
            {label}
          </label>
          {action}
        </div>
        {description && (
          <p id={`${htmlFor}-description`} className="text-caption-s break-words">
            {description}
          </p>
        )}
      </div>
      {children}
      {errorMessage && (
        <p id={`${htmlFor}-error`} className="text-caption-s text-text-warning" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
