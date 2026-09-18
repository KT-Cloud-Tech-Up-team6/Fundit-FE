"use client";

import { useId, useState } from "react";
import { delayReasons } from "../model/fulfillment-demo";
import { DateField } from "@/shared/components/ui/date-field";
import { Modal } from "@/shared/components/ui/modal";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type DelayReasonModalProps = {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  onSave: (input: { reason: string; detail: string; expectedDate: string }) => void;
};

/**
 * Figma CTA 버튼(1319:41778;558:2974) — 14px Medium. shared Button의 cta 사이즈는
 * 16px SemiBold만 지원해 이 크기 조합만 직접 그린다.
 */
const skipButtonClasses =
  "bg-layer-surface-disabled text-text-default enabled:hover:bg-layer-surface-disabled-hover focus-visible:outline-border-primary flex h-10 w-[92px] shrink-0 items-center justify-center rounded-xs text-body-s font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";
const saveButtonClasses =
  "bg-layer-surface-primary text-text-inverse enabled:hover:bg-layer-surface-primary-hover focus-visible:outline-border-primary flex h-10 w-36 shrink-0 items-center justify-center rounded-xs text-body-s font-medium whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * 지연 사유 등록 모달(Figma modal_web, 1319:41778). 포커스 트랩·ESC·제목·닫기 버튼은
 * Modal(dialog-base)이 갖는다. Figma에는 "이전으로"가 없어 건너뛰기/등록만 남긴다.
 *
 * ponytail: 입력값은 폼이 갖게 두고 저장할 때 FormData로 한 번에 읽는다. open이 바뀌면
 * `key`로 폼을 새로 마운트해 이전 입력이 남지 않는다 — 초기화용 상태·effect가 필요 없다.
 * 날짜만 `DateField`가 폼 밖에서 상태를 들고 있어 별도로 초기화한다.
 */
export function DelayReasonModal({ open, onClose, onSkip, onSave }: DelayReasonModalProps) {
  const fieldId = useId();
  const [expectedDate, setExpectedDate] = useState("");

  return (
    <Modal onClose={onClose} open={open} title="지연 사유 등록">
      <form
        className="flex flex-col gap-6 pt-6"
        key={String(open)}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            reason: String(data.get("reason") ?? ""),
            detail: String(data.get("detail") ?? ""),
            expectedDate,
          });
          setExpectedDate("");
        }}
      >
        <div className="flex flex-col gap-3">
          <div className="text-body-s text-text-default">
            <p>일정이 변경 되었거나 지연이 예상되는 경우 사유를 등록해주세요</p>
            {/* ponytail: 알림 발송 API가 없어(docs/OPEN_DECISIONS.md P1) 문구도 목업이다. 계약이 생기면 되돌린다. */}
            <p>구매자에게 알림이 발송됩니다(현재 목업으로 동작해요)</p>
          </div>

          <div className="flex items-center gap-3">
            <label
              className="text-body-strong text-text-default w-[60px] shrink-0"
              htmlFor={`${fieldId}-reason`}
            >
              지연 사유
            </label>
            <Select
              className="w-46!"
              defaultValue=""
              id={`${fieldId}-reason`}
              name="reason"
              shape="compact"
              size="sm"
            >
              <option value="">지연사유를 입력하세요</option>
              {delayReasons.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="sr-only" htmlFor={`${fieldId}-detail`}>
              상세 사유
            </label>
            <Textarea
              className="min-h-[352px]"
              id={`${fieldId}-detail`}
              name="detail"
              placeholder="사유를 상세하게 작성해주세요"
            />
          </div>

          <DateField
            aria-label="지연 완료 예상일"
            onChange={setExpectedDate}
            placeholder="지연 완료 예상일"
            value={expectedDate}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button className={skipButtonClasses} onClick={onSkip} type="button">
            건너뛰기
          </button>
          <button className={saveButtonClasses} type="submit">
            등록
          </button>
        </div>
      </form>
    </Modal>
  );
}
