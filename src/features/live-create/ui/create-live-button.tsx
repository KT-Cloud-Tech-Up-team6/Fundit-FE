"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { LiveCreateApi } from "./live-create-api";

/**
 * LIVE 스튜디오의 [LIVE 생성하기](FL_S_LV_HOME → FL_S_LV_CREATE, #418).
 *
 * 누를 때만 생성 흐름을 마운트한다. 닫으면 통째로 내려 다음에 열 때 이전 입력이 남지 않는다.
 * 임시저장한 LIVE는 서버에 있어 [불러오기]로 이어 쓴다.
 */
export function CreateLiveButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="primaryLive"
        appearance="cta"
        className="w-[185px]"
        onClick={() => setOpen(true)}
        size="lg"
      >
        LIVE 생성하기
      </Button>
      {open && <LiveCreateApi onClose={() => setOpen(false)} />}
    </>
  );
}
