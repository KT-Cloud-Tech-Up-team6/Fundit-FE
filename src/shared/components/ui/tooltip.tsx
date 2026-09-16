import type { ReactNode } from "react";
import { Icon } from "./icon";

type TooltipDirection = "vertical" | "horizontal";

type TooltipProps = {
  children: ReactNode;
  className?: string;
  direction?: TooltipDirection;
};

/* 위치 계산(화면 안에 맞추기, 열림/닫힘 등)은 화면마다 다르므로 이 atom은
   말풍선 모양만 그린다 — 배치는 호출부 책임. */
export function Tooltip({ children, className, direction = "vertical" }: TooltipProps) {
  const isHorizontal = direction === "horizontal";
  return (
    <div
      className={["flex", isHorizontal ? "items-start" : "flex-col items-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      {isHorizontal ? (
        <Icon className="text-layer-bg h-[21px] w-[9px] shrink-0" name="tooltipTail" />
      ) : null}
      <div className="bg-layer-bg text-text-default text-label-s max-w-[204px] rounded-xs px-2 py-1 font-medium">
        {children}
      </div>
      {isHorizontal ? null : (
        <span
          aria-hidden
          className="border-t-layer-bg border-x-4 border-t-4 border-x-transparent"
        />
      )}
    </div>
  );
}
