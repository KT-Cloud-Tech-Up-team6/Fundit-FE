"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./category-banner-carousel.module.css";

const AUTOPLAY_INTERVAL_MS = 4000;
// 실제 배너 콘텐츠·장수는 미정. Figma 표기("1/3")를 따라 목업 3장만 둔다.
const SLIDE_COUNT = 3;

export function CategoryBannerCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  useEffect(() => {
    if (autoplayPaused) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({
        left: ((activeIndex + 1) % SLIDE_COUNT) * track.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeIndex, autoplayPaused]);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) clearTimeout(resumeTimer.current);
    },
    [],
  );

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
    // 사용자가 직접 스와이프하면 한 텀 쉬고 자동 재생을 재개한다.
    setAutoplayPaused(true);
    if (resumeTimer.current !== null) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setAutoplayPaused(false), AUTOPLAY_INTERVAL_MS);
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        role="region"
        aria-label="프로모션 배너"
        tabIndex={0}
        onScroll={handleScroll}
        className={`${styles.track} flex overflow-x-auto`}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <div
            key={index}
            aria-hidden={index !== activeIndex}
            className={`${styles.slide} h-22 w-full shrink-0 rounded-xs`}
          />
        ))}
      </div>
      <span
        className={`${styles.counter} absolute right-2 bottom-2 rounded-xs px-2 py-1 text-[11px] leading-[1.3]`}
      >
        {activeIndex + 1}/{SLIDE_COUNT}
      </span>
    </div>
  );
}
