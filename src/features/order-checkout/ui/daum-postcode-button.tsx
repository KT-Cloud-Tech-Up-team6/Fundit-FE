"use client";

import Script from "next/script";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

/* 다음(카카오) 우편번호 서비스. 키·서버 불필요, FE에서 직접 호출한다(BE 협의 완료).
   FL_B_PY_ADDR interaction_spec의 "카카오 API 이동" 자리. */
const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

/** oncomplete 결과 중 이 화면에서 쓰는 필드만. (전체 스펙: 다음 우편번호 서비스 문서) */
type DaumPostcodeResult = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeResult) => void }) => {
        open: () => void;
      };
    };
  }
}

type DaumPostcodeButtonProps = {
  /** 검색 완료 시 우편번호와 기본 주소(도로명 우선, 없으면 지번)를 전달한다. */
  onComplete: (result: { zipCode: string; baseAddress: string }) => void;
  className?: string;
  children?: ReactNode;
};

export function DaumPostcodeButton({
  onComplete,
  className,
  children = "우편번호 찾기",
}: DaumPostcodeButtonProps) {
  /* 시트를 닫았다 다시 열면 이 컴포넌트가 재마운트되는데, 스크립트가 이미 로드돼 있으면
     onLoad 가 다시 안 불릴 수 있어 초기값에서 window.daum 존재 여부를 확인한다. */
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.daum?.Postcode),
  );

  const open = useCallback(() => {
    const Postcode = window.daum?.Postcode;
    if (!Postcode) return;
    new Postcode({
      oncomplete: (data) => {
        onComplete({
          zipCode: data.zonecode,
          baseAddress: data.roadAddress || data.jibunAddress,
        });
      },
    }).open();
  }, [onComplete]);

  return (
    <>
      <Script src={SCRIPT_SRC} strategy="afterInteractive" onLoad={() => setReady(true)} />
      <button type="button" onClick={open} disabled={!ready} className={className}>
        {children}
      </button>
    </>
  );
}
