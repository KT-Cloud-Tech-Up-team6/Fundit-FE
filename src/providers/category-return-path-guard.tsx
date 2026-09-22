"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { clearCategoryReturnPath } from "@/shared/lib/category-return-path";

/**
 * 카테고리 탭 복귀 경로(buyer-category-return-path)의 유효 범위를 지킨다.
 *
 * BuyerBottomNavigation은 /live·/categories 전환마다 리마운트될 수 있어(Next.js RSC
 * 특성) 그 컴포넌트의 마운트/언마운트나 popstate 리스너로는 "카테고리 영역을
 * 실제로 벗어났는지"를 안정적으로 판별할 수 없다 — 같은 popstate 이벤트로
 * 리스너가 호출되기 전에 리렌더링으로 제거될 수 있기 때문이다. 이 컴포넌트는
 * 루트 레이아웃에 한 번만 마운트되어 앱 전체 내비게이션 동안 절대 언마운트되지
 * 않으므로, pathname이 /categories 밖으로 나가는 전환만 안정적으로 감지해
 * 복귀 경로를 정리한다. /categories 내부에서 slug만 바뀌는 전환은 유지한다.
 */
export function CategoryReturnPathGuard() {
  // Storybook처럼 Next 라우터 컨텍스트가 없는 환경에서는 null이 올 수 있다.
  const pathname = usePathname() ?? "";
  const wasInCategories = useRef(pathname.startsWith("/categories"));

  useEffect(() => {
    const isInCategories = pathname.startsWith("/categories");
    if (wasInCategories.current && !isInCategories) {
      clearCategoryReturnPath();
    }
    wasInCategories.current = isInCategories;
  }, [pathname]);

  return null;
}
