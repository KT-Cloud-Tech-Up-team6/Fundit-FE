"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { textButtonNavigationClasses } from "@/shared/components/ui/text-button";

/* Figma text_button_underline(2000:44497)은 14px Regular·#7A7C8A·높이 40px이다. TextButton의
   underline variant는 13px Medium이라 맞지 않아, 같은 값을 가진 공용 클래스에 밑줄만 더한다. */
export function LogoutButton() {
  const { clearSession } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <button
      type="button"
      disabled={leaving}
      className={`${textButtonNavigationClasses} underline`}
      onClick={() => {
        setLeaving(true);
        /* 마이페이지는 회원 전용이라 세션을 비우면 회원 게이트가 로그인 화면으로 보낸다.
           로그아웃 직후 로그인을 요구하지 않도록 홈으로 옮긴다. 원본에 프로토타입 연결이
           없어 목적지는 확인된 지시가 아니라 이 화면의 접근 조건에서 정한 것이다.

           이동과 세션 정리를 같은 transition에 넣어 한 번에 반영한다. 나눠 실행하면 이 화면이
           비회원 상태로 한 번 그려지면서 게이트의 로그인 이동이 홈 이동을 덮어쓴다. */
        startTransition(() => {
          router.replace("/");
          clearSession();
        });
      }}
    >
      로그아웃 하기
    </button>
  );
}
