"use client";

import { useRouter } from "next/navigation";

import { Icon } from "@/shared/components/ui/icon";

/* 결제 흐름 화면 공용 상단 바 (Figma top_app_bar).
   뒤로가기는 arrow_up_line 을 -90° 돌린 좌향 화살표(꼬리 있음), 제목은 가운데. */
export function CheckoutTopBar({ title = "프로젝트 제목" }: { title?: string }) {
  const router = useRouter();

  return (
    <header className="bg-layer-surface-default flex h-13 shrink-0 items-center justify-between px-3 py-1">
      <button
        type="button"
        aria-label="뒤로가기"
        onClick={() => router.back()}
        className="focus-visible:outline-border-primary flex size-10 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Icon name="arrowUp" className="size-6 -rotate-90" />
      </button>
      <h1 className="text-title-s text-text-default min-w-0 flex-1 truncate text-center">
        {title}
      </h1>
      {/* 제목을 가운데 두기 위한 좌우 대칭 여백(Figma의 opacity-0 btn_back) */}
      <span aria-hidden className="size-10 shrink-0" />
    </header>
  );
}
