"use client";

import Image from "next/image";
import { useBannerCarousel } from "@/shared/lib/use-banner-carousel";
import styles from "./category-banner-carousel.module.css";

// 실제 배너 콘텐츠·장수는 미정. Figma 표기("1/3")를 따라 목업 3장만 둔다.
const SLIDE_COUNT = 3;

export function CategoryBannerCarousel() {
  const { activeIndex, trackProps } = useBannerCarousel(SLIDE_COUNT);

  return (
    <div className="relative">
      <div
        {...trackProps}
        role="region"
        aria-label="프로모션 배너"
        tabIndex={0}
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
