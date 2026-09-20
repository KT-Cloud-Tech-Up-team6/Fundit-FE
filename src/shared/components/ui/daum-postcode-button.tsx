"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/* 다음(카카오) 우편번호 서비스. 키·서버 불필요, FE에서 직접 호출한다(BE 협의 완료).
   결제 배송지 입력(FL_B_PY_ADDR)과 회원가입 배송지 입력이 공유한다. */
const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
type PostcodeResult = { zonecode: string; roadAddress: string; jibunAddress: string };
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
        width?: string;
        height?: string;
      }) => {
        embed: (element: HTMLElement) => void;
        open: () => void;
      };
    };
  }
}
let scriptPromise: Promise<void> | null = null;
function loadDaumPostcode(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
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
        reject(new Error("postcode script load failed"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function DaumPostcodeSearch({
  onComplete,
}: {
  onComplete: (result: { zipCode: string; baseAddress: string }) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const complete = useRef(onComplete);
  useEffect(() => {
    complete.current = onComplete;
  }, [onComplete]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const element = container.current;
    loadDaumPostcode()
      .then(() => {
        if (!active || !element || !window.daum) return;
        new window.daum.Postcode({
          width: "100%",
          height: "100%",
          oncomplete: (data) =>
            complete.current({
              zipCode: data.zonecode,
              baseAddress: data.roadAddress || data.jibunAddress,
            }),
        }).embed(element);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
      element?.replaceChildren();
    };
  }, [attempt]);
  return (
    <div>
      {error && (
        <p role="alert" className="text-body-s mb-3">
          주소 검색을 불러오지 못했습니다.{" "}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setError(false);
              setAttempt(attempt + 1);
            }}
          >
            다시 시도
          </button>
        </p>
      )}
      <div
        ref={container}
        className="h-[min(640px,70dvh)] w-full"
        role="group"
        aria-label="카카오 우편번호 검색"
      />
    </div>
  );
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
