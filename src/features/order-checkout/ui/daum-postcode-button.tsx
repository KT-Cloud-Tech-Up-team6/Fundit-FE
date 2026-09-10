"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

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

/* 스크립트 로더는 앱 전체에서 한 번만. 모든 버튼 인스턴스가 같은 Promise 를 구독하므로
   시트를 로딩 중에 반복해서 열고 닫아도 완료되면 현재 마운트된 인스턴스가 ready 를 받는다.
   (next/script 의 onLoad 는 첫 로드 인스턴스에서만 불려 재마운트 시 누락되는 경로가 있었다.) */
let scriptPromise: Promise<void> | null = null;

function loadDaumPostcode(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  /* scriptPromise 가 null 인데 여기 왔다는 건 "아직 로드 안 됨" 또는 "직전 시도 실패"뿐이다.
     (성공했으면 window.daum 체크에서 이미 반환). 매번 새 <script> 를 만들고, 실패하면
     그 요소를 제거해 다음 시도(시트 재오픈)에서 실제로 재요청되게 한다. */
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        scriptPromise = null;
        reject(new Error("daum postcode script load failed"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return scriptPromise;
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
  const [ready, setReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.daum?.Postcode),
  );

  useEffect(() => {
    if (ready) return;
    let alive = true;
    loadDaumPostcode()
      .then(() => {
        if (alive) setReady(true);
      })
      .catch(() => {
        /* 로드 실패: 버튼은 비활성 유지. 다음 마운트에서 재시도한다. */
      });
    return () => {
      alive = false;
    };
  }, [ready]);

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
    <button type="button" onClick={open} disabled={!ready} className={className}>
      {children}
    </button>
  );
}
