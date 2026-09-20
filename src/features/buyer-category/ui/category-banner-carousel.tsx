"use client";

import Image from "next/image";
import { useHorizontalDrag } from "@/shared/lib/use-horizontal-drag";
import { useEffect, useRef, useState } from "react";
import styles from "./category-banner-carousel.module.css";

const AUTOPLAY_INTERVAL_MS = 4000;
// 실제 배너 콘텐츠·장수는 미정. Figma 표기("1/3")를 따라 목업 3장만 둔다.
const SLIDE_COUNT = 3;

export function CategoryBannerCarousel() {
  const drag = useHorizontalDrag();
  const [reducedMotion, setReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (autoplayPaused || reducedMotion) return;
    const id = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({
        left: ((activeIndex + 1) % SLIDE_COUNT) * track.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeIndex, autoplayPaused, reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) clearTimeout(resumeTimer.current);
    },
    [],
  );

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(
      Math.max(0, Math.min(SLIDE_COUNT - 1, Math.round(track.scrollLeft / track.clientWidth))),
    );
  }

  // scroll 이벤트만으로는 자동 재생 자신의 smooth scrollTo와 사용자 스와이프를 구분할 수
  // 없다(자동 스크롤도 scroll 이벤트를 낸다). 사용자 조작 중에는 멈추고 종료 후 재개한다.
  function pauseAutoplay() {
    setAutoplayPaused(true);
    if (resumeTimer.current !== null) clearTimeout(resumeTimer.current);
  }

  function resumeAutoplay() {
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
        {...drag}
        onPointerDown={(event) => {
          drag.onPointerDown?.(event);
          pauseAutoplay();
        }}
        onPointerUp={(event) => {
          drag.onPointerUp?.(event);
          resumeAutoplay();
        }}
        onPointerCancel={(event) => {
          drag.onPointerCancel?.(event);
          resumeAutoplay();
        }}
        onFocus={pauseAutoplay}
        onBlur={resumeAutoplay}
        className={`${styles.track} flex overflow-x-auto`}
      >
        {Array.from({ length: SLIDE_COUNT }, (_, index) => (
          <div
            key={index}
            aria-hidden={index !== activeIndex}
            className={`${styles.slide} relative aspect-[350/88] w-full shrink-0 overflow-hidden rounded-xs`}
          >
            <Image
              src="/images/buyer-category/promotion.png"
              alt={`벨로라 건강 음료 프로모션 ${index + 1}`}
              fill
              sizes="(min-width: 1200px) 793px, calc(100vw - 40px)"
              className="object-cover object-top"
            />
          </div>
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
