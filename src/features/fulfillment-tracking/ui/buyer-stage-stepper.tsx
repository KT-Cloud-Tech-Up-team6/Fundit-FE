import { Icon, type IconName } from "@/shared/components/ui/icon";
import { Badge } from "@/shared/components/ui/badge";
import { Tooltip } from "@/shared/components/ui/tooltip";
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

type BuyerStageStepperProps = {
  state: FulfillmentState;
  /** 데스크톱 Figma에는 현재 단계 위에 상태 배지가 있다. */
  showStatusBadge?: boolean;
  /** Figma 명세: 출고·배송 단계에는 예상 시작일 hover 툴팁을 표시한다. */
  showExpectedStartTooltip?: boolean;
};

/**
 * 구매자용 읽기 전용 5단계 스텝퍼 — Figma stepper_icon_bar(822:8065).
 * 판매자 `StageStepper`와 달리 클릭·기록 건수 표기가 없다.
 */
export function BuyerStageStepper({
  state,
  showStatusBadge = false,
  showExpectedStartTooltip = false,
}: BuyerStageStepperProps) {
  return (
    <ol className="flex w-full items-center">
      {fulfillmentStages.map(({ value, label }, index) => {
        const { status } = state[value];
        const filled = status !== "todo";
        const isLast = index === fulfillmentStages.length - 1;
        const showTooltip =
          showExpectedStartTooltip &&
          (value === "release" || value === "delivery") &&
          status === "todo" &&
          state[value].startDate;
        const circleClass = `flex size-[38px] shrink-0 items-center justify-center rounded-full ${
          filled ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"
        }`;
        const icon = (
          <Icon
            name={stageIcon[value]}
            className={`size-5 ${filled ? "text-text-inverse" : "text-text-default"}`}
          />
        );

        return (
          <li
            key={value}
            aria-label={`${label} 단계, ${stageStatusLabel[status]}`}
            aria-current={status === "active" ? "step" : undefined}
            className={isLast ? "flex shrink-0" : "flex flex-1 items-center"}
          >
            <span className={`group relative flex shrink-0 ${showStatusBadge ? "pt-9" : ""}`}>
              {showStatusBadge && status === "active" && (
                <Badge
                  shape="rounded"
                  variant="primary"
                  className="text-label-m absolute top-0 left-1/2 h-6 -translate-x-1/2 px-2"
                >
                  진행중
                </Badge>
              )}
              {showTooltip && (
                <Tooltip
                  variant="inverse"
                  role="tooltip"
                  className="pointer-events-none absolute bottom-[51px] left-1/2 z-10 hidden -translate-x-1/2 group-focus-within:flex group-hover:flex"
                  contentClassName="w-[100px] text-center"
                >
                  <span className="block">예상 시작일</span>
                  <span className="block">{state[value].startDate?.replaceAll("-", ".")}</span>
                </Tooltip>
              )}
              {showTooltip ? (
                <button
                  type="button"
                  aria-label={`${label} 예상 시작일 ${state[value].startDate?.replaceAll("-", ".")}`}
                  className={`${circleClass} cursor-default`}
                >
                  {icon}
                </button>
              ) : (
                <span className={circleClass}>{icon}</span>
              )}
            </span>
            {!isLast && (
              <span
                aria-hidden
                className={`${showStatusBadge ? "mt-9" : ""} h-0.5 flex-1 ${
                  status === "done" ? "bg-layer-surface-primary" : "bg-border-default"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
