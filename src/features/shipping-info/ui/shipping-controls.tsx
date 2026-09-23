import type { ReactNode } from "react";
import { Select } from "@/shared/components/ui/select";
import { couriers, type Courier } from "../model/shipping-demo";

/* Figma `btn_action`/`save_btn`(488:7601·488:7603): 둘 다 60×36에 같은 라벨 크기다.
   면 색만 달라 공통 부분을 여기 둔다. Button은 h-46/px 사양이 달라 쓰지 않는다. */
const bulkActionClasses = [
  "text-caption-s flex h-9 shrink-0 items-center justify-center rounded-xs font-medium whitespace-nowrap",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
  "disabled:cursor-not-allowed disabled:bg-layer-surface-disabled disabled:text-text-disabled",
].join(" ");

/* Figma 선택 상태: 검색은 탭의 오른쪽으로 올라가고, 표 바로 위 자리는 선택 수와 36px 일괄 작업 바가
   차지한다. 검색을 탭 오른쪽에 두려면 보드 최상위가 relative여야 한다. */
export function ShippingControls({ search, bulkBar }: { search: ReactNode; bulkBar?: ReactNode }) {
  if (!bulkBar)
    return (
      <div className="mt-8 flex justify-end">
        <div className="w-full min-[1200px]:w-[282px]">{search}</div>
      </div>
    );
  return (
    <>
      <div className="mt-4 w-full min-[1200px]:absolute min-[1200px]:top-[88px] min-[1200px]:right-0 min-[1200px]:mt-0 min-[1200px]:w-[282px]">
        {search}
      </div>
      <div className="mt-4 min-[1200px]:mt-8">{bulkBar}</div>
    </>
  );
}

/** 선택한 주문의 일괄 택배사·발송 처리·저장. `onSave`가 없으면 저장은 준비중으로 막는다. */
export function ShippingBulkBar({
  count,
  courier,
  onCourierChange,
  onShip,
  onSave,
  busy = false,
}: {
  count: number;
  courier: Courier | "";
  onCourierChange: (courier: Courier | "") => void;
  onShip: () => void;
  onSave?: () => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-between">
      <p aria-live="polite" className="text-body-s text-text-default">
        {count} 개 선택 됨
      </p>
      <div className="flex flex-col gap-2 min-[1200px]:flex-row min-[1200px]:items-center min-[1200px]:justify-end min-[1200px]:gap-[9px]">
        <Select
          aria-label="선택한 주문의 택배사"
          /* Select의 기본 w-full보다 Figma의 164px 일괄 택배사 폭을 우선한다. */
          className="w-full shrink-0 min-[1200px]:w-41!"
          disabled={busy}
          onChange={(event) => onCourierChange(event.target.value as Courier | "")}
          size="sm"
          value={courier}
        >
          <option value="">배송사를 입력하세요</option>
          {couriers.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <div className="flex w-full items-center gap-2 min-[1200px]:w-auto">
          <button
            className={`${bulkActionClasses} bg-layer-surface-disabled text-text-default enabled:hover:bg-layer-surface-disabled-hover min-w-0 flex-1 min-[1200px]:w-[114px] min-[1200px]:flex-none`}
            disabled={busy}
            onClick={onShip}
            type="button"
          >
            발송 처리
          </button>
          <button
            aria-label={onSave ? undefined : "저장 (준비중)"}
            className={`${bulkActionClasses} bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover min-w-0 flex-1 min-[1200px]:w-[146px] min-[1200px]:flex-none`}
            disabled={busy || !onSave}
            onClick={onSave}
            title={onSave ? undefined : "준비중"}
            type="button"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
