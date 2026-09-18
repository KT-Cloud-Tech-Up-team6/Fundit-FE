import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Image from "next/image";

type ChatDialogueProps = ComponentPropsWithoutRef<"div"> & {
  sender: "ai" | "user";
  appearance?: "default" | "story";
  size?: "sm" | "md";
  avatar?: ReactNode;
  progress?: string;
  status?: ReactNode;
  actions?: ReactNode;
};

export function ChatDialogue({
  sender,
  appearance = "default",
  size = "sm",
  avatar,
  progress,
  status,
  actions,
  children,
  className,
  ...props
}: ChatDialogueProps) {
  const isUser = sender === "user";
  const isStory = appearance === "story";
  return (
    <div
      className={[
        "flex w-full items-start gap-2",
        isUser ? "justify-end pl-10" : isStory ? "pr-0" : "pr-10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className="sr-only">{isUser ? "사용자 메시지" : "AI 메시지"}</span>
      {!isUser && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full">
          {avatar ?? <Image src="/icons/molecules/chat-avatar.svg" alt="" width={32} height={32} />}
        </div>
      )}
      <div
        className={[
          "flex min-w-0 flex-col items-start gap-2",
          isStory ? "max-w-[440px]" : size === "sm" ? "max-w-[484px]" : "max-w-[509px]",
          !isUser && "pt-2",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            "flex max-w-full flex-col gap-1 rounded-t-md rounded-bl-md px-4 break-words whitespace-pre-wrap",
            isStory
              ? `text-body-s leading-[1.42] font-medium ${isUser ? "bg-layer-surface-primary text-text-inverse" : "bg-layer-surface-default text-text-default shadow-light-s rounded-tl-none rounded-br-md"}`
              : `text-body-m ${isUser ? "border border-[#959595] bg-[#ffffff] text-[#000000]" : "rounded-tl-none rounded-br-md bg-[#959595] text-[#ffffff]"}`,
            size === "sm" ? "py-3" : isUser ? "pt-2 pb-3" : "py-2",
          ].join(" ")}
        >
          <div className="min-w-0">{children}</div>
          {!isUser && progress && (
            <span
              className={`${isStory ? "text-text-secondary text-[11px] leading-[1.3]" : "text-label-s"} self-end font-medium`}
            >
              {progress}
            </span>
          )}
        </div>
        {!isUser && status && (
          <div
            className={`text-caption-s ${isStory ? "text-text-secondary" : "text-[#000000]"}`}
            role="status"
          >
            {status}
          </div>
        )}
        {!isUser && actions && (
          <div className="flex max-w-full flex-col items-start gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
