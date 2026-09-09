"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { emptyShippingAddress, isShippingAddressComplete } from "../model/checkout-demo";
import type { ShippingAddress } from "../model/checkout-demo";
import { DaumPostcodeButton } from "./daum-postcode-button";

type ShippingAddressSheetProps = {
  open: boolean;
  onClose: () => void;
  /** 기존 배송지가 있으면 채운 상태로 연다. */
  initial?: ShippingAddress | null;
  onSave: (address: ShippingAddress) => void;
};

/* 배송지 입력 바텀시트 (FL_B_PY_ADDR). 우편번호·주소는 "우편번호 찾기"(다음 우편번호 서비스)로만
   채우고, 나머지는 사용자 입력. 배송 요청 사항 외 전부 필수(interaction_spec). */
export function ShippingAddressSheet({
  open,
  onClose,
  initial,
  onSave,
}: ShippingAddressSheetProps) {
  const [form, setForm] = useState<ShippingAddress>(initial ?? emptyShippingAddress());

  /* 닫았다 다시 열면 이전 입력이 남지 않도록 열릴 때 initial 로 리셋한다. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setForm(initial ?? emptyShippingAddress());
  }

  const canSave = isShippingAddressComplete(form);

  function update<K extends keyof ShippingAddress>(key: K, value: ShippingAddress[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    if (canSave) onSave(form);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      aria-labelledby="shipping-address-sheet-title"
      footer={
        <Button className="w-full" appearance="cta" disabled={!canSave} onClick={submit}>
          저장
        </Button>
      }
    >
      <h2
        id="shipping-address-sheet-title"
        className="text-title-s text-text-default mb-6 text-center"
      >
        배송지 입력
      </h2>

      <div className="flex flex-col gap-6">
        <Field label="받는 사람">
          <Input
            aria-label="받는 사람"
            placeholder="받는 사람을 입력해주세요"
            value={form.recipientName}
            onChange={(event) => update("recipientName", event.target.value)}
          />
        </Field>

        <Field label="연락처">
          {/* Figma placeholder가 "받는 사람을 입력해주세요"로 되어 있으나 연락처 필드라 오기로 보고 맞춘다. */}
          <Input
            aria-label="연락처"
            inputMode="tel"
            placeholder="연락처를 입력해주세요"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
          />
        </Field>

        <Field label="배송지">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                aria-label="우편번호"
                placeholder="우편번호"
                readOnly
                value={form.zipCode}
                className="flex-1"
              />
              <DaumPostcodeButton
                className="bg-layer-surface-primary text-text-inverse text-body-s enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary flex h-13 shrink-0 items-center justify-center rounded-sm px-4 font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
                onComplete={({ zipCode, baseAddress }) =>
                  setForm((prev) => ({ ...prev, zipCode, baseAddress }))
                }
              />
            </div>
            <Input aria-label="주소" placeholder="주소" readOnly value={form.baseAddress} />
            <Input
              aria-label="상세주소"
              placeholder="상세주소를 입력해주세요"
              value={form.detailAddress}
              onChange={(event) => update("detailAddress", event.target.value)}
            />
            <Input
              aria-label="배송 요청 사항"
              placeholder="배송 요청 사항을 입력해주세요"
              value={form.deliveryMemo ?? ""}
              onChange={(event) => update("deliveryMemo", event.target.value)}
            />
          </div>
        </Field>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Figma 수정: Title/Medium_18 → Title/Semibold_18 (= text-title-s 기본 굵기) */}
      <span className="text-title-s text-text-default">{label}</span>
      {children}
    </div>
  );
}
