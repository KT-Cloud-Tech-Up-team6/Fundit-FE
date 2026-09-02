/* SVG를 mask로 깔고 색은 bg-current로 상속받는다. SearchField와 같은 방식이라
   파일에 박힌 stroke 색과 무관하게 토큰 색을 따른다. */
const iconFiles = {
  archive: "archive_box",
  bell: "ringing_bell",
  live: "live_video",
  people: "people",
  profile: "profile",
  settings: "cog_setting",
  swap: "refresh",
} as const;

export type IconName = keyof typeof iconFiles;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      aria-hidden
      className={["bg-current", className].filter(Boolean).join(" ")}
      style={{
        maskImage: `url(/icons/${iconFiles[name]}.svg)`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat",
      }}
    />
  );
}
