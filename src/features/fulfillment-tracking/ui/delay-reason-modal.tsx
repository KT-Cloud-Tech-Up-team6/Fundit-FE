"use client";

import { useId } from "react";
import { delayReasons } from "../model/fulfillment-demo";
import { Button, secondaryButtonClasses } from "@/shared/components/ui/button";
import { Modal } from "@/shared/components/ui/modal";
import { Select } from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";

type DelayReasonModalProps = {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSkip: () => void;
  onSave: (input: { reason: string; detail: string; expectedDate: string }) => void;
};

/**
 * 지연 사유 등록 모달(Figma 488:8188). 포커스 트랩·ESC는 Modal(dialog-base)이 갖는다.
 *
 * ponytail: 입력값은 폼이 갖게 두고 저장할 때 FormData로 한 번에 읽는다. open이 바뀌면
 * `key`로 폼을 새로 마운트해 이전 입력이 남지 않는다 — 초기화용 상태·effect가 필요 없다.
 */
export function DelayReasonModal({ open, onClose, onBack, onSkip, onSave }: DelayReasonModalProps) {
  const fieldId = useId();

  return (
    <Modal onClose={onClose} open={open} title="지연 사유 등록">
      <form
        className="flex flex-col gap-4 pt-2"
        key={String(open)}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          onSave({
            reason: String(data.get("reason") ?? ""),
            detail: String(data.get("detail") ?? ""),
            expectedDate: String(data.get("expectedDate") ?? ""),
          });
        }}
      >
        <div className="text-body-s text-text-secondary">
          <p>일정이 변경 되었거나 지연이 예상되는 경우 사유를 등록해주세요</p>
          {/* ponytail: 알림 발송 API가 없어(docs/OPEN_DECISIONS.md P1) 문구도 목업이다. 계약이 생기면 되돌린다. */}
          <p>구매자 알림 발송은 현재 목업으로 동작해요</p>
        </div>

        <div className="flex items-center gap-4">
          <label
            className="text-body-strong text-text-title shrink-0"
            htmlFor={`${fieldId}-reason`}
          >
            지연 사유
          </label>
          <Select className="w-64!" defaultValue="" id={`${fieldId}-reason`} name="reason">
            <option value="">지연 사유를 선택하세요</option>
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
            className="min-h-[200px]"
            id={`${fieldId}-detail`}
            name="detail"
            placeholder="사유를 상세하게 작성해주세요"
          />
        </div>

        <div className="flex flex-col gap-2">
          {/* Figma는 빈 날짜 입력에도 "변경된 예상 완료일"이 보인다. 네이티브 입력은 빈 값일 때
              "연도. 월. 일."만 띄우므로 라벨을 숨기지 않고 위에 둔다. */}
          <label className="text-body-strong text-text-title" htmlFor={`${fieldId}-date`}>
            변경된 예상 완료일
          </label>
          {/* 네이티브 <input type="date">. 달력 UI는 브라우저가 갖고 있어 라이브러리를 두지 않는다. */}
          <input
            className="border-w-xs border-border-default bg-layer-surface-default text-body-emphasis text-text-default focus-visible:outline-border-primary h-11 w-fit self-start rounded-xs px-4 focus-visible:outline-2"
            id={`${fieldId}-date`}
            name="expectedDate"
            type="date"
          />
        </div>

        <div className="flex flex-col gap-2 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <button className={`${secondaryButtonClasses} h-11 px-4`} onClick={onBack} type="button">
            이전으로
          </button>
          <div className="flex flex-col gap-2 lg:flex-row">
            <button
              className={`${secondaryButtonClasses} h-11 px-4`}
              onClick={onSkip}
              type="button"
            >
              건너뛰기
            </button>
            <Button className="px-6" type="submit">
              저장
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
