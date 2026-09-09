"use client";

type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
  /** 버튼 aria-label 앞에 붙는 대상 이름. 목록에 스테퍼가 여러 개일 때 구분용(예: "블랙"). */
  label: string;
  min?: number;
  max?: number;
};

/* 피처 로컬 컴포넌트. 사용처가 리워드 시트 한 곳뿐이라 shared 승격 기준("두 곳 이상")에
   못 미친다(docs/SHARED_COMPONENTS.md). 두 번째 사용처가 생기면 그때 옮긴다.
   +/- 글리프는 아이콘 asset 없이 막대로 그린다(checkbox·signup-terms-sheet와 같은 방식). */
export function QuantityStepper({ value, onChange, label, min = 1, max }: QuantityStepperProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;

  return (
    <div className="flex items-center gap-2">
      <StepButton
        label={`${label} 수량 줄이기`}
        disabled={atMin}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <span className="bg-text-default block h-px w-3" />
      </StepButton>
      {/* <output>은 암묵적으로 aria-live=polite인 라이브 리전이다. 여기에 aria-label을 달면
         일부 스크린리더가 값 대신 라벨을 읽어 수량 변화가 전달되지 않는다. 맥락은 위·아래
         버튼 라벨("블랙 수량 늘리기" 등)이 이미 준다. */}
      <output className="text-body-s text-text-default w-5 text-center tabular-nums">
        {value}
      </output>
      <StepButton
        label={`${label} 수량 늘리기`}
        disabled={atMax}
        onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}
      >
        <span className="relative block size-3">
          <span className="bg-text-default absolute top-1/2 left-0 h-px w-3 -translate-y-1/2" />
          <span className="bg-text-default absolute top-0 left-1/2 h-3 w-px -translate-x-1/2" />
        </span>
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={[
        "border-w-xs border-border-default flex size-7 items-center justify-center rounded-full",
        "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-40",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
