"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getStreamInfo } from "@/entities/live/api/live-session-api";
import { TextButton } from "@/shared/components/ui/text-button";

/* 길이도 드러나지 않게 키 길이와 무관한 고정 개수로 가린다. */
const MASKED_KEY = "•".repeat(16);

/**
 * 송출 주소·스트림 키(BE #147). Figma 판매자 LIVE 흐름에는 이 자리가 없어, 원래 "스트림 키 미제공"
 * 안내가 있던 생성 확인 화면 아래에 둔다. 키는 옆 사람이나 화면 공유에 노출되지 않게 기본으로 가린다.
 * 불러오지 못해도 LIVE 시작은 막지 않는다 — 송출 프로그램에 이미 넣어 둔 판매자도 있다.
 */
export function StreamInfo({ owner, liveId }: { owner: string; liveId: string }) {
  const info = useQuery({
    queryKey: ["live-stream-info", owner, liveId],
    queryFn: ({ signal }) => getStreamInfo(liveId, signal),
  });
  const [revealed, setRevealed] = useState(false);
  const [notice, setNotice] = useState("");

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label}를 복사했습니다.`);
    } catch {
      /* 가린 키는 화면에서 고를 수 없으니 먼저 보이게 하라고 안내한다. */
      const how = label === "스트림 키" && !revealed ? "보기를 누른 뒤 직접" : "직접 선택해";
      setNotice(`${label}를 복사하지 못했습니다. ${how} 복사해 주세요.`);
    }
  }

  return (
    <section aria-label="송출 정보" className="text-caption-s mt-3 shrink-0">
      {info.isPending ? (
        <p role="status" className="text-text-secondary">
          송출 정보를 불러오고 있습니다.
        </p>
      ) : info.isError ? (
        <p role="alert" className="text-text-secondary">
          송출 정보를 불러오지 못했습니다.{" "}
          <button type="button" className="underline" onClick={() => void info.refetch()}>
            다시 시도
          </button>
        </p>
      ) : (
        <dl className="bg-layer-surface-disabled flex flex-col gap-2 rounded-xs px-3 py-2">
          {/* 모달 높이가 고정이라 값은 한 줄로 두고 길면 말줄임한다. 전체 값은 복사로 쓴다
              (dev 스텁 키는 약 78자, 실제 IVS 키도 두 줄로 꺾일 수 있다). */}
          <div className="flex items-center gap-3">
            <dt className="text-text-secondary w-16 shrink-0">송출 주소</dt>
            <dd className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-text-default min-w-0 flex-1 truncate">
                {info.data.ingestEndpoint}
              </span>
              <TextButton
                showIcon={false}
                aria-label="송출 주소 복사"
                onClick={() => void copy("송출 주소", info.data.ingestEndpoint)}
              >
                복사
              </TextButton>
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="text-text-secondary w-16 shrink-0">스트림 키</dt>
            <dd className="flex min-w-0 flex-1 items-center gap-3">
              <span className="text-text-default min-w-0 flex-1 truncate">
                {revealed ? (
                  info.data.streamKey
                ) : (
                  <>
                    <span aria-hidden>{MASKED_KEY}</span>
                    <span className="sr-only">가려져 있음</span>
                  </>
                )}
              </span>
              <TextButton
                showIcon={false}
                aria-label={revealed ? "스트림 키 숨기기" : "스트림 키 보기"}
                onClick={() => setRevealed(!revealed)}
              >
                {revealed ? "숨기기" : "보기"}
              </TextButton>
              <TextButton
                showIcon={false}
                aria-label="스트림 키 복사"
                onClick={() => void copy("스트림 키", info.data.streamKey)}
              >
                복사
              </TextButton>
            </dd>
          </div>
        </dl>
      )}
      {/* 생성 확인 모달은 높이가 고정이라 복사 결과는 줄을 늘리지 않고 안내 자리에 바꿔 적는다. */}
      <p role="status" className="text-text-secondary mt-1.5">
        {notice || "OBS 등 송출 프로그램에 넣고 LIVE를 시작하면 방송 콘솔로 이동합니다."}
      </p>
    </section>
  );
}
