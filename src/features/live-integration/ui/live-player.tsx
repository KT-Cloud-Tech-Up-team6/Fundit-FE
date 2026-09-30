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
  coverPortrait = false,
  playButton = false,
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
  /**
   * 세로 원본이면 영역을 빈칸 없이 채운다(양옆이 조금 잘림). 가로 원본은 크게 잘리므로 그대로 맞춤이다.
   * 세로 영상 칸(데스크톱 #494)이나 화면 전체(모바일 #497)에 담는 화면만 켠다.
   */
  coverPortrait?: boolean;
  /**
   * 기본 컨트롤 대신 멈춰 있을 때만 가운데에 Figma 재생 버튼(play_btn 1408:43055)을 보이고, 영상을 누르면
   * 재생·일시정지한다. 화면 전체에 영상을 까는 모바일 LIVE가 쓴다(#497). 켜면 controls는 끈다.
   */
  playButton?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [portrait, setPortrait] = useState(false);
  /* 사용자가 멈췄거나 아직 재생하지 않은 상태. 가운데 재생 버튼(playButton)을 보일지 정한다. */
  const [paused, setPaused] = useState(true);
  const ivsPlayer = useRef<MediaPlayer | null>(null);
  function togglePlay() {
    const player = ivsPlayer.current;
    if (player) {
      /* SDK는 영상을 받은 뒤에야 요소를 재생해 그 사이에는 요소 이벤트가 없다. 누른 즉시 버튼·준비 안내에 반영한다. */
      const resume = player.isPaused();
      if (resume) player.play();
      else player.pause();
      setPaused(!resume);
      return;
    }
    const element = video.current;
    /* 방송 중 영상을 SDK를 불러오기 전(소스 없음)에 요소만 재생하면 SDK가 알지 못해 준비 안내에서 멈춘다. 그동안의
       누르기는 받지 않는다 — 재생 버튼이 그대로 남아 다시 누를 수 있다. */
    if (!element || (live && !element.src)) return;
    if (element.paused) void element.play().catch(() => {});
    else element.pause();
  }
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
    togglePlay,
  }));
  function reportProgress() {
    const element = video.current;
    if (!element) return;
    onProgress?.(element.currentTime, Number.isFinite(element.duration) ? element.duration : 0);
  }
  /* 원본 크기는 불러온 뒤와 화질이 바뀔 때(resize) 알 수 있다. */
  function readOrientation() {
    const element = video.current;
    if (element?.videoWidth) setPortrait(element.videoHeight > element.videoWidth);
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

  /* 가운데 재생 버튼과 영상 누르기(playButton)를 받는 때. 표시 조건은 여기 한곳에 모은다 — 종료·실패 안내가
     떠 있으면 그 안내를 가리지 않게 받지 않는다. */
  const playControl = playButton && !error && status !== "ended";
  /* IVS SDK는 재생을 누르기 전에는 영상을 받지 않아 준비 완료(canplay)가 오지 않는다. 멈춰 있는 동안 준비 안내를
     띄우면 재생 버튼이 영영 가려지므로 그동안은 버튼을 보이고, 누른 뒤 영상이 올 때까지만 준비 안내를 보인다. */
  const loading = !error && status === "loading" && !(playControl && paused);

  return (
    <div className="bg-layer-surface-disabled relative aspect-video overflow-hidden rounded-sm">
      <video
        ref={video}
        className={`h-full w-full ${coverPortrait && portrait ? "object-cover" : ""}`}
        controls={controls && !playButton}
        playsInline
        aria-label={`${title} 영상`}
        /* 재생 중 영상의 빈 곳을 누르면 멈춘다(멈춰 있으면 재생). 영상 위에 겹친 버튼·채팅은 이 영상에 닿지 않는다. */
        onClick={playControl ? togglePlay : undefined}
        onError={() => setError("영상 재생에 실패했습니다. 다시 시도해 주세요.")}
        onLoadedMetadata={() => {
          reportProgress();
          readOrientation();
        }}
        onResize={readOrientation}
        onTimeUpdate={reportProgress}
        onSeeked={reportProgress}
        onCanPlay={() => setStatus("playing")}
        onPlaying={() => setStatus("playing")}
        onEnded={() => setStatus("ended")}
        onPlay={() => {
          setPaused(false);
          onPlayingChange?.(true);
        }}
        onPause={() => {
          /* SDK는 다시 버퍼링하는 동안 요소를 멈췄다가 스스로 다시 재생한다. SDK가 재생 중으로 아는 이 멈춤에는
             재생 버튼을 보이지 않는다. */
          setPaused(ivsPlayer.current?.isPaused() ?? true);
          onPlayingChange?.(false);
        }}
      />
      {playControl && (
        /* Figma play_btn은 배경 없이 흰 20px 아이콘이다. 누르기 쉽게 44px 영역에 두고 영상 위 다른 아이콘처럼 옅은
           그림자를 준다. 재생 중에는 Figma처럼 보이지 않지만 키보드·보조기기로 멈출 수 있게 남기고, 키보드
           포커스일 때만 일시정지 아이콘을 보인다. */
        <button
          type="button"
          aria-label={paused ? "재생" : "일시정지"}
          className={`text-text-static-white absolute inset-0 m-auto grid size-11 place-items-center drop-shadow-[0_0_2px_rgba(0,0,0,0.3)] ${paused ? "" : "opacity-0 focus-visible:opacity-100"}`}
          onClick={togglePlay}
        >
          <span
            aria-hidden
            className="size-5 bg-current"
            style={{
              maskImage: `url(/images/buyer-live-replay/${paused ? "play" : "pause"}.svg)`,
              maskSize: "contain",
              maskPosition: "center",
              maskRepeat: "no-repeat",
            }}
          />
        </button>
      )}
      {loading && (
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
            onClick={() => {
              /* 새로 불러온 재생기는 재생 전이다(요소를 다시 불러와도 pause 이벤트는 오지 않는다). */
              setPaused(true);
              setAttempt((value) => value + 1);
            }}
          >
            영상 다시 시도
          </button>
        </div>
      )}
    </div>
  );
}
