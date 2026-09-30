"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef } from "react";

const fadeClasses =
  "from-layer-surface-default pointer-events-none absolute inset-y-0 z-10 w-14 to-transparent opacity-0 transition-opacity motion-reduce:transition-none min-[1200px]:w-24";

/** 가로로 넘기는 목록의 잘린 가장자리에 흰 그라데이션을 덮어 옆에 더 있음을 알린다.
    첫 자식이 스크롤 컨테이너(`overflow-x-auto`)여야 하고, 더 넘길 쪽 가장자리에만 보인다. */
export function ScrollFade({ children, className, ...props }: ComponentPropsWithoutRef<"div">) {
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = frame.current;
    const el = box?.firstElementChild;
    if (!box || !(el instanceof HTMLElement)) return;
    const update = () => {
      box.toggleAttribute("data-fade-start", el.scrollLeft > 1);
      box.toggleAttribute("data-fade-end", el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    /* 카드 수가 나중에 바뀌어도(재조회) 목록 크기는 그대로라 ResizeObserver만으로는 놓친다. */
    const mutation = new MutationObserver(update);
    mutation.observe(el, { childList: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutation.disconnect();
    };
  }, []);
  return (
    <div {...props} ref={frame} className={`group/scroll-fade relative ${className ?? ""}`}>
      {children}
      <span
        aria-hidden
        className={`${fadeClasses} left-0 bg-linear-to-r group-data-[fade-start]/scroll-fade:opacity-100`}
      />
      <span
        aria-hidden
        className={`${fadeClasses} right-0 bg-linear-to-l group-data-[fade-end]/scroll-fade:opacity-100`}
      />
    </div>
  );
}
