import { Icon } from "@/shared/components/ui/icon";
import type { ShippingAddress, ShippingSectionState } from "../model/checkout-demo";

type ShippingAddressSectionProps = {
  /** 결제 시도 시 이 섹션으로 스크롤하기 위한 앵커. */
  id?: string;
  state: ShippingSectionState;
  address: ShippingAddress;
  /** "배송지 변경" — 저장된 배송지가 있을 때. */
  onChangeAddress?: () => void;
  /** "신규 배송지 추가" — 배송지가 없을 때. */
  onAddAddress?: () => void;
};

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
      className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
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
              className="text-text-secondary text-caption-s underline"
            >
              배송지 변경
            </button>
          )}
        </div>

        <p className="text-body-s text-text-default">{address.phone}</p>

        {state === "saved" && (
          <p className="text-body-s text-text-default">
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
            className="bg-layer-surface-disabled flex h-10 w-full items-center justify-center gap-1 rounded-xs"
          >
            <span className="text-body-s font-medium">신규 배송지</span>
            <Icon name="plus" className="size-3.5" />
          </button>
        </div>
      )}
    </section>
  );
}
