"use client";

import type { ComponentPropsWithRef } from "react";

type InputChatProps = Omit<
  ComponentPropsWithRef<"textarea">,
  "value" | "defaultValue" | "onSubmit"
> & {
  value: string;
  appearance?: "default" | "story";
  onSend: (value: string) => void;
  onAttach?: () => void;
  attachDisabled?: boolean;
  attachLabel?: string;
  sendLabel?: string;
  /** 보낼 것이 있는지. 주지 않으면 입력한 글이 있을 때만 보낼 수 있다(첨부만 보내는 화면이 덮어쓴다). */
  canSend?: boolean;
};

export function InputChat({
  value,
  appearance = "default",
  onSend,
  onAttach,
  attachDisabled = false,
  attachLabel = "파일 첨부",
  sendLabel = "메시지 보내기",
  canSend: hasContent = value.trim().length > 0,
  disabled,
  className,
  onKeyDown,
  ...props
}: InputChatProps) {
  const canSend = !disabled && hasContent;
  function send() {
    if (canSend) onSend(value);
  }
  return (
    <div className={["flex w-full items-end gap-2", className].filter(Boolean).join(" ")}>
      <div
        className={`bg-layer-surface-default focus-within:outline-border-primary flex min-w-0 flex-1 items-end gap-1 rounded-lg py-2 pr-3 focus-within:outline-2 focus-within:outline-offset-2 ${appearance === "story" ? "border-border-default border pl-4" : "pl-3"}`}
      >
        {(onAttach || attachDisabled) && (
          <button
            type="button"
            onClick={onAttach}
            disabled={disabled || attachDisabled}
            aria-label={attachLabel}
            className="text-text-default enabled:hover:bg-layer-surface-disabled focus-visible:outline-border-primary disabled:text-text-disabled flex size-7 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 disabled:cursor-not-allowed"
          >
            <span
              aria-hidden
              className="size-3.5 bg-current [mask-image:url('/icons/molecules/attachment.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
            />
          </button>
        )}
        {/* story 입력은 모달이 높이를 28px부터 맞추므로, 14px·1.42 줄(약 20px) 위아래에 4px씩 두어 세로 가운데에 둔다(#532). */}
        <textarea
          {...props}
          value={value}
          disabled={disabled}
          rows={props.rows ?? 1}
          className={`text-text-default placeholder:text-text-placeholder disabled:text-text-disabled disabled:placeholder:text-text-disabled min-h-7 min-w-0 flex-1 resize-none bg-transparent outline-none placeholder:text-[14px] placeholder:leading-[1.42] ${appearance === "story" ? "text-body-s py-1 leading-[1.42]" : "text-body-m py-0.5"}`}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.nativeEvent.isComposing || event.keyCode === 229)
              return;
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
      </div>
      <button
        type="button"
        onClick={send}
        disabled={!canSend}
        aria-label={sendLabel}
        className="bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary disabled:bg-layer-surface-disabled disabled:text-text-disabled flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
      >
        <span
          aria-hidden
          className="size-6 bg-current [mask-image:url('/icons/molecules/send.svg')] [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat]"
        />
      </button>
    </div>
  );
}
