"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getTerms } from "@/features/auth/api/auth-api";
import { useAuthFlow } from "@/features/auth/model/auth-flow-context";
import { BottomSheet } from "@/shared/components/ui/bottom-sheet";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { QueryErrorState } from "@/shared/components/ui/query-error-state";

import { AuthButton } from "./auth-form-controls";
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
  const { selectedTermCodes, setSelectedTermCodes } = useAuthFlow();
  const [checkedCodes, setCheckedCodes] = useState<string[]>(
    initialCheckedIds.length > 0 ? initialCheckedIds : selectedTermCodes,
  );
  const [detailCode, setDetailCode] = useState<string | undefined>(initialDetailId);

  /* 시트는 SignupFlow에 항상 마운트돼 있어(open만 토글) resetFlow()가 selectedTermCodes를
     비워도 이 로컬 state는 안 비워진다. 다시 열릴 때마다 최신 selectedTermCodes로 맞춘다. */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setCheckedCodes(initialCheckedIds.length > 0 ? initialCheckedIds : selectedTermCodes);
  }
  const termsQuery = useQuery({
    enabled: open,
    queryFn: ({ signal }) => getTerms({ signal }),
    queryKey: ["auth", "terms"],
    staleTime: 5 * 60 * 1_000,
  });
  const terms = termsQuery.data ?? [];

  const allChecked = terms.length > 0 && terms.every((term) => checkedCodes.includes(term.code));
  const requiredChecked =
    terms.length > 0 &&
    terms.filter((term) => term.required).every((term) => checkedCodes.includes(term.code));
  const detailTerm = terms.find((term) => term.code === detailCode);

  /* 전문을 보다 ESC나 backdrop으로 닫으면 detailCode가 남아 다시 열 때 전문이 뜬다. */
  function closeSheet() {
    setDetailCode(undefined);
    onClose();
  }

  function toggleAll(checked: boolean) {
    setCheckedCodes(checked ? terms.map((term) => term.code) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setCheckedCodes((previous) =>
      checked ? [...previous, id] : previous.filter((value) => value !== id),
    );
  }

  if (detailTerm) {
    return (
      <BottomSheet aria-label={detailTerm.title} onClose={closeSheet} open={open}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconButton label="약관 목록으로" onClick={() => setDetailCode(undefined)}>
              <Image alt="" height={12} src="/icons/arrow_left.svg" width={12} />
            </IconButton>
            <h2 className="text-title-s text-text-default">{detailTerm.title}</h2>
          </div>
          <IconButton label="약관 목록으로 닫기" onClick={() => setDetailCode(undefined)}>
            <Image alt="" height={13} src="/icons/close_small.svg" width={13} />
          </IconButton>
        </div>
        <p className="text-body-s text-text-default mt-3 whitespace-pre-line">
          {detailTerm.content}
        </p>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet aria-label="약관 동의" onClose={closeSheet} open={open}>
      <div className="flex items-center justify-between">
        <Checkbox
          checked={allChecked}
          className="[&>span:last-child]:text-body-emphasis"
          disabled={termsQuery.isPending || termsQuery.isError}
          indeterminate={checkedCodes.length > 0 && !allChecked}
          onChange={(event) => toggleAll(event.target.checked)}
          shape="circle"
        >
          펀딧 이용 약관 동의 (전체)
        </Checkbox>
        <IconButton label="약관 동의 닫기" onClick={closeSheet}>
          <Image alt="" height={13} src="/icons/close_small.svg" width={13} />
        </IconButton>
      </div>

      {termsQuery.isPending ? (
        <p className="text-body-s text-text-secondary py-8 text-center" role="status">
          약관을 불러오고 있어요.
        </p>
      ) : null}

      {termsQuery.isError ? (
        <QueryErrorState
          variant="section"
          error={termsQuery.error}
          description="약관을 불러오지 못했습니다."
          className="py-7"
          retryLabel="다시 불러오기"
          onRetry={() => void termsQuery.refetch()}
        />
      ) : null}

      <ul className="mt-2 flex flex-col gap-1">
        {terms.map((term) => (
          <li className="flex items-center justify-between" key={term.code}>
            <Checkbox
              checked={checkedCodes.includes(term.code)}
              className="[&>span:last-child]:text-body-s"
              onChange={(event) => toggleOne(term.code, event.target.checked)}
              shape="circle"
            >
              {term.title} ({term.required ? "필수" : "선택"})
            </Checkbox>
            <IconButton label={`${term.title} 전문 보기`} onClick={() => setDetailCode(term.code)}>
              <Image alt="" height={12} src="/icons/next.svg" width={12} />
            </IconButton>
          </li>
        ))}
      </ul>

      <AuthButton
        className="mt-6"
        disabled={!requiredChecked}
        onClick={() => {
          setSelectedTermCodes(checkedCodes);
          onAgree();
        }}
      >
        회원가입
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
