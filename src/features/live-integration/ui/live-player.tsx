"use client";

import type { MediaPlayer } from "amazon-ivs-player";
import { useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";

/** 바깥에서 재생 위치·재생 여부를 바꾸기 위한 손잡이. 다시보기 재생바와 구간 탐색이 쓴다. */
export type LivePlayerHandle = { seek: (sec: number) => void; togglePlay: () => void };

export function LivePlayer({
  src,
  title,
  handleRef,
  onProgress,
  controls = true,
  onPlayingChange,
  live = false,
}: {
  src: string;
  title: string;
  handleRef?: RefObject<LivePlayerHandle | null>;
  /* 재생 위치·길이를 알 방법이 <video> 안에만 있어 바깥으로 올려준다. 길이를 아직 모르면 0이다. */
  onProgress?: (currentSec: number, durationSec: number) => void;
  /** 브라우저 기본 컨트롤. 화면이 Figma 재생바를 직접 그리면 끈다. */
  controls?: boolean;
  onPlayingChange?: (playing: boolean) => void;
  /**
   * 방송 중(LIVE) IVS 영상. IVS 저지연 채널은 일반 hls.js로 재생되지 않아(IVS 플레이어 README "타사 플레이어는
   * IVS에서 동작하지 않는다") 공식 IVS 플레이어 SDK로 재생한다(#494). 다시보기·쇼츠는 지금 방식 그대로다.
   */
  live?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const ivsPlayer = useRef<MediaPlayer | null>(null);
  useImperativeHandle(handleRef, () => ({
    seek(sec) {
      const player = ivsPlayer.current;
      if (player) {
        player.seekTo(sec);
        player.play();
        return;
      }
      const element = video.current;
      if (!element) return;
      element.currentTime = sec;
      void element.play().catch(() => {});
    },
    togglePlay() {
      const player = ivsPlayer.current;
      if (player) {
        if (player.isPaused()) player.play();
        else player.pause();
        return;
      }
      const element = video.current;
      if (!element) return;
      if (element.paused) void element.play().catch(() => {});
      else element.pause();
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
    let syncIvs: ((event: Event) => void) | undefined;
    let cancelled = false;
    setError("");
    setStatus("loading");

    function playWithoutIvs(target: HTMLVideoElement) {
      const isHls = /\.m3u8(?:$|[?#])/i.test(src);
      if (!isHls || target.canPlayType("application/vnd.apple.mpegurl")) {
        target.src = src;
        return;
      }
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
          instance.attachMedia(target);
          instance.on(Hls.Events.ERROR, (_, data) => {
            if (!cancelled && data.fatal) setError("영상 재생에 실패했습니다. 다시 시도해 주세요.");
          });
        })
        .catch(() => {
          if (!cancelled) setError("영상 재생기를 불러오지 못했습니다.");
        });
    }

    if (!live) playWithoutIvs(element);
    else {
      /* SDK는 웹 워커·wasm을 주소로 받는다. 번들러가 두 파일을 내보내고 주소를 준다(wasm은 application/wasm). */
      void import("amazon-ivs-player")
        .then((ivs) => {
          if (cancelled) return;
          /* WebAssembly가 없는 브라우저는 SDK를 쓸 수 없어 지금 방식으로 재생을 시도한다. */
          if (!ivs.isPlayerSupported) {
            playWithoutIvs(element);
            return;
          }
          const player = ivs.create({
            wasmWorker: new URL(
              "amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.js",
              import.meta.url,
            ).href,
            wasmBinary: new URL(
              "amazon-ivs-player/dist/assets/amazon-ivs-wasmworker.min.wasm",
              import.meta.url,
            ).href,
          });
          ivsPlayer.current = player;
          player.attachHTMLVideoElement(element);
          player.addEventListener(ivs.PlayerEventType.ERROR, () => {
            if (!cancelled) setError("영상 재생에 실패했습니다. 다시 시도해 주세요.");
          });
          /* SDK는 영상 요소를 직접 재생·멈춤해도 따르지 않는다 — 요소만 재생하면 스트림을 받지 않고, 요소만 멈추면
             SDK가 다시 재생한다. 기본 컨트롤의 재생·일시정지가 동작하도록 SDK에 알린다. 멈춤은 SDK가 실제로 재생
             중일 때만 알린다 — SDK는 방송 중 멈추면 영상 연결을 끊어, 다시 재생을 누를 때 요소의 재생이 실패하며
             생기는 멈춤까지 알리면 방금 시작한 재생을 도로 멈춘다. */
          syncIvs = (event: Event) => {
            if (event.type === "play") {
              if (player.isPaused()) player.play();
            } else if (player.getState() === ivs.PlayerState.PLAYING) player.pause();
          };
          element.addEventListener("play", syncIvs);
          element.addEventListener("pause", syncIvs);
          player.load(src);
        })
        .catch(() => {
          if (!cancelled) setError("영상 재생기를 불러오지 못했습니다.");
        });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
      if (syncIvs) {
        element.removeEventListener("play", syncIvs);
        element.removeEventListener("pause", syncIvs);
      }
      ivsPlayer.current?.delete();
      ivsPlayer.current = null;
      element.removeAttribute("src");
      element.load();
    };
  }, [src, attempt, live]);

  return (
    <div className="bg-layer-surface-disabled relative aspect-video overflow-hidden rounded-sm">
      <video
        ref={video}
        className="h-full w-full"
        controls={controls}
        playsInline
        aria-label={`${title} 영상`}
        onError={() => setError("영상 재생에 실패했습니다. 다시 시도해 주세요.")}
        onLoadedMetadata={reportProgress}
        onTimeUpdate={reportProgress}
        onSeeked={reportProgress}
        onCanPlay={() => setStatus("playing")}
        onPlaying={() => setStatus("playing")}
        onEnded={() => setStatus("ended")}
        onPlay={() => onPlayingChange?.(true)}
        onPause={() => onPlayingChange?.(false)}
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
