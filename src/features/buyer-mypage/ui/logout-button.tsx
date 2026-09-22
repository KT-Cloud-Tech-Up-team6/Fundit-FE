"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { textButtonNavigationClasses } from "@/shared/components/ui/text-button";

/* Figma text_button_underline(2000:44497)은 14px Regular·#7A7C8A·높이 40px이다. TextButton의
   underline variant는 13px Medium이라 맞지 않아, 같은 값을 가진 공용 클래스에 밑줄만 더한다. */
export function LogoutButton() {
  const { logout } = useAuth();
  const [leaving, setLeaving] = useState(false);

  return (
    <button
      type="button"
      disabled={leaving}
      aria-busy={leaving}
      className={`${textButtonNavigationClasses} underline`}
      onClick={() => {
        setLeaving(true);
        logout();
      }}
    >
      로그아웃 하기
    </button>
  );
}
