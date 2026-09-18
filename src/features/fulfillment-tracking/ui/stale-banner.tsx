import { Icon } from "@/shared/components/ui/icon";

type StaleBannerProps = { days: number };

/** 마지막 기록 이후 오래 정체된 단계에 뜨는 경고 배너(Figma banner_delay_warning, 1319:40900). */
export function StaleBanner({ days }: StaleBannerProps) {
  return (
    <div
      role="status"
      className="bg-status-warning text-body-s text-text-warning flex w-full items-center gap-7 px-4 py-2"
    >
      <Icon name="warning" className="size-5 shrink-0" />
      <p>제작 진행 상황을 업데이트해주세요 마지막 업데이트 후 {days}일이 지났어요</p>
    </div>
  );
}
