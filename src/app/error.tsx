"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-label-l text-text-default">ERROR</p>
        <h1 className="text-display-s mt-2">화면을 불러오지 못했습니다.</h1>
        <button
          onClick={reset}
          className="bg-layer-surface-primary text-body-strong text-text-inverse mt-6 rounded-full px-5 py-3"
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
