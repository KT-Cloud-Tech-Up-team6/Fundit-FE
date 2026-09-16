"use client";

import { Badge } from "@/shared/components/ui/badge";
import { Icon } from "@/shared/components/ui/icon";
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
  /* 이 화면은 옵션 그룹 1개(색상)만 처리한다(Issue #56 범위). API 계약상 options는 배열이라
     그룹이 2개 이상이면 options[1..]는 무시되고 첫 그룹만으로 줄이 완성돼 펀딩하기가
     조기에 활성화된다. 현재 목업·기획 모두 그룹 1개이며, 다중 그룹 지원은 후속 이슈. */
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
        "border-w-xs bg-layer-surface-default flex flex-col rounded-xs",
        selected ? "border-border-primary" : "border-border-default",
      ].join(" ")}
    >
      {/* 요약 줄만 label로 감싼다. 펼침 영역의 컨트롤을 label 안에 두면 중첩 인터랙티브가 된다. */}
      <label
        className={`grid cursor-pointer grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-1 px-4 py-3 ${badges.length ? "gap-y-1" : "gap-y-2"}`}
      >
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
          className="peer-focus-visible:outline-border-primary flex size-7 items-center justify-center peer-focus-visible:outline-2"
        >
          <span
            className="block size-5"
            style={{
              backgroundImage: `url(/images/reward-selection/${selected ? "checked" : "unchecked"}.svg)`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          />
        </span>
        {badges.length > 0 && (
          <span className="col-span-2 flex min-h-7 flex-wrap items-center gap-1">
            {badges.map((badge) => (
              <Badge key={badge} shape="rounded" variant="neutral">
                {badge}
              </Badge>
            ))}
          </span>
        )}
        <span
          title={reward.name}
          className={`text-body-m text-text-default min-w-0 truncate font-semibold ${badges.length ? "col-span-2 col-start-1" : "self-center"}`}
        >
          {reward.name}
        </span>
        <span className="col-start-3 flex shrink-0 flex-col items-end">
          {reward.originalPrice !== undefined && (
            <span className="text-body-s text-text-secondary line-through">
              {formatWon(reward.originalPrice)}
            </span>
          )}
          <span className="text-title-m text-text-default">{formatWon(reward.price)}</span>
        </span>
        {reward.meta.length > 0 && (
          <span
            title={reward.meta.join(" · ")}
            className="text-caption-s text-text-default col-span-3 truncate"
          >
            {selected && reward.meta.length > 2
              ? reward.meta.slice(0, 2).join(" · ") + ` 및 +${reward.meta.length - 2}`
              : reward.meta.join(" · ")}
          </span>
        )}
      </label>

      {selected && (
        <div className="bg-layer-bg mx-4 mb-3 flex flex-col gap-1 rounded-xs px-3 py-2">
          {reward.shippingNote && (
            <p className="text-caption-s text-text-secondary">{reward.shippingNote}</p>
          )}
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
                    <Icon name="closeSmall" className="text-text-secondary block size-3" />
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
