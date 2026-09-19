"use client";

import Image from "next/image";
import { useState } from "react";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Icon } from "@/shared/components/ui/icon";
import type { CheckoutForm } from "@/entities/order/model/order-session";
import { installmentsForCard, paymentCards } from "../model/payment-options";
import styles from "./checkout-sheet.module.css";

export function PaymentMethodSection({
  form,
  onChange,
}: {
  form: CheckoutForm;
  onChange: (change: Partial<CheckoutForm>) => void;
}) {
  const [sheet, setSheet] = useState<"card" | "installment" | null>(null);
  const options = sheet === "card" ? paymentCards : installmentsForCard(form.card);
  const selected = sheet === "card" ? form.card : form.installment;
  return (
    <section
      id="checkout-method"
      aria-labelledby="checkout-method-title"
      className="bg-layer-surface-default flex flex-col gap-3 px-5 py-4"
    >
      <h2 id="checkout-method-title" className="text-title-s">
        결제 수단
      </h2>
      <fieldset className="space-y-2">
        <legend className="sr-only">결제 수단 선택</legend>
        {(
          [
            ["credit_card", "신용 / 체크카드"],
            ["toss_pay", "toss pay"],
          ] as const
        ).map(([value, label]) => (
          <div
            key={value}
            className={`border-border-default rounded-xs border px-4 ${value === "credit_card" && form.method === value ? "flex flex-col gap-2 py-2" : "h-[46px] py-3"}`}
          >
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="checkout-payment-method"
                checked={form.method === value}
                onChange={() => onChange({ method: value })}
                className="peer sr-only"
              />
              <span
                aria-hidden
                className="peer-focus-visible:outline-border-primary size-5 shrink-0 peer-focus-visible:outline-2"
              >
                <Image
                  src={`/images/reward-selection/${form.method === value ? "checked" : "unchecked"}.svg`}
                  alt=""
                  width={20}
                  height={20}
                />
              </span>
              <span className="text-body-m font-medium">{label}</span>
            </label>
            {value === "credit_card" && form.method === value && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSheet("card")}
                  className={`text-body-s flex h-9 w-full items-center justify-between rounded-xs border border-[#ededed] px-3 ${form.card ? "text-text-default" : "text-text-secondary"}`}
                  aria-label="카드 선택"
                >
                  {form.card || "카드를 선택해주세요"}
                  <Icon name="arrowDown" className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSheet("installment")}
                  disabled={!form.card}
                  className={`text-body-s flex h-9 w-full items-center justify-between rounded-xs border border-[#ededed] px-3 ${form.card ? "text-text-default" : "text-text-secondary"}`}
                  aria-label="할부 선택"
                >
                  {form.installment}
                  <Icon name="arrowDown" className="size-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </fieldset>
      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet === "card" ? "카드선택" : "할부 선택"}
        className={styles.sheet}
        desktopModal
      >
        <div
          className="pb-10"
          role="group"
          aria-label={sheet === "card" ? "카드 목록" : "할부 목록"}
        >
          {options.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={selected === option}
              onClick={() => {
                onChange(
                  sheet === "card"
                    ? { card: option, installment: "일시불" }
                    : { installment: option },
                );
                setSheet(null);
              }}
              className="text-body-m flex min-h-10 w-full items-center gap-3 py-2 text-left aria-pressed:font-semibold"
            >
              {option}
              {selected === option && (
                <span aria-hidden className="mb-1 h-3 w-1.5 rotate-45 border-r-2 border-b-2" />
              )}
            </button>
          ))}
        </div>
      </BottomSheet>
    </section>
  );
}
