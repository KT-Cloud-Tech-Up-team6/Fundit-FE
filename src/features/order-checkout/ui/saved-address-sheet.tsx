"use client";

import type { CheckoutAddress } from "@/entities/order/api/order-api";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Icon } from "@/shared/components/ui/icon";
import styles from "./checkout-sheet.module.css";

/* 실제 주문서의 "배송지 변경". Figma 주문서(FL_B_PY_ORD)에는 저장 배송지 목록 화면이 없어, 기존
   실제 주문서의 저장 배송지 선택을 카드·할부 시트처럼 누르면 바로 적용하고 닫는 목록으로 옮겼다.
   목록에 없는 주소는 "신규 배송지"로 배송지 입력 시트를 연다. */
export function SavedAddressSheet({
  open,
  addresses,
  selectedId,
  onSelect,
  onAdd,
  onClose,
}: {
  open: boolean;
  addresses: CheckoutAddress[];
  /** 지금 쓰는 저장 배송지 id. 직접 입력한 주소면 null이다. */
  selectedId: number | null;
  onSelect: (address: CheckoutAddress) => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="배송지 선택"
      className={styles.sheet}
      desktopModal
    >
      <div className="flex flex-col gap-3 pb-4">
        <div role="group" aria-label="저장된 배송지" className="flex flex-col gap-2">
          {addresses.map((address) => {
            const location = [address.addressLine1, address.addressLine2].filter(Boolean).join(" ");
            return (
              <button
                key={address.id}
                type="button"
                aria-pressed={address.id === selectedId}
                aria-label={[
                  address.recipientName,
                  address.isDefault ? "기본 배송지" : "",
                  location,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                onClick={() => onSelect(address)}
                className="border-w-xs border-border-default aria-pressed:border-border-primary flex flex-col gap-1 rounded-xs px-4 py-3 text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="text-title-s">{address.recipientName}</span>
                  {address.isDefault && (
                    <span className="text-body-s text-text-primary">기본 배송지</span>
                  )}
                </span>
                <span className="text-body-s">{address.phoneNumber}</span>
                <span className="text-body-s">{location}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="bg-layer-surface-disabled flex h-10 w-full items-center justify-center gap-1 rounded-xs"
        >
          <span className="text-body-s font-medium">신규 배송지</span>
          <Icon name="plus" className="size-3.5" />
        </button>
      </div>
    </BottomSheet>
  );
}
