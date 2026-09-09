/* SVG를 mask로 깔고 색은 bg-current로 상속받는다. SearchField와 같은 방식이라
   파일에 박힌 stroke 색과 무관하게 토큰 색을 따른다. */
const iconFiles = {
  arrowDown: "arrow_down",
  resetAmount: "reset_amount",
  plus: "plus",
  plusCircle: "plus_circle",
  plusSquare: "plus_square",
  gift: "gift",
  checkboxEmpty: "checkbox_empty",
  closeSmall: "close_small",
  alignCenter: "align_center",
  alignLeft: "align_left",
  alignRight: "align_right",
  archive: "archive_box",
  arrowLeft: "arrow_left",
  avatar: "avatar",
  bell: "ringing_bell",
  bold: "bold",
  chat: "chat",
  close: "remove_cancel",
  colorPalette: "color_palette",
  funding: "funding",
  insertImage: "insert_image",
  insertQuote: "insert_quote",
  insertVideo: "insert_video",
  italic: "italic",
  live: "live_video",
  next: "next",
  people: "people",
  play: "play",
  previous: "previous",
  profile: "profile",
  send: "send",
  settings: "cog_setting",
  stream: "stream",
  swap: "refresh",
  viewers: "viewers",
  warning: "warning",
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
