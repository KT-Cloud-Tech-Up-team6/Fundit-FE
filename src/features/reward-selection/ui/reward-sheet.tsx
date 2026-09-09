"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import {
  addOptionLine,
  calcCartTotal,
  demoRewards,
  formatWon,
  initialLines,
  isCartSubmittable,
} from "../model/reward-demo";
import type { Reward, RewardCart } from "../model/reward-demo";
import { RewardCard } from "./reward-card";

/* 목업은 불변이고 렌더마다 새로 만들 이유가 없다. 기본값으로 이 상수를 공유한다. */
const DEMO_REWARDS = demoRewards();

type RewardSheetProps = {
  projectId: string;
  open: boolean;
  onClose: () => void;
  /** Storybook에서 목업을 갈아끼우기 위한 자리. 화면에서는 기본 목업을 쓴다. */
  rewards?: Reward[];
};

export function RewardSheet({
  projectId,
  open,
  onClose,
  rewards = DEMO_REWARDS,
}: RewardSheetProps) {
  const router = useRouter();
  /* 멀티 선택: 담은 리워드마다 옵션 조합을 여러 줄로 들고, 키 존재 여부가 선택 상태다.
     Figma는 라디오(단일)로 그려졌지만 요구사항은 멀티(Issue #56). */
  const [cart, setCart] = useState<RewardCart>({});

  function toggleReward(reward: Reward) {
    setCart((prev) => {
      if (prev[reward.id]) {
        const next = { ...prev };
        delete next[reward.id];
        return next;
      }
      return { ...prev, [reward.id]: initialLines(reward) };
    });
  }

  function addLine(id: string, value: string) {
    setCart((prev) => ({ ...prev, [id]: addOptionLine(prev[id] ?? [], value) }));
  }

  function setLineQuantity(id: string, index: number, quantity: number) {
    setCart((prev) => ({
      ...prev,
      [id]: prev[id].map((line, i) => (i === index ? { ...line, quantity } : line)),
    }));
  }

  function removeLine(id: string, index: number) {
    setCart((prev) => ({ ...prev, [id]: prev[id].filter((_, i) => i !== index) }));
  }

  const total = calcCartTotal(rewards, cart);
  const canSubmit = isCartSubmittable(cart);

  function submit() {
    /* 선택값(리워드·옵션·수량)을 주문서로 넘기는 방식은 checkout 이슈에서 확정한다.
       이번엔 이동만 한다(Issue #56). */
    router.push(`/funding/${projectId}/checkout`);
  }

  return (
    <BottomSheet
      aria-labelledby="reward-sheet-title"
      onClose={onClose}
      open={open}
      footer={
        <div className="flex flex-col gap-2">
          {/* 줄을 담고 빼거나 수량을 바꾸면 합계가 소리로 읽히도록 status로 둔다. */}
          <div role="status" className="flex items-center justify-between">
            <span className="text-body-m text-text-default">총 금액</span>
            <span className="text-title-s text-text-default">{formatWon(total)}</span>
          </div>
          <Button className="w-full" disabled={!canSubmit} onClick={submit}>
            펀딩하기
          </Button>
        </div>
      }
    >
      <h2 id="reward-sheet-title" className="text-title-s text-text-default py-2 text-center">
        리워드 선택
      </h2>

      <div role="group" aria-labelledby="reward-sheet-title" className="mt-2 flex flex-col gap-3">
        {rewards.map((reward) => {
          const lines = cart[reward.id];
          return (
            <RewardCard
              key={reward.id}
              reward={reward}
              selected={Boolean(lines)}
              onToggle={() => toggleReward(reward)}
              lines={lines ?? []}
              onAddLine={(value) => addLine(reward.id, value)}
              onLineQuantityChange={(index, quantity) =>
                setLineQuantity(reward.id, index, quantity)
              }
              onRemoveLine={(index) => removeLine(reward.id, index)}
            />
          );
        })}
      </div>
    </BottomSheet>
  );
}
