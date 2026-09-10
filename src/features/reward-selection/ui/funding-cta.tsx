"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { RewardSheet } from "./reward-sheet";

type FundingCtaProps = {
  projectId: string;
  className?: string;
};

/* IA(FL_B_PY_RWRD)에서 리워드 선택은 바텀시트이고 프로젝트 상세의 "펀딩하기"로 열린다.
   상세 화면 본문은 이번 범위가 아니라, 이 트리거만 페이지에 얹는다(Issue #56). */
export function FundingCta({ projectId, className }: FundingCtaProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className={className} onClick={() => setOpen(true)}>
        펀딩하기
      </Button>
      <RewardSheet projectId={projectId} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
