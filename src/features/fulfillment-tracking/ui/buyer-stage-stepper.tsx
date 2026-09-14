import { Icon, type IconName } from "@/shared/components/ui/icon";
import {
  fulfillmentStages,
  stageStatusLabel,
  type FulfillmentStage,
  type FulfillmentState,
} from "../model/fulfillment-demo";

const stageIcon: Record<FulfillmentStage, IconName> = {
  prep: "stagePrep",
  production: "stageProduction",
  inspection: "stageInspection",
  release: "stageRelease",
  delivery: "stageDelivery",
};

type BuyerStageStepperProps = { state: FulfillmentState };

/**
 * 구매자용 읽기 전용 5단계 스텝퍼 — Figma stepper_icon_bar(822:8065).
 * 판매자 `StageStepper`와 달리 클릭·기록 건수 표기가 없다.
 */
export function BuyerStageStepper({ state }: BuyerStageStepperProps) {
  return (
    <ol className="flex w-full items-center">
      {fulfillmentStages.map(({ value, label }, index) => {
        const { status } = state[value];
        const filled = status !== "todo";
        const isLast = index === fulfillmentStages.length - 1;

        return (
          <li
            key={value}
            aria-label={`${label} 단계, ${stageStatusLabel[status]}`}
            aria-current={status === "active" ? "step" : undefined}
            className={isLast ? "flex shrink-0" : "flex flex-1 items-center"}
          >
            <span
              className={`flex size-[38px] shrink-0 items-center justify-center rounded-full ${
                filled ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"
              }`}
            >
              <Icon
                name={stageIcon[value]}
                className={`size-5 ${filled ? "text-text-inverse" : "text-text-secondary"}`}
              />
            </span>
            {!isLast && (
              <span
                aria-hidden
                className={`h-0.5 flex-1 ${
                  status === "done" ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
