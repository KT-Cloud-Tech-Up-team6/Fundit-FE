import type { ReactNode } from "react";

type HeaderWebProps = {
  actions?: ReactNode;
  className?: string;
  logo: ReactNode;
  nav?: ReactNode;
};

/**
 * PC 전용 상단 헤더 껍데기 (Figma header/header_web). 로고·nav·오른쪽 액션은 호출자가 채운다.
 * 판매자 화면(PC 전용)과 구매자 PC 폭 화면이 구조는 같고 내용만 달라 공유한다.
 */
export function HeaderWeb({ actions, className, logo, nav }: HeaderWebProps) {
  return (
    <header
      className={["border-border-default h-[70px] border-b", className].filter(Boolean).join(" ")}
    >
      <div className="max-w-content mx-auto flex h-full w-full items-center gap-2 px-5 md:gap-4 xl:px-0">
        {logo}
        {/* 로고와 완전히 가운데 정렬하지 않고 메뉴를 살짝 아래로 내린다. */}
        {nav && <div className="pt-1.5">{nav}</div>}
        {actions && <div className="ml-auto flex items-center gap-2 md:gap-3">{actions}</div>}
      </div>
    </header>
  );
}
