import {
  fulfillmentStages,
  stageStatusLabel,
  type FulfillmentStage,
  type FulfillmentState,
  type StageStatus,
} from "../model/fulfillment-demo";

type StageStepperProps = {
  state: FulfillmentState;
  selected: FulfillmentStage;
  onSelect: (stage: FulfillmentStage) => void;
};

/* 노드 3상태 — Figma "진행 상태 표시"(488:7244).
   진행 중은 흰 배경 + 굵은 테두리 링, 진행 완료는 채워진 원 + 흰 체크. */
const nodeClasses: Record<StageStatus, string> = {
  todo: "bg-layer-surface-disabled",
  active: "border-w-xl border-border-primary bg-layer-surface-default",
  done: "bg-layer-surface-primary text-text-inverse",
};

/* ponytail: 체크 아이콘 asset이 없어 회전한 사각형의 두 변으로 그린다(select.tsx의 화살표와 같은 방식).
   Icon에 체크가 추가되면 <Icon name="check" />로 바꾼다. */
function CheckMark() {
  return (
    <span
      aria-hidden
      className="border-text-inverse -mt-0.5 h-3 w-1.5 rotate-45 border-r border-b"
    />
  );
}

export function StageStepper({ state, selected, onSelect }: StageStepperProps) {
  return (
    <section className="border-w-xs border-border-default bg-layer-surface-default rounded-xs p-6">
      <h2 className="text-title-m text-text-default">현재 배송 단계 설정</h2>
      <p className="text-body-s text-text-secondary mt-1">
        단계를 클릭해 해당 단계의 진행 내용을 등록하세요
      </p>

      {/* 좁은 화면에서 줄바꿈하면 단계 사이 연결선이 끊긴 채 남는다. 5단계를 한 줄로 두고 가로로 넘긴다.
          ponytail: 세로 스텝퍼는 연결선 방향을 따로 그려야 해서 두지 않는다. */}
      <ol className="mt-6 flex overflow-x-auto">
        {fulfillmentStages.map(({ value, label }, index) => {
          const { status, records } = state[value];
          const previousDone =
            index > 0 && state[fulfillmentStages[index - 1].value].status === "done";
          const lineClass = (dark: boolean) =>
            `h-0.5 flex-1 ${dark ? "bg-layer-surface-primary" : "bg-layer-surface-disabled"}`;

          return (
            <li key={value} className="min-w-24 shrink-0 grow basis-0">
              <button
                type="button"
                aria-current={value === selected ? "step" : undefined}
                aria-label={`${label} 단계, ${stageStatusLabel[status]}, 기록 ${records.length}건`}
                onClick={() => onSelect(value)}
                className="flex w-full cursor-pointer flex-col items-center gap-2"
              >
                <span aria-hidden className="flex w-full items-center">
                  {index === 0 ? (
                    <span className="flex-1" />
                  ) : (
                    <span className={lineClass(previousDone)} />
                  )}
                  <span
                    className={`flex size-8 items-center justify-center rounded-full ${nodeClasses[status]}`}
                  >
                    {status === "done" && <CheckMark />}
                  </span>
                  {index === fulfillmentStages.length - 1 ? (
                    <span className="flex-1" />
                  ) : (
                    <span className={lineClass(status === "done")} />
                  )}
                </span>
                <span
                  className={`text-body-s ${status === "todo" ? "text-text-secondary" : "text-text-default"}`}
                >
                  {label}
                </span>
                <span className="text-caption-s text-text-secondary">기록 {records.length}건</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
