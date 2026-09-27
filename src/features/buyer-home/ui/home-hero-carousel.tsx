"use client";

import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/shared/components/ui/icon";
import { useBannerCarousel } from "@/shared/lib/use-banner-carousel";
import type { HeroSlide } from "../model/home-mock";
import styles from "./buyer-home.module.css";

/* 모바일 `2315:71244`(350×88)와 PC `2315:71556`(1200×340). 배너 전체가 링크이고 PC에만
   좌우 화살표와 [지금 펀딩하기]가 있다. 보이지 않는 장은 inert로 포커스·보조 기술에서 뺀다. */
export function HomeHeroCarousel({ slides }: { slides: readonly HeroSlide[] }) {
  const { activeIndex, scrollToIndex, trackProps } = useBannerCarousel(slides.length);
  const move = (step: number) =>
    scrollToIndex((activeIndex + step + slides.length) % slides.length);

  return (
    <div className="relative overflow-hidden rounded-sm">
      <div
        {...trackProps}
        role="region"
        aria-label="프로모션 배너"
        tabIndex={0}
        className={`${styles.scroller} ${styles.heroTrack} flex overflow-x-auto`}
      >
        {slides.map((slide, index) => (
          <Link
            key={index}
            href={slide.href}
            inert={index !== activeIndex}
            className={`${styles.heroSlide} bg-layer-surface-disabled relative flex aspect-[350/88] w-full shrink-0 flex-col justify-center gap-6 overflow-hidden px-3.5 min-[1200px]:aspect-auto min-[1200px]:h-[340px] min-[1200px]:pl-[118px]`}
          >
            {/* 모바일 원본은 사진을 배너 폭보다 크게(약 1.43배) 왼쪽 위에 맞춰 문구 오른쪽에 텀블러가 오게 한다.
                PC는 1200×400 사진의 위쪽 340px를 보인다. */}
            <span className="absolute inset-y-0 left-0 w-[143%] min-[1200px]:w-full">
              <Image
                src={slide.image}
                alt=""
                fill
                loading={index === 0 ? "eager" : undefined}
                sizes="(min-width: 1200px) 1200px, 143vw"
                className="object-cover object-top"
              />
            </span>
            <span className="relative flex flex-col gap-1.5 min-[1200px]:gap-1">
              <span className="text-text-title min-[1200px]:text-heading-xl text-[13px] leading-[1.4] font-bold min-[1200px]:whitespace-pre-line">
                {slide.title}
              </span>
              <span className="text-text-secondary text-[10px] leading-[1.5] whitespace-pre-line min-[1200px]:hidden">
                {slide.mobileDescription}
              </span>
              <span className="text-text-secondary hidden max-w-[316px] text-[18px] leading-[1.42] font-medium min-[1200px]:block">
                {slide.description}
              </span>
            </span>
            <span className="bg-layer-surface-primary text-text-inverse text-body-strong relative hidden h-[46px] w-[183px] items-center justify-center gap-1 rounded-xs min-[1200px]:inline-flex">
              지금 펀딩하기
              <Icon name="next" className="size-5" />
            </span>
          </Link>
        ))}
      </div>
      <button
        type="button"
        aria-label="이전 배너"
        onClick={() => move(-1)}
        className="bg-layer-surface-default absolute top-1/2 left-5 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full min-[1200px]:flex"
      >
        <Icon name="previous" className="size-5" />
      </button>
      <button
        type="button"
        aria-label="다음 배너"
        onClick={() => move(1)}
        className="bg-layer-surface-default absolute top-1/2 right-5 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full min-[1200px]:flex"
      >
        <Icon name="next" className="size-5" />
      </button>
      <span className="bg-layer-surface-disabled text-text-info text-label-m min-[1200px]:text-caption-s absolute right-2 bottom-2 rounded-xs px-2 py-1 min-[1200px]:right-7 min-[1200px]:bottom-6 min-[1200px]:font-medium">
        {activeIndex + 1}/{slides.length}
      </span>
    </div>
  );
}
