"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { RewardSheet } from "./reward-sheet";

type FundingCtaProps = {
  projectId: string;
  className?: string;
  more?: boolean;
  desktopFormId?: string;
};

/* IA(FL_B_PY_RWRD)에서 리워드 선택은 바텀시트이고 프로젝트 상세의 "펀딩하기"로 열린다.
   상세 화면 본문은 이번 범위가 아니라, 이 트리거만 페이지에 얹는다(Issue #56). */
export function FundingCta({ projectId, className, more = false, desktopFormId }: FundingCtaProps) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!desktopFormId) return;
    const desktop = window.matchMedia("(min-width: 1200px)");
    const closeMobileSheet = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", closeMobileSheet);
    return () => desktop.removeEventListener("change", closeMobileSheet);
  }, [desktopFormId]);

  return (
    <>
      {more ? (
        <button
          type="button"
          aria-label="리워드 5개 이상 더보기"
          className="bg-layer-surface-primary text-text-static-white shrink-0 self-stretch px-3 text-[12px] leading-[1.3] font-semibold"
          onClick={() => setOpen(true)}
        >
          5+
          <br />
          더보기
        </button>
      ) : (
        <Button
          className={`${className ?? ""} ${desktopFormId ? "min-[1200px]:hidden" : ""}`}
          onClick={() => setOpen(true)}
        >
          펀딩하기
        </Button>
      )}
      {desktopFormId && (
        <Button
          type="submit"
          form={desktopFormId}
          className={`${className ?? ""} max-[1200px]:hidden`}
        >
          펀딩하기
        </Button>
      )}
      <RewardSheet projectId={projectId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
