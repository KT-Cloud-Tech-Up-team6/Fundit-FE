"use client";

import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";

/** 바깥에서 재생 위치를 옮기기 위한 손잡이. 다시보기 구간 탐색이 쓴다. */
export type LivePlayerHandle = { seek: (sec: number) => void };

export function LivePlayer({
  src,
  title,
  handleRef,
  onProgress,
}: {
  src: string;
  title: string;
  handleRef?: RefObject<LivePlayerHandle | null>;
  /* 재생 위치·길이를 알 방법이 <video> 안에만 있어 바깥으로 올려준다. 길이를 아직 모르면 0이다. */
  onProgress?: (currentSec: number, durationSec: number) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useImperativeHandle(handleRef, () => ({
    seek(sec) {
      const element = video.current;
      if (!element) return;
      element.currentTime = sec;
      void element.play().catch(() => {});
    },
  }));
  function reportProgress() {
    const element = video.current;
    if (!element) return;
    onProgress?.(element.currentTime, Number.isFinite(element.duration) ? element.duration : 0);
  }
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"loading" | "playing" | "ended">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const element = video.current;
    if (!element || !src) return;
    let hls: { destroy(): void } | undefined;
    let cancelled = false;
    setError("");
    setStatus("loading");
    const isHls = /\.m3u8(?:$|[?#])/i.test(src);
    if (!isHls || element.canPlayType("application/vnd.apple.mpegurl")) element.src = src;
    else {
      void import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (!Hls.isSupported()) {
            setError("이 브라우저는 이 라이브 영상을 재생할 수 없습니다.");
            return;
          }
          const instance = new Hls({ enableWorker: true });
          hls = instance;
          instance.loadSource(src);
          instance.attachMedia(element);
          instance.on(Hls.Events.ERROR, (_, data) => {
            if (!cancelled && data.fatal) setError("영상 재생에 실패했습니다. 다시 시도해 주세요.");
          });
        })
        .catch(() => {
          if (!cancelled) setError("영상 재생기를 불러오지 못했습니다.");
        });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
      element.removeAttribute("src");
      element.load();
    };
  }, [src, attempt]);

  return (
    <div className="bg-layer-surface-disabled relative aspect-video overflow-hidden rounded-sm">
      <video
        ref={video}
        className="h-full w-full"
        controls
        playsInline
        aria-label={`${title} 영상`}
        onError={() => setError("영상 재생에 실패했습니다. 다시 시도해 주세요.")}
        onLoadedMetadata={reportProgress}
        onTimeUpdate={reportProgress}
        onSeeked={reportProgress}
        onCanPlay={() => setStatus("playing")}
        onPlaying={() => setStatus("playing")}
        onEnded={() => setStatus("ended")}
      />
      {!error && status === "loading" && (
        <p className="text-text-static-white pointer-events-none absolute inset-0 grid place-items-center bg-[rgba(0,0,0,0.5)]">
          영상을 준비하는 중입니다.
        </p>
      )}
      {!error && status === "ended" && (
        <p className="text-text-static-white pointer-events-none absolute inset-0 grid place-items-center bg-[rgba(0,0,0,0.5)]">
          영상이 종료되었습니다.
        </p>
      )}
      {error && (
        <div
          role="alert"
          className="text-text-static-white absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(0,0,0,0.7)] p-4 text-center"
        >
          <p>{error}</p>
          <button
            type="button"
            className="bg-layer-surface-default text-text-default rounded px-3 py-2"
            onClick={() => setAttempt((value) => value + 1)}
          >
            영상 다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
