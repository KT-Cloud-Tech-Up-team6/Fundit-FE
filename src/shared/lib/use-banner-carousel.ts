"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type RefObject } from "react";
import { useHorizontalDrag } from "./use-horizontal-drag";

const AUTOPLAY_INTERVAL_MS = 4000;

/**
 * 프로모션 배너의 공통 넘김 동작. 카테고리 배너와 홈 히어로 배너가 같은 규칙을 쓴다.
 * 4초마다 다음 장으로 넘기고, 사용자가 누르거나 포커스하면 멈췄다가 끝나고 4초 뒤 다시 넘긴다.
 * 동작 줄이기 설정이면 자동으로 넘기지 않는다. 트랙은 가로 스크롤 요소이고 한 장이 트랙 폭이다.
 */
export function useBannerCarousel(slideCount: number) {
  const drag = useHorizontalDrag();
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
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
        left: ((activeIndex + 1) % slideCount) * track.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeIndex, autoplayPaused, reducedMotion, slideCount]);

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
      Math.max(0, Math.min(slideCount - 1, Math.round(track.scrollLeft / track.clientWidth))),
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

  /** 좌우 화살표처럼 트랙 밖의 버튼으로 옮길 때 쓴다. 동작 줄이기면 바로 옮긴다. */
  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({
      left: index * track.clientWidth,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  const trackProps: HTMLAttributes<HTMLDivElement> & { ref: RefObject<HTMLDivElement | null> } = {
    ref: trackRef,
    onScroll: handleScroll,
    ...drag,
    onPointerDown(event) {
      drag.onPointerDown?.(event);
      pauseAutoplay();
    },
    onPointerUp(event) {
      drag.onPointerUp?.(event);
      resumeAutoplay();
    },
    onPointerCancel(event) {
      drag.onPointerCancel?.(event);
      resumeAutoplay();
    },
    onFocus: pauseAutoplay,
    onBlur: resumeAutoplay,
  };

  return { activeIndex, scrollToIndex, trackProps };
}
