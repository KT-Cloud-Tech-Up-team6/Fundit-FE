"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { useOrderSession } from "@/entities/order/model/order-session";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { Icon } from "@/shared/components/ui/icon";
import { Select } from "@/shared/components/ui/select";
import {
  addOptionLine,
  calcCartTotal,
  designRewards,
  formatWon,
  initialLines,
  isCartSubmittable,
  lineKey,
  pickedOption,
  remainingFor,
} from "../model/reward-demo";
import type { Reward, RewardCart } from "../model/reward-demo";
import { RewardCard } from "./reward-card";
import { QuantityStepper } from "./quantity-stepper";
import styles from "./reward-sheet.module.css";

const DEMO_REWARDS = designRewards();

type RewardSheetProps = {
  projectId: string;
  open?: boolean;
  onClose?: () => void;
  inlineFormId?: string;
  rewards?: Reward[];
  /** 유효한 장바구니로 펀딩하기를 누르면 부른다. 없으면 데모 주문 세션에 담아 목업 주문서로 간다. */
  onSubmit?: (cart: RewardCart) => void;
};

export function RewardSheet({
  projectId,
  open = false,
  onClose,
  inlineFormId,
  rewards = DEMO_REWARDS,
  onSubmit,
}: RewardSheetProps) {
  const router = useRouter();
  const session = useOrderSession();
  const listId = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cart, setCart] = useState<RewardCart>(() =>
    session?.selection?.projectId === projectId ? session.selection.cart : {},
  );
  /* 옵션 그룹이 여럿이면 모든 그룹을 고를 때까지 고른 값 순번을 리워드별로 들고 있다. */
  const [picks, setPicks] = useState<Record<string, (number | undefined)[]>>({});

  function selectReward(reward: Reward) {
    setCart((previous) =>
      previous[reward.id] ? previous : { [reward.id]: initialLines(reward), ...previous },
    );
    setExpanded(false);
    trigger.current?.focus();
  }

  function removeReward(id: string) {
    setCart((previous) =>
      Object.fromEntries(Object.entries(previous).filter(([key]) => key !== id)),
    );
    setPicks((previous) => ({ ...previous, [id]: [] }));
  }

  function pickOption(reward: Reward, groupIndex: number, valueIndex: number) {
    const next = reward.options.map((_, index) =>
      index === groupIndex ? valueIndex : picks[reward.id]?.[index],
    );
    const option = pickedOption(reward, next);
    setPicks((previous) => ({ ...previous, [reward.id]: option ? [] : next }));
    if (option)
      setCart((previous) => ({
        ...previous,
        [reward.id]: addOptionLine(previous[reward.id], option.value, option.optionValueIds),
      }));
  }

  const selected = Object.entries(cart).flatMap(([id, lines]) => {
    const reward = rewards.find((item) => item.id === id);
    return reward ? [{ reward, lines }] : [];
  });
  const total = calcCartTotal(rewards, cart);
  const quantity = selected.reduce(
    (sum, { lines }) => sum + lines.reduce((count, line) => count + line.quantity, 0),
    0,
  );

  function submit() {
    if (!isCartSubmittable(cart)) {
      setExpanded(true);
      trigger.current?.focus();
      return;
    }
    if (onSubmit) {
      onClose?.();
      onSubmit(cart);
      return;
    }
    session?.setSelection({ projectId, cart });
    if (session?.selection?.projectId !== projectId) session?.setForm(null);
    session?.setReceipt(null);
    onClose?.();
    router.push(`/funding/${projectId}/checkout`);
  }

  const totalRow = (
    <div
      role="status"
      aria-label="리워드 총 금액"
      className={selected.length ? "flex items-center justify-between" : "sr-only"}
    >
      <span className="text-body-s text-text-secondary">총 {quantity}개</span>
      <span className="text-title-m">{formatWon(total)}</span>
    </div>
  );
  const content = (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <button
          ref={trigger}
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded(!expanded)}
          className="border-border-default text-text-secondary focus-visible:outline-border-primary flex h-13 w-full shrink-0 items-center justify-between rounded-xs border px-4 text-[14px] focus-visible:outline-2"
        >
          리워드 ({rewards.length}개)
          <Icon name="arrowDown" className={`size-4 ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded && (
          <div
            id={listId}
            role="group"
            aria-label="리워드 목록"
            className={`border-border-default min-h-0 [scrollbar-width:none] overflow-y-auto rounded-xs border ${inlineFormId ? "max-h-[460px]" : ""}`}
          >
            {rewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} onSelect={() => selectReward(reward)} />
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div
          role="group"
          aria-label="선택한 리워드"
          tabIndex={0}
          className={`${inlineFormId ? "mt-4" : "mt-8"} shrink-0 [scrollbar-width:none] space-y-2 overflow-y-auto ${expanded ? "max-h-32" : "max-h-[min(400px,50dvh)]"}`}
        >
          {selected.map(({ reward, lines }) => {
            const left = remainingFor(reward, lines);
            return (
              <div
                key={reward.id}
                className={`bg-layer-bg rounded-xs px-3 ${inlineFormId ? "py-4" : "py-2"}`}
              >
                <div className="relative mb-1 flex items-start gap-2 pr-10">
                  <h3 className="text-body-strong min-w-0 truncate">{reward.name}</h3>
                  <button
                    type="button"
                    aria-label={`${reward.name} 삭제`}
                    onClick={() => removeReward(reward.id)}
                    className="focus-visible:outline-border-primary absolute top-0 right-0 flex size-8 items-start justify-end focus-visible:outline-2"
                  >
                    <Icon name="close" className="size-3.5" />
                  </button>
                </div>
                {reward.expectedShipping && (
                  <p
                    className={`text-caption-s text-text-secondary ${inlineFormId ? "mb-4" : "mb-1"}`}
                  >
                    {reward.expectedShipping}
                  </p>
                )}
                {/* 그룹마다 선택 상자를 두고, 모든 그룹을 고르면 그 조합을 줄로 담는다(노션 FE 자체 판단 61).
                  재고를 다 담았으면 새 조합을 더 담지 못한다. */}
                {reward.options.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {reward.options.map((group, groupIndex) => (
                      <Select
                        key={group.groupName}
                        aria-label={`${reward.name} ${group.groupName}`}
                        value={picks[reward.id]?.[groupIndex] ?? ""}
                        disabled={left !== undefined && left <= 0}
                        onChange={(event) =>
                          pickOption(reward, groupIndex, Number(event.target.value))
                        }
                      >
                        <option value="" disabled>
                          {reward.options.length > 1
                            ? `${group.groupName} 선택`
                            : "옵션을 선택해 주세요."}
                        </option>
                        {group.values.map((value, valueIndex) => (
                          <option key={valueIndex} value={valueIndex}>
                            {value.label}
                          </option>
                        ))}
                      </Select>
                    ))}
                  </div>
                )}
                {lines.map((line, index) => (
                  <div
                    key={lineKey(line) || "quantity"}
                    className={`flex flex-wrap items-center justify-between gap-2 ${index === 0 && reward.options.length > 0 ? "mt-2" : ""}`}
                  >
                    {line.value && <span className="text-body-s">{line.value}</span>}
                    <QuantityStepper
                      label={line.value ?? reward.name}
                      value={line.quantity}
                      max={left === undefined ? undefined : line.quantity + left}
                      onChange={(quantity) =>
                        setCart((prev) => ({
                          ...prev,
                          [reward.id]: prev[reward.id].map((entry, i) =>
                            i === index ? { ...entry, quantity } : entry,
                          ),
                        }))
                      }
                    />
                    <span className="text-title-m ml-auto">
                      {formatWon(reward.price * line.quantity)}
                    </span>
                    {line.value && (
                      <button
                        type="button"
                        className="flex size-4 items-center justify-center"
                        aria-label={`${line.value} 삭제`}
                        onClick={() =>
                          setCart((prev) => ({
                            ...prev,
                            [reward.id]: prev[reward.id].filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <Icon name="close" className="size-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (inlineFormId) {
    return (
      <form
        id={inlineFormId}
        aria-label="웹 리워드 선택"
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 className="text-title-s mb-2">리워드 선택</h2>
        {content}
        <div className={selected.length ? "mt-6" : undefined}>{totalRow}</div>
      </form>
    );
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => onClose?.()}
      title="리워드 선택"
      className={styles.sheet}
      data-expanded={expanded}
      footer={
        <div className="flex flex-col gap-3">
          {totalRow}
          <Button
            appearance="cta"
            className="w-full disabled:bg-[#cdced4]!"
            disabled={!isCartSubmittable(cart)}
            onClick={submit}
          >
            펀딩하기
          </Button>
        </div>
      }
    >
      {content}
    </BottomSheet>
  );
}
