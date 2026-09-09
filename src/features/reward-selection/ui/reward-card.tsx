"use client";

import { Select } from "@/shared/components/ui/select";
import type { Reward, RewardLine } from "../model/reward-demo";
import { formatWon } from "../model/reward-demo";
import { QuantityStepper } from "./quantity-stepper";

type RewardCardProps = {
  reward: Reward;
  selected: boolean;
  onToggle: () => void;
  lines: RewardLine[];
  onAddLine: (value: string) => void;
  onLineQuantityChange: (index: number, quantity: number) => void;
  onRemoveLine: (index: number) => void;
};

export function RewardCard({
  reward,
  selected,
  onToggle,
  lines,
  onAddLine,
  onLineQuantityChange,
  onRemoveLine,
}: RewardCardProps) {
  /* 단일 그룹만 지원한다(docs/REWARD_SELECTION.md). 여러 그룹(색상 × 사이즈)은 별도 이슈. */
  const optionGroup = reward.options[0];
  const badges = [
    ...(reward.isEarlyBird && reward.earlyBirdRate !== undefined
      ? [`얼리 버드 ${reward.earlyBirdRate}%`]
      : []),
    ...(reward.isLimited ? ["선착순 한정"] : []),
    ...reward.perks,
  ];

  return (
    <div
      className={[
        "border-w-xs bg-layer-surface-default flex flex-col gap-2 rounded-xs",
        selected ? "border-border-primary" : "border-border-default",
      ].join(" ")}
    >
      {/* 요약 줄만 label로 감싼다. 펼침 영역의 컨트롤을 label 안에 두면 중첩 인터랙티브가 된다. */}
      <label className="flex cursor-pointer gap-2 px-4 py-3">
        <input
          type="checkbox"
          value={reward.id}
          checked={selected}
          onChange={onToggle}
          aria-label={reward.name}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={[
            "relative mt-0.5 size-5 shrink-0 rounded-full",
            "peer-focus-visible:outline-border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
            selected ? "bg-layer-surface-primary" : "border-w-xs border-border-default",
          ].join(" ")}
        >
          {selected && (
            <span className="border-text-inverse absolute top-1/2 left-1/2 h-2 w-1.5 -translate-x-1/2 -translate-y-[60%] rotate-45 border-r-2 border-b-2" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          {badges.length > 0 && (
            <span className="flex flex-wrap gap-1">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="text-label-m text-text-default bg-layer-surface-disabled rounded-full px-2 py-1"
                >
                  {badge}
                </span>
              ))}
            </span>
          )}

          <span className="flex items-start justify-between gap-2">
            <span className="text-body-m text-text-default font-medium">{reward.name}</span>
            <span className="flex shrink-0 flex-col items-end">
              {reward.originalPrice !== undefined && (
                <span className="text-body-s text-text-secondary line-through">
                  {formatWon(reward.originalPrice)}
                </span>
              )}
              <span className="text-title-s text-text-default">{formatWon(reward.price)}</span>
            </span>
          </span>

          {reward.meta.length > 0 && (
            <span className="text-caption-s text-text-default flex flex-wrap items-center gap-1">
              {reward.meta.map((piece, index) => (
                <span key={piece} className="flex items-center gap-1">
                  {index > 0 && <span aria-hidden>·</span>}
                  {piece}
                </span>
              ))}
            </span>
          )}
        </span>
      </label>

      {selected && (
        <div className="flex flex-col gap-2 px-4 pb-3">
          {optionGroup && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-body-s text-text-secondary shrink-0">
                {optionGroup.groupName}
              </span>
              <Select
                size="sm"
                aria-label={`${reward.name} ${optionGroup.groupName}`}
                className="w-32"
                value=""
                onChange={(event) => {
                  if (event.target.value) onAddLine(event.target.value);
                }}
              >
                <option value="" disabled>
                  선택
                </option>
                {optionGroup.values.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {optionGroup && lines.length === 0 && (
            <p className="text-caption-s text-text-secondary">옵션을 선택해 주세요.</p>
          )}

          {lines.map((line, index) => (
            <div key={line.value ?? "quantity"} className="flex items-center justify-between gap-3">
              <span className="text-body-s text-text-default shrink-0">{line.value ?? "수량"}</span>
              <div className="flex items-center gap-2">
                <QuantityStepper
                  label={line.value ?? reward.name}
                  value={line.quantity}
                  onChange={(next) => onLineQuantityChange(index, next)}
                />
                {optionGroup && (
                  <button
                    type="button"
                    aria-label={`${line.value ?? ""} 삭제`}
                    onClick={() => onRemoveLine(index)}
                    className="focus-visible:outline-border-primary flex size-7 shrink-0 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span aria-hidden className="relative size-3">
                      <span className="bg-text-secondary absolute top-1/2 left-0 h-px w-3 rotate-45" />
                      <span className="bg-text-secondary absolute top-1/2 left-0 h-px w-3 -rotate-45" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
