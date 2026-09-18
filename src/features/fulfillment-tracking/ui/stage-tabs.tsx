import { Badge } from "@/shared/components/ui/badge";
import {
  fulfillmentStages,
  stageStatusLabel,
  type FulfillmentStage,
  type FulfillmentState,
} from "../model/fulfillment-demo";

type StageTabsProps = {
  state: FulfillmentState;
  selected: FulfillmentStage;
  onSelect: (stage: FulfillmentStage) => void;
};

/**
 * 단계 탭바(Figma "tab", 1319:40708). 잠긴(todo) 단계도 눌러서 미리 볼 수 있고,
 * 그 안쪽 콘텐츠가 "이전 단계 완료 후 업데이트 가능" 안내로 바뀐다.
 *
 * ponytail: Figma 프레임 하나(제작·착수 완료 상태)에서만 "선택 + 완료" 탭이 14px SemiBold로
 * 다르게 그려져 있다. 나머지 프레임은 전부 "선택 = 16px Medium"이라 그쪽으로 통일한다.
 *
 * ponytail: 생김새는 탭이지만 role="tab"은 쓰지 않는다 — 화살표 키 이동(roving tabindex) 없이
 * ARIA tab 역할만 붙이면 스크린리더가 "탭 목록"이라 안내하고도 화살표 키가 안 먹어 오히려
 * 혼란을 준다. `aria-current` + 개별 aria-label만으로 충분히 접근 가능하다.
 * 값은 "step"이 아니라 "true"다 — 잠긴 단계를 미리 볼 때도 눌리므로, 선택된 항목이라는 뜻만 남긴다.
 */
export function StageTabs({ state, selected, onSelect }: StageTabsProps) {
  return (
    <div className="flex overflow-x-auto">
      {fulfillmentStages.map(({ value, label }) => {
        const { status, records } = state[value];
        const active = value === selected;

        return (
          <button
            aria-current={active ? "true" : undefined}
            aria-label={`${label} 단계, ${stageStatusLabel[status]}, 기록 ${records.length}건`}
            className={[
              "bg-layer-surface-default flex h-[46px] w-[122px] shrink-0 items-center justify-center gap-2 whitespace-nowrap",
              active
                ? "border-border-primary text-text-default text-body-emphasis border-b-[1.8px]"
                : status === "active"
                  ? "border-border-default text-text-default text-body-emphasis border-b"
                  : status === "done"
                    ? "border-border-default text-text-disabled text-body-m border-b"
                    : "border-border-default text-text-disabled text-label-l border-b",
            ].join(" ")}
            key={value}
            onClick={() => onSelect(value)}
            type="button"
          >
            {label}
            {status === "active" && (
              <Badge shape="rounded" variant="primary">
                진행중
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
