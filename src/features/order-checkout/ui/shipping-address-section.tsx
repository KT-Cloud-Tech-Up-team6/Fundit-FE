import { Icon } from "@/shared/components/ui/icon";
import type { ShippingAddress, ShippingSectionState } from "../model/checkout-demo";

type ShippingAddressSectionProps = {
  /** 결제 시도 시 이 섹션으로 스크롤하기 위한 앵커. */
  id?: string;
  state: ShippingSectionState;
  address: ShippingAddress;
  /** "배송지 변경" — 저장된 배송지가 있을 때. PR1에서는 no-op. */
  onChangeAddress?: () => void;
  /** "신규 배송지 추가" — 배송지가 없을 때. PR1에서는 no-op. */
  onAddAddress?: () => void;
};

/* 흰 바탕 아웃라인 버튼(칩/추가 버튼 공용). Foundations에 secondary variant가 없어
   Button 컴포넌트로 못 올린다. 테두리 색은 호출부에서 붙인다(경고 상태에서 바뀜). */
const outlineButtonClasses = [
  "border-w-xs text-text-default",
  "flex items-center justify-center rounded-xs whitespace-nowrap",
  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
].join(" ");

/* FL_B_PY_ORD 배송지 섹션. 3상태:
   - saved   : 저장된 배송지 + "배송지 변경" 칩
   - empty   : 이름·연락처 + "신규 배송지 추가" 버튼
   - warning : empty + 미입력 경고 강조(결제 시도 후). interaction_spec의 스크롤·토글 동작은 후속 이슈. */
export function ShippingAddressSection({
  id,
  state,
  address,
  onChangeAddress,
  onAddAddress,
}: ShippingAddressSectionProps) {
  const isWarning = state === "warning";

  return (
    <section
      id={id}
      aria-labelledby="checkout-shipping-title"
      className={[
        "bg-layer-surface-default flex flex-col gap-3 px-5 py-4",
        isWarning ? "border-w-xs border-border-accent-warning" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <h2 id="checkout-shipping-title" className="text-title-s text-text-default flex-1">
            {address.recipientName}
          </h2>
          {state === "saved" && (
            <button
              type="button"
              onClick={onChangeAddress}
              className={`${outlineButtonClasses} border-border-default text-label-m h-7 px-3`}
            >
              배송지 변경
            </button>
          )}
        </div>

        <p className="text-body-m text-text-default">{address.phone}</p>

        {state === "saved" && (
          <p className="text-body-m text-text-default">
            {[address.baseAddress, address.detailAddress].filter(Boolean).join(" ")}
          </p>
        )}
      </div>

      {state !== "saved" && (
        <div className="flex flex-col gap-1">
          {isWarning && (
            <p role="alert" className="text-caption-s text-text-warning">
              * 배송지를 입력해주세요
            </p>
          )}
          <button
            type="button"
            onClick={onAddAddress}
            className={`${outlineButtonClasses} h-10 w-full gap-2 px-4 ${
              isWarning ? "border-border-accent-warning" : "border-border-default"
            }`}
          >
            <Icon name="plus" className="size-3.5" />
            <span className="text-body-m font-medium">신규 배송지 추가</span>
          </button>
        </div>
      )}
    </section>
  );
}
