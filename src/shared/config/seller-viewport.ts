import type { Viewport } from "next";

/**
 * 판매자 화면의 뷰포트. 판매자 화면은 PC 우선으로 설계됐고(FE 핸드오프 가이드 4절, Figma 판매자 시안은 1440뿐)
 * PC만 구현한다(2026-09-28 결정). 휴대폰에서도 모바일 레이아웃 대신 PC 화면을 축소해 보이게 한다(#409).
 */
/* 기본값 `initial-scale=1`이 남으면 휴대폰이 1200폭 화면의 왼쪽만 원래 배율로 보여 준다. 값을 비워
   화면 폭에 맞춰 축소되게 한다. Next가 레이아웃의 viewport 키를 값이 없어도 그대로 덮어쓰는 내부 동작
   (`resolve-metadata`의 `mergeViewport`)에 기대므로, Next를 올리면 빌드 HTML의 viewport 메타를 다시 확인한다. */
export const sellerViewport: Viewport = { width: 1200, initialScale: undefined };
