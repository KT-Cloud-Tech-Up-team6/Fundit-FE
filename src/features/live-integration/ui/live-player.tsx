"use client";

import type { MediaPlayer } from "amazon-ivs-player";
import {
  useEffect,
  useEffectEvent,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
} from "react";

/**
 * 바깥에서 재생 위치·재생 여부·소리를 바꾸기 위한 손잡이. 다시보기 재생바와 구간 탐색, 모바일 LIVE의 소리 버튼이
 * 쓴다.
 */
export type LivePlayerHandle = {
  seek: (sec: number) => void;
  togglePlay: () => void;
  toggleSound: () => void;
};

/*
 * 방송 중 재생 주소가 404면 아직 송출 전이다(IVS: 스트림이 없거나 오프라인). 재생 실패 대신 송출 대기로 두고
 * 이 간격으로 다시 받는다(#492). IVS SDK는 404를 스스로 다시 받지 않는다. 저지연 IVS의 송출→시청 지연이
 * 5초 안쪽이라 같은 5초면 송출 시작을 그보다 크게 늦게 알지 않고, 시청자마다 5초에 매니페스트 한 번이라 부담도 작다.
 */
const STREAM_RETRY_MS = 5_000;

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
  waitingMessage = "영상을 준비하는 중입니다.",
  muted = false,
  ended = false,
  onSoundChange,
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
  /** 방송 중인데 아직 송출 전일 때 안내. 시청자는 준비 중 안내 그대로이고 판매자 콘솔은 송출을 시작하라고 알린다. */
  waitingMessage?: string;
  /** 소리 없이 시작한다. 기본 컨트롤로 켤 수 있다. 판매자 콘솔은 송출 소리가 다시 섞이지 않게 끈다. */
  muted?: boolean;
  /** 방송이 끝났다(판매자 콘솔만 안다). 송출 대기 중이면 더 받지 않고 종료 안내를 보인다. */
  ended?: boolean;
  /** 소리가 꺼지고 켜질 때마다 알린다(true면 음소거). 기본 컨트롤이 없는 모바일 LIVE가 소리 버튼을 그리는 데 쓴다. */
  onSoundChange?: (muted: boolean) => void;
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
    /* 방송 중 영상은 SDK를 불러오기 전(소스 없음)의 누르기를 받지 않는다(#497). 재생 버튼이 그대로 남아 SDK를 받은 뒤
       다시 누르면 SDK로 재생한다. */
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
    /* 소리 버튼은 소리만 켜고 끈다. 누르는 것이 사용자 조작이라 음소거로 자동 재생 중에 켜도 브라우저가 막지 않는다
       (#549). 재생·멈춤은 영상 누르기와 가운데 버튼이 맡는다. */
    toggleSound() {
      const player = ivsPlayer.current;
      if (player) player.setMuted(!player.isMuted());
      else if (video.current) video.current.muted = !video.current.muted;
    },
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
  /* blocked: 브라우저가 자동 재생을 막아 재생 전으로 멈춰 있다(#549). 준비 중 안내 대신 재생 조작을 보인다. */
  const [status, setStatus] = useState<"loading" | "waiting" | "blocked" | "playing" | "ended">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  /* 종료는 재시도 때만 본다. 바뀌어도 재생기를 다시 불러오지 않게 effect 의존성에서 뺀다. */
  const broadcastEnded = useEffectEvent(() => ended);

  useEffect(() => {
    const element = video.current;
    if (!element || !src) return;
    let hls: { destroy(): void } | undefined;
    let syncIvs: ((event: Event) => void) | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    setError("");
    setStatus("loading");
    /* 시작할 때만 끄고 기본 컨트롤로 켜면 그대로 둔다. IVS 경로는 SDK로도 끈다. */
    if (muted) element.muted = true;

    /* 송출 대기 안내를 두고 잠시 뒤 다시 받는다. 화면을 떠나거나 주소가 바뀌면 아래 정리에서 멈춘다. */
    function waitForStream(reload: () => void) {
      setStatus("waiting");
      retry = setTimeout(() => {
        if (broadcastEnded()) setStatus("ended");
        else reload();
      }, STREAM_RETRY_MS);
    }

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
            if (cancelled || !data.fatal) return;
            const offline =
              data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR && data.response?.code === 404;
            if (live && offline) {
              /* 송출이 시작돼 받아지면 조작 없이 재생한다. 브라우저가 막으면 멈춘 채로 둔다(기본 컨트롤로 재생). */
              target.autoplay = true;
              waitForStream(() => instance.loadSource(src));
            } else setError("영상 재생에 실패했습니다. 다시 시도해 주세요.");
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
          if (muted) player.setMuted(true);
          /* 방송 중 영상은 열자마자 재생한다(#549). SDK는 재생 요청 전에는 영상을 받지 않아, 자동 재생이 없으면 준비 중
             안내가 컨트롤 위에 남아 송출이 안 되는 것처럼 보인다. 브라우저가 소리를 막으면 SDK가 음소거로 재생하고,
             소리는 기본 컨트롤(모바일은 소리 버튼, toggleSound)로 켠다. */
          player.setAutoplay(true);
          player.addEventListener(ivs.PlayerEventType.ERROR, (playerError) => {
            if (cancelled) return;
            if (playerError.type === ivs.ErrorType.NOT_AVAILABLE && playerError.code === 404) {
              /* 송출이 시작돼 받아지면 위의 자동 재생으로 조작 없이 재생한다(재생되면 canplay가 대기 안내를 거둔다). */
              waitForStream(() => player.load(src));
            } else setError("영상 재생에 실패했습니다. 다시 시도해 주세요.");
          });
          /* 스트림은 받았지만 자동 재생이 모두 막혔다. SDK는 소리 있는 자동 재생이 막히면 스스로 음소거해 다시
             재생하고, 그마저 막혀야 이 이벤트를 보낸다(이때 SDK는 음소거 상태). 오류 없이 재생 전으로 두어 기본
             컨트롤·가운데 버튼으로 재생하고, 직접 누른 재생은 소리와 함께 시작하도록 음소거를 되돌린다(#549).
             READY에서 거두면 자동 재생이 시작되기 전에 가운데 버튼이 잠깐 보인다. */
          player.addEventListener(ivs.PlayerEventType.PLAYBACK_BLOCKED, () => {
            if (cancelled) return;
            if (!muted) player.setMuted(false);
            setStatus((value) => (value === "waiting" || value === "loading" ? "blocked" : value));
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
          /* SDK를 불러오기 전에 누른 기본 컨트롤 재생은 영상 요소만 받아 SDK가 모른다. */
          if (!element.paused) player.play();
        })
        .catch(() => {
          if (!cancelled) setError("영상 재생기를 불러오지 못했습니다.");
        });
    }
    return () => {
      cancelled = true;
      clearTimeout(retry);
      hls?.destroy();
      if (syncIvs) {
        element.removeEventListener("play", syncIvs);
        element.removeEventListener("pause", syncIvs);
      }
      ivsPlayer.current?.delete();
      ivsPlayer.current = null;
      element.autoplay = false;
      element.removeAttribute("src");
      element.load();
    };
  }, [src, attempt, live, muted]);

  /* 가운데 재생 버튼과 영상 누르기(playButton)를 받는 때. 표시 조건은 여기 한곳에 모은다 — 종료·실패·송출 대기
     안내가 떠 있으면 그 안내를 가리지 않게 받지 않는다. */
  const playControl = playButton && !error && status !== "ended" && status !== "waiting";
  /* IVS SDK는 재생을 누르기 전에는 영상을 받지 않아 준비 완료(canplay)가 오지 않는다. 멈춰 있는 동안 준비 안내를
     띄우면 재생 버튼이 영영 가려지므로 그동안은 버튼을 보이고, 누른 뒤 영상이 올 때까지만 준비 안내를 보인다. */
  const loading = !error && status === "loading" && !(playControl && paused);
  /* 송출 전(재생 주소 404)이라 다시 받는 중이다(#492). */
  const waiting = !error && status === "waiting";

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
        onVolumeChange={() => onSoundChange?.(video.current?.muted ?? false)}
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
      {(loading || waiting) && (
        <p className="text-text-static-white pointer-events-none absolute inset-0 grid place-items-center bg-[rgba(0,0,0,0.5)] p-4 text-center break-keep">
          {waiting ? waitingMessage : "영상을 준비하는 중입니다."}
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
