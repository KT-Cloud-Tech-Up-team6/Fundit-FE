"use client";

import { useEffect, useRef, useState } from "react";

const SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
type PostcodeResult = { zonecode: string; roadAddress: string; jibunAddress: string };
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeResult) => void;
        width: string;
        height: string;
      }) => {
        embed: (element: HTMLElement) => void;
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
