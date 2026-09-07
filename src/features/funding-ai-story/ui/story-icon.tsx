/* ponytail: 이 10개는 shared/components/ui/icon.tsx가 이미 같은 SVG를 갖고 있다(스토리
   에디터 툴바용). 두 벌 두지 않고 여기서 그 파일을 가리킨다. 나머지(attach, send,
   layout-*)는 이 기능 전용이라 public/icons/funding-story에 그대로 둔다. */
const sharedIconNames: Record<string, string> = {
  back: "arrow_left",
  bold: "bold",
  italic: "italic",
  "align-left": "align_left",
  "align-center": "align_center",
  "align-right": "align_right",
  image: "insert_image",
  video: "insert_video",
  quote: "insert_quote",
  palette: "color_palette",
};

export function StoryIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  const sharedName = sharedIconNames[name];
  const src = sharedName ? `/icons/${sharedName}.svg` : `/icons/funding-story/${name}.svg`;

  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
