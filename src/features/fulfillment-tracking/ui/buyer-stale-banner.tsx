import { Icon } from "@/shared/components/ui/icon";

type BuyerStaleBannerProps = { days: number };

/** 마지막 기록 이후 업데이트를 기다리는 구매자에게 미갱신 상태를 알린다. */
export function BuyerStaleBanner({ days }: BuyerStaleBannerProps) {
  return (
    <div
      role="status"
      className="bg-layer-surface-disabled text-body-s text-text-default flex w-full items-center gap-3 px-6 py-4"
    >
      <Icon name="warning" className="text-text-default size-6 shrink-0" />
      <div>
        <p>업데이트 예정</p>
        <p>마지막 업데이트 {days}일 전</p>
      </div>
    </div>
  );
}
