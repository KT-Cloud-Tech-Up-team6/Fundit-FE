"use client";

import { useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Dropdown } from "@/shared/components/ui/dropdown";
import { Input } from "@/shared/components/ui/input";
import { Modal } from "@/shared/components/ui/modal";
import { convertDiscount, type RewardDraft } from "../model/basic-info-demo";

type RewardFormModalProps = {
  draft: RewardDraft | null;
  editing: boolean;
  error: string;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (patch: Partial<RewardDraft>) => void;
  busy?: boolean;
  optionsReadOnly?: boolean;
  onFile?: (file?: File) => void;
};

export function RewardFormModal({
  draft,
  editing,
  error,
  onClose,
  onSave,
  onUpdate,
  busy = false,
  optionsReadOnly = false,
  onFile,
}: RewardFormModalProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  if (!draft) return null;
  const discountUnitOptions = [
    { value: "won", label: "원" },
    { value: "percent", label: "퍼센트" },
  ] as const;

  return (
    <Modal
      open={Boolean(draft)}
      onClose={onClose}
      size="m"
      title={editing ? "리워드 수정" : "리워드 추가"}
    >
      {/* Figma modal_web content: 필드·옵션·CTA 묶음 사이 간격은 모두 24px이다. */}
      <fieldset disabled={busy} className="mt-6 space-y-6">
        <label className="block space-y-2">
          <span className="text-title-s">리워드 명</span>
          <Input
            size="md"
            shape="compact"
            className="[&_input]:text-body-s"
            value={draft.name}
            onChange={(event) => onUpdate({ name: event.target.value })}
            placeholder="리워드 명을 입력해주세요"
          />
        </label>
        <div className="space-y-2">
          <p className="text-title-s">리워드 이미지</p>
          <div className="flex gap-2">
            <Input
              size="md"
              shape="compact"
              className="bg-layer-surface-disabled [&_input]:text-body-s border-transparent"
              aria-label="리워드 이미지"
              readOnly
              value={draft.imageName}
              placeholder="이미지를 첨부해주세요 (선택)"
            />
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => {
                onUpdate({ imageName: event.target.files?.[0]?.name ?? "" });
                onFile?.(event.target.files?.[0]);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="xl"
              className="text-body-m! w-[88px] shrink-0 font-semibold"
              onClick={() => fileInput.current?.click()}
            >
              찾아보기
            </Button>
          </div>
        </div>
        <label className="block space-y-2">
          <span className="text-title-s">리워드 설명</span>
          <Input
            size="md"
            shape="compact"
            className="[&_input]:text-body-s"
            value={draft.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder="리워드 설명을 입력해주세요"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-title-s block">가격</span>
            <Input
              size="md"
              shape="compact"
              className="[&_input]:text-body-s"
              inputMode="numeric"
              value={draft.price}
              onChange={(event) =>
                /^\d*$/.test(event.target.value) && onUpdate({ price: event.target.value })
              }
              placeholder="리워드 가격을 입력해주세요"
            />
          </label>
          <div className="space-y-2">
            <div className="flex h-[26px] items-center justify-between">
              <label className="text-title-s" htmlFor="reward-quantity">
                수량
              </label>
              <Checkbox
                shape="square"
                checked={draft.limited}
                onChange={(event) =>
                  onUpdate({
                    limited: event.target.checked,
                    quantity: event.target.checked ? draft.quantity : "",
                  })
                }
                className="[&>span:first-of-type]:m-1"
              >
                수량 제한
              </Checkbox>
            </div>
            <Input
              id="reward-quantity"
              size="md"
              shape="compact"
              className="[&_input]:text-body-s"
              inputMode="numeric"
              disabled={!draft.limited}
              value={draft.quantity}
              onChange={(event) =>
                /^\d*$/.test(event.target.value) && onUpdate({ quantity: event.target.value })
              }
              placeholder={draft.limited ? "리워드 수량을 입력해주세요" : "제한 없음"}
            />
          </div>
        </div>
        <div className="space-y-0">
          <Checkbox
            shape="square"
            checked={draft.discount}
            onChange={(event) => onUpdate({ discount: event.target.checked })}
            className="min-h-11 w-full items-start gap-2 py-2 [&>span:first-of-type]:m-1 [&>span:first-of-type]:size-5"
          >
            <span className="text-body-emphasis">리워드 할인 설정</span>
            <span className="text-caption-s ml-2">
              선착순 후원자에게 별도 할인 가격 · 한정 수량으로 제공해요
            </span>
          </Checkbox>
          {draft.discount && (
            <div className="flex gap-2 pl-6">
              <Input
                size="md"
                shape="compact"
                className="[&_input]:text-body-s"
                aria-label="할인 값"
                inputMode="numeric"
                value={draft.discountValue}
                onChange={(event) =>
                  /^\d*$/.test(event.target.value) &&
                  onUpdate({ discountValue: event.target.value })
                }
                placeholder="할인 값을 입력해주세요"
              />
              <Dropdown
                size="xs"
                className="w-24 self-center"
                aria-label="할인 단위"
                options={discountUnitOptions}
                value={draft.discountUnit}
                onValueChange={(value) =>
                  onUpdate({
                    discountUnit: value as RewardDraft["discountUnit"],
                    discountValue: convertDiscount(
                      draft.discountValue,
                      draft.discountUnit,
                      value as RewardDraft["discountUnit"],
                      draft.price,
                    ),
                  })
                }
              />
            </div>
          )}
          <Checkbox
            shape="square"
            checked={draft.options}
            disabled={optionsReadOnly}
            onChange={(event) => onUpdate({ options: event.target.checked })}
            className="min-h-11 w-full items-start gap-2 py-2 [&>span:first-of-type]:m-1 [&>span:first-of-type]:size-5"
          >
            <span className="text-body-emphasis">옵션 설정</span>
            <span className="text-caption-s ml-2">
              색상·사이즈처럼 후원자가 고를 수 있는 옵션이 있다면 켜주세요
            </span>
          </Checkbox>
          {optionsReadOnly && (
            <p className="text-caption-s">
              등록된 옵션은 유지됩니다. 옵션 편집은 연결 준비 중입니다.
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-caption-s text-text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="button" appearance="cta" size="lg" className="w-[172px]" onClick={onSave}>
            등록
          </Button>
        </div>
      </fieldset>
    </Modal>
  );
}
