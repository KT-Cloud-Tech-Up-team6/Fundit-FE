"use client";

import { useState } from "react";

import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Checkbox } from "@/shared/components/ui/checkbox";

import { AuthButton } from "./auth-form-controls";
import { requiredTermIds, signupTerms } from "./signup-terms";

type SignupTermsSheetProps = {
  initialCheckedIds?: string[];
  initialDetailId?: string;
  onAgree: () => void;
  onClose: () => void;
  open: boolean;
};

/* 약관 전문은 스택된 두 번째 시트가 아니라 같은 시트의 내부 뷰다.
   전문 화면의 뒤로(<)와 닫기(x)가 모두 목록으로 돌아가고, 시트를 닫는 경로는 목록의 x뿐이다. */
export function SignupTermsSheet({
  initialCheckedIds = [],
  initialDetailId,
  onAgree,
  onClose,
  open,
}: SignupTermsSheetProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>(initialCheckedIds);
  const [detailId, setDetailId] = useState<string | undefined>(initialDetailId);

  const allChecked = checkedIds.length === signupTerms.length;
  const requiredChecked = requiredTermIds.every((id) => checkedIds.includes(id));
  const detailTerm = signupTerms.find((term) => term.id === detailId);

  /* 전문을 보다 ESC나 backdrop으로 닫으면 detailId가 남아 다시 열 때 전문이 뜬다. */
  function closeSheet() {
    setDetailId(undefined);
    onClose();
  }

  function toggleAll(checked: boolean) {
    setCheckedIds(checked ? signupTerms.map((term) => term.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setCheckedIds((previous) =>
      checked ? [...previous, id] : previous.filter((value) => value !== id),
    );
  }

  if (detailTerm) {
    return (
      <BottomSheet aria-label={detailTerm.label} onClose={closeSheet} open={open}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton label="약관 목록으로" onClick={() => setDetailId(undefined)}>
              <Chevron direction="left" />
            </IconButton>
            <h2 className="text-body-emphasis text-text-default">{detailTerm.label}</h2>
          </div>
          <IconButton label="약관 목록으로 닫기" onClick={() => setDetailId(undefined)}>
            <CloseMark />
          </IconButton>
        </div>
        <p className="text-body-s text-text-default mt-6 whitespace-pre-line">{detailTerm.body}</p>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet aria-label="약관 동의" onClose={closeSheet} open={open}>
      <div className="flex items-center justify-between">
        <Checkbox
          checked={allChecked}
          className="[&>span:last-child]:text-body-emphasis"
          indeterminate={checkedIds.length > 0 && !allChecked}
          onChange={(event) => toggleAll(event.target.checked)}
        >
          펀딧 이용 약관 동의 (전체)
        </Checkbox>
        <IconButton label="약관 동의 닫기" onClick={closeSheet}>
          <CloseMark />
        </IconButton>
      </div>

      <ul className="mt-5 flex flex-col gap-1">
        {signupTerms.map((term) => (
          <li className="flex items-center justify-between" key={term.id}>
            <Checkbox
              checked={checkedIds.includes(term.id)}
              className="[&>span:last-child]:text-body-s"
              onChange={(event) => toggleOne(term.id, event.target.checked)}
            >
              {term.label}
            </Checkbox>
            <IconButton label={`${term.label} 전문 보기`} onClick={() => setDetailId(term.id)}>
              <Chevron direction="right" />
            </IconButton>
          </li>
        ))}
      </ul>

      <AuthButton className="mt-6" disabled={!requiredChecked} onClick={onAgree}>
        회원가입 하기
      </AuthButton>
    </BottomSheet>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="flex size-9 shrink-0 items-center justify-center"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

/* 아이콘은 회전한 사각형의 두 변으로 그려 asset을 두지 않는다. */
function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className={[
        "border-text-default size-2 border-t-[1.3px]",
        direction === "left" ? "-translate-x-0.5 -rotate-45 border-l-[1.3px]" : "",
        direction === "right" ? "translate-x-0.5 rotate-45 border-r-[1.3px]" : "",
      ].join(" ")}
    />
  );
}

function CloseMark() {
  return (
    <span aria-hidden className="relative size-4">
      <span className="bg-text-default absolute top-1/2 left-0 h-[1.3px] w-4 rotate-45" />
      <span className="bg-text-default absolute top-1/2 left-0 h-[1.3px] w-4 -rotate-45" />
    </span>
  );
}
