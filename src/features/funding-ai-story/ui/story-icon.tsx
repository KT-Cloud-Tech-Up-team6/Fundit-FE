export function StoryIcon({ name, className = "size-4" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        maskImage: `url(/icons/funding-story/${name}.svg)`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
}
