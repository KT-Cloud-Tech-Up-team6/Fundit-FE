import { Icon } from "@/shared/components/ui/icon";

type StaleBannerProps = { days: number };

/** 마지막 기록 이후 오래 정체된 단계에 뜨는 경고 배너(Figma 정체 경고 상태). */
export function StaleBanner({ days }: StaleBannerProps) {
  return (
    <div
      role="status"
      className="bg-layer-surface-disabled text-body-s text-text-default flex w-full items-center gap-3 px-6 py-4"
    >
      <Icon name="warning" className="text-text-default size-6 shrink-0" />
      <div>
        <p>제작 진행 상황을 업데이트해주세요</p>
        <p>마지막 업데이트 후 {days}일이 지났어요.</p>
      </div>
    </div>
  );
}
