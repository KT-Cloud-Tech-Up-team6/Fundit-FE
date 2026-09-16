import type { ComponentProps, ReactNode } from "react";

import { Input } from "./input";

type InputButtonProps = {
  inputProps: ComponentProps<typeof Input>;
  button: ReactNode;
  className?: string;
};

export function InputButton({ inputProps, button, className }: InputButtonProps) {
  return (
    <div className={["flex w-full items-stretch gap-2", className].filter(Boolean).join(" ")}>
      <div className="min-w-0 flex-1">
        <Input {...inputProps} />
      </div>
      <div className="flex shrink-0 [&>*]:h-full">{button}</div>
    </div>
  );
}
