"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Icon } from "@/shared/components/ui/icon";
import { Input } from "@/shared/components/ui/input";
import { emptyShippingAddress, isShippingAddressComplete } from "../model/checkout-demo";
import type { ShippingAddress } from "../model/checkout-demo";
import { DaumPostcodeSearch } from "@/shared/components/ui/daum-postcode-button";
import styles from "./checkout-sheet.module.css";

type ShippingAddressSheetProps = {
  showDeliveryMemo?: boolean;
  showDefault?: boolean;
  open: boolean;
  onClose: () => void;
  initial?: ShippingAddress | null;
  onSave: (address: ShippingAddress) => void;
};

export function ShippingAddressSheet({
  open,
  onClose,
  initial,
  onSave,
  showDeliveryMemo = true,
  showDefault = true,
}: ShippingAddressSheetProps) {
  const [form, setForm] = useState<ShippingAddress>(initial ?? emptyShippingAddress());
  const [searching, setSearching] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  const detail = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initial ?? emptyShippingAddress());
      setSearching(false);
    }
  }
  const canSave = isShippingAddressComplete(form);
  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function clearButton(key: "recipientName" | "phone" | "detailAddress", label: string) {
    return form[key] ? (
      <button
        type="button"
        className="flex size-4 items-center justify-center"
        aria-label={`${label} 지우기`}
        onClick={() => update(key, "")}
      >
        <Icon name="close" className="size-4" />
      </button>
    ) : undefined;
  }
  function closeSearch() {
    setSearching(false);
    requestAnimationFrame(() => searchButton.current?.focus());
  }
  return (
    <BottomSheet
      open={open}
      onClose={searching ? closeSearch : onClose}
      title={searching ? "우편번호 찾기" : "배송지 입력"}
      className={`${styles.sheet} ${searching ? styles.searchSheet : ""}`}
      desktopModal
      footer={
        !searching && (
          <Button
            className="w-full disabled:bg-[#cdced4]!"
            appearance="cta"
            disabled={!canSave}
            onClick={() => {
              if (canSave) onSave(form);
            }}
          >
            저장
          </Button>
        )
      }
    >
      {searching ? (
        <div>
          <DaumPostcodeSearch
            onComplete={({ zipCode, baseAddress }) => {
              setForm((prev) => ({
                ...prev,
                zipCode,
                baseAddress,
                detailAddress: prev.baseAddress === baseAddress ? prev.detailAddress : "",
              }));
              setSearching(false);
              requestAnimationFrame(() => detail.current?.focus());
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="받는 사람">
            <Input
              shape="compact"
              aria-label="받는 사람"
              placeholder="받는 사람을 입력해주세요"
              value={form.recipientName}
              onChange={(event) => update("recipientName", event.target.value)}
              endAdornment={clearButton("recipientName", "받는 사람")}
            />
          </Field>
          <Field label="연락처">
            <Input
              shape="compact"
              aria-label="연락처"
              inputMode="tel"
              placeholder="연락처를 입력해주세요"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              endAdornment={clearButton("phone", "연락처")}
            />
          </Field>
          <Field label="배송지">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  shape="compact"
                  aria-label="우편번호"
                  placeholder="우편번호"
                  readOnly
                  disabled
                  value={form.zipCode}
                  className="min-w-0 flex-1"
                />
                <Button
                  ref={searchButton}
                  type="button"
                  onClick={() => setSearching(true)}
                  size="xl"
                  className="w-25 shrink-0 px-2 text-[14px]!"
                >
                  우편번호 찾기
                </Button>
              </div>
              <Input
                shape="compact"
                aria-label="주소"
                placeholder="주소"
                readOnly
                disabled
                value={form.baseAddress}
              />
              {form.zipCode && (
                <Input
                  shape="compact"
                  ref={detail}
                  aria-label="상세주소"
                  placeholder="상세주소를 입력해주세요"
                  value={form.detailAddress}
                  onChange={(event) => update("detailAddress", event.target.value)}
                  endAdornment={clearButton("detailAddress", "상세주소")}
                />
              )}
              {showDefault && (
                <div className="flex justify-end">
                  <Checkbox
                    checked={form.isDefault ?? false}
                    onChange={(event) => update("isDefault", event.target.checked)}
                  >
                    <span className="text-body-s">기본 배송지 설정</span>
                  </Checkbox>
                </div>
              )}
            </div>
          </Field>
          {showDeliveryMemo && (
            <Field label="배송 요청사항">
              <Input
                shape="compact"
                aria-label="배송 요청 사항"
                placeholder="요청사항을 입력해주세요 (선택)"
                value={form.deliveryMemo ?? ""}
                onChange={(event) => update("deliveryMemo", event.target.value)}
              />
            </Field>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-title-s">{label}</span>
      {children}
    </div>
  );
}
