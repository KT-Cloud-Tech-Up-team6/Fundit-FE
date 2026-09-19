import type { ComponentPropsWithRef } from "react";

/* 화면 원본이 없어 목적지가 정해지지 않은 메뉴·아이콘 자리.
   Link로 두면 사용자가 placeholder 화면으로 빠지므로 비활성 컨트롤로 렌더한다.
   docs/OPEN_DECISIONS.md의 "추측해 구현하지 않는다"와 각 화면 문서의
   "목적지 미정이므로 비활성으로 유지한다"를 같은 방식으로 지킨다.
   해당 화면이 확정되면 이 자리를 Link로 되돌린다. */

type PendingDestinationProps = Omit<ComponentPropsWithRef<"button">, "disabled" | "type"> & {
  /** 원래 목적지의 이름. 보조 기술에 "(준비중)"과 함께 읽힌다. */
  label: string;
};

export function PendingDestination({
  label,
  children,
  className,
  ...props
}: PendingDestinationProps) {
  return (
    <button
      {...props}
      type="button"
      disabled
      aria-label={`${label} (준비중)`}
      title="준비중"
      className={["text-text-disabled cursor-not-allowed", className].filter(Boolean).join(" ")}
    >
      {children ?? label}
    </button>
  );
}
