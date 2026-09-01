"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthButton } from "./auth-form-controls";
import { AuthBottomAction, AuthScreen, AuthTitle } from "./auth-screen";

/* 임시 목록이다. 확정 카테고리를 받으면 데이터만 교체한다. */
const categories = [
  "테크·가전",
  "패션·잡화",
  "뷰티",
  "푸드",
  "홈·리빙",
  "디자인문구",
  "스포츠·모빌리티",
  "취미·DIY",
  "게임",
  "반려동물",
  "여행·레저",
  "공연·전시",
];

type SignupDoneFlowProps = {
  initialSelected?: string[];
  initialToastVisible?: boolean;
};

export function SignupDoneFlow({
  initialSelected = [],
  initialToastVisible = true,
}: SignupDoneFlowProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [toastVisible, setToastVisible] = useState(initialToastVisible);

  function toggle(category: string) {
    setSelected((previous) =>
      previous.includes(category)
        ? previous.filter((value) => value !== category)
        : [...previous, category],
    );
  }

  return (
    <AuthScreen withHeader={false}>
      {toastVisible ? (
        <div
          className="bg-layer-surface-primary text-text-inverse text-body-s mt-4 flex items-center justify-between gap-3 rounded-sm px-4 py-3"
          role="status"
        >
          회원가입이 완료되었습니다
          <button
            aria-label="알림 닫기"
            className="text-text-inverse shrink-0"
            onClick={() => setToastVisible(false)}
            type="button"
          >
            확인
          </button>
        </div>
      ) : null}

      <AuthTitle>{"가입이 완료되었어요\n관심 카테고리를 골라주세요"}</AuthTitle>

      <ul className="mt-10 grid grid-cols-3 gap-3 pb-24">
        {categories.map((category) => {
          const isSelected = selected.includes(category);

          return (
            <li key={category}>
              <button
                aria-pressed={isSelected}
                className={[
                  "text-caption-s flex aspect-square w-full flex-col items-center justify-end gap-2 rounded-sm p-2",
                  "focus-visible:outline-border-primary focus-visible:outline-2 focus-visible:outline-offset-2",
                  isSelected
                    ? "bg-layer-surface-primary text-text-inverse"
                    : "bg-layer-surface-disabled text-text-default",
                ].join(" ")}
                onClick={() => toggle(category)}
                type="button"
              >
                {category}
              </button>
            </li>
          );
        })}
      </ul>

      <AuthBottomAction>
        <AuthButton onClick={() => router.push("/")}>펀딩 시작하기</AuthButton>
      </AuthBottomAction>
    </AuthScreen>
  );
}
