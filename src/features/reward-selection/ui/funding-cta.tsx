"use client";

import { useEffect, useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { RewardSheet } from "./reward-sheet";
import type { Reward, RewardCart } from "../model/reward-demo";

type FundingCtaProps = {
  projectId: string;
  className?: string;
  more?: boolean;
  desktopFormId?: string;
  /** 실제 프로젝트의 리워드와 제출 동작. 없으면 시트가 목업 리워드·데모 주문 세션을 쓴다. */
  rewards?: Reward[];
  onSubmit?: (cart: RewardCart) => void;
};

/* IA(FL_B_PY_RWRD)에서 리워드 선택은 바텀시트이고 프로젝트 상세의 "펀딩하기"로 열린다.
   상세 화면 본문은 이번 범위가 아니라, 이 트리거만 페이지에 얹는다(Issue #56). */
export function FundingCta({
  projectId,
  className,
  more = false,
  desktopFormId,
  rewards,
  onSubmit,
}: FundingCtaProps) {
  const [open, setOpen] = useState(false);
  /* LIVE 상품 카드의 더보기. Figma 예시(1408:42112) "5+"는 같은 예시 상품의 데스크톱 리워드 수(5개)와 같다. 실제
     리워드를 받으면 그 수를 같은 모양("N+")으로 보인다(FE 자체 판단, #555). 목업은 예시 그대로다. */
  const moreCount = rewards ? `${rewards.length}+` : "5+";
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
          aria-label={rewards ? `리워드 ${rewards.length}개 더보기` : "리워드 5개 이상 더보기"}
          className="bg-layer-surface-primary text-text-static-white shrink-0 self-stretch px-3 text-[12px] leading-[1.3] font-semibold"
          onClick={() => setOpen(true)}
        >
          {moreCount}
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
      <RewardSheet
        projectId={projectId}
        open={open}
        onClose={() => setOpen(false)}
        rewards={rewards}
        onSubmit={onSubmit}
      />
    </>
  );
}
