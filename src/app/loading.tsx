export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl animate-pulse px-4 py-12 sm:px-6"
      aria-label="페이지 로딩 중"
    >
      <div className="h-64 rounded-3xl bg-slate-200" />
    </div>
  );
}
