/**
 * 시청·다시보기 Q&A가 함께 쓰는 라이브 화면 아이콘. `buyer-live-room.tsx`에 두면
 * 그 파일이 `live-questions-sheet.tsx`를 부르고 시트가 다시 이 아이콘을 불러 순환한다.
 */
export function RoomIcon({
  name,
  className = "size-7",
}: {
  name: "expand" | "question" | "question-filled" | "share" | "heart" | "viewers";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(/icons/${name === "viewers" ? "buyer-live/viewers" : `buyer-live-room/${name}`}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}
