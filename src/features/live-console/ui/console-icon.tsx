import type { CSSProperties } from "react";

type ConsoleIconName =
  | "play"
  | "funding"
  | "viewers"
  | "chat"
  | "previous"
  | "next"
  | "warning"
  | "send"
  | "stream"
  | "avatar"
  | "close";

export function ConsoleIcon({
  name,
  className = "size-3.5",
}: {
  name: ConsoleIconName;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={
        {
          maskImage: `url('/images/live-console/${name}.svg')`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        } as CSSProperties
      }
    />
  );
}
