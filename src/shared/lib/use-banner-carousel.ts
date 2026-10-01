"use client";

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type RefObject,
} from "react";
import { useHorizontalDrag } from "./use-horizontal-drag";

const AUTOPLAY_INTERVAL_MS = 4000;
/* scroll 이벤트가 이만큼 없으면 넘김(부드러운 스크롤·스냅)이 끝난 것으로 본다. */
const SETTLE_DELAY_MS = 120;

const subscribeNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** 트랙에 그릴 한 칸. `clone`은 끝과 처음을 잇기 위해 트랙 양 끝에 덧붙인 반대쪽 끝 장의 복제다. */
type BannerSlot = { key: string; index: number; clone: boolean };

/**
 * 프로모션 배너의 공통 넘김 동작. 카테고리 배너와 홈 히어로 배너가 같은 규칙을 쓴다.
 * 4초마다 다음 장으로 넘기고, 사용자가 누르거나 포커스하면 멈췄다가 끝나고 4초 뒤 다시 넘긴다.
 * 동작 줄이기 설정이면 자동으로 넘기지 않는다. 트랙은 가로 스크롤 요소이고 한 장이 트랙 폭이다.
 *
 * 끝과 처음은 이어진다(#527). 트랙 양 끝에 반대쪽 끝 장의 복제(`slots`)를 두고, 넘김이 복제 칸에서
 * 멈추면 같은 그림의 실제 장으로 순간 이동한다. 그래서 마지막 장의 다음은 오른쪽으로, 첫 장의 이전은
 * 왼쪽으로 넘어가며 되감지 않는다. 손가락 넘김(스크롤 스냅)도 양 끝에서 이어진다.
 * 앞쪽 복제는 하이드레이션 뒤에만 그려 서버 HTML의 첫 화면이 첫 장이게 한다.
 */
export function useBannerCarousel(slideCount: number) {
  const drag = useHorizontalDrag();
  const trackRef = useRef<HTMLDivElement>(null);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const hydrated = useSyncExternalStore(subscribeNothing, getClientSnapshot, getServerSnapshot);
  const loop = slideCount > 1;
  /** 앞쪽 복제 칸 수(0 또는 1). 트랙 칸 위치 = 실제 장 번호 + lead. */
  const lead = loop && hydrated ? 1 : 0;

  const slots: BannerSlot[] = [
    ...(lead ? [{ key: "clone-last", index: slideCount - 1, clone: true }] : []),
    ...Array.from({ length: slideCount }, (_, index) => ({
      key: String(index),
      index,
      clone: false,
    })),
    ...(loop ? [{ key: "clone-first", index: 0, clone: true }] : []),
  ];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  /* 앞쪽 복제 칸이 붙으면 보던 장이 그대로 보이게 한 칸 민다. 그리기 전에 옮겨 깜빡이지 않는다. */
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || !lead) return;
    track.scrollLeft = (activeRef.current + lead) * track.clientWidth;
  }, [lead]);

  const advance = useEffectEvent(() => move(1));

  /* 장이 바뀔 때마다 4초를 다시 센다. */
  useEffect(() => {
    if (!loop || autoplayPaused || reducedMotion) return;
    const id = setInterval(() => advance(), AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [activeIndex, autoplayPaused, reducedMotion, loop]);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) clearTimeout(resumeTimer.current);
      if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    },
    [],
  );

  /** 트랙 칸 위치의 실제 장 번호. 복제 칸은 같은 그림의 실제 장 번호다. */
  function slideAt(position: number) {
    return (((position - lead) % slideCount) + slideCount) % slideCount;
  }

  /* 복제 칸에 멈췄으면 같은 그림의 실제 장으로 순간 이동한다. 칸 경계가 아니면(손가락으로 붙잡고 있는 중)
     그대로 두고 다음 scroll 이벤트를 기다린다. */
  function settle() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const exact = track.scrollLeft / track.clientWidth;
    const position = Math.round(exact);
    if (Math.abs(exact - position) > 0.01) return;
    if (position >= lead && position < lead + slideCount) return;
    track.scrollTo({ left: (slideAt(position) + lead) * track.clientWidth, behavior: "instant" });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0 || slideCount === 0) return;
    const index = slideAt(Math.round(track.scrollLeft / track.clientWidth));
    activeRef.current = index;
    setActiveIndex(index);
    if (settleTimer.current !== null) clearTimeout(settleTimer.current);
    if (loop) settleTimer.current = setTimeout(settle, SETTLE_DELAY_MS);
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

  /** 좌우 화살표처럼 트랙 밖의 버튼과 자동 재생이 한 장씩 옮길 때 쓴다. 누른 방향으로만 움직이고
      끝에서는 반대쪽 끝 장으로 이어진다. 동작 줄이기면 바로 옮긴다. */
  function move(step: 1 | -1) {
    const track = trackRef.current;
    if (!track || !loop || track.clientWidth === 0) return;
    const width = track.clientWidth;
    const position = Math.round(track.scrollLeft / width);
    if (reducedMotion) {
      track.scrollTo({ left: (slideAt(position + step) + lead) * width, behavior: "instant" });
      return;
    }
    /* 넘김 직후 아직 복제 칸에 있으면 같은 그림의 실제 장에서 출발한다. */
    const start = slideAt(position) + lead;
    if (position !== start) track.scrollTo({ left: start * width, behavior: "instant" });
    track.scrollTo({ left: (start + step) * width, behavior: "smooth" });
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

  return { activeIndex, move, slots, trackProps };
}
